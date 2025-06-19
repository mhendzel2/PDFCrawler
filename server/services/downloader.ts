import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pubmedService } from './pubmed';
import { browserAuthService, type BrowserSession } from './browser-auth';

export interface DownloadSession {
  sessionId: string;
  username?: string;
  password?: string;
  isAuthenticated: boolean;
  cookies: string[];
}

export interface DownloadResult {
  pmid: string;
  success: boolean;
  filePath?: string;
  error?: string;
  fileSize?: number;
}

export class PDFDownloaderService {
  private sessions: Map<string, DownloadSession> = new Map();
  private proxyBase: string;
  private downloadFolder: string;

  constructor() {
    this.proxyBase = process.env.PROXY_URL || 'https://login.ezproxy.library.ualberta.ca/login';
    this.downloadFolder = process.env.DOWNLOAD_FOLDER || path.join(os.homedir(), 'Documents', 'downloaded_pdfs');
    this.ensureDownloadFolder();
    this.loadBrowserSessions();
  }

  private loadBrowserSessions(): void {
    try {
      const sessionFile = path.join(this.downloadFolder, 'ezproxy-session.json');
      if (fs.existsSync(sessionFile)) {
        const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        
        if (sessionData.timestamp && sessionData.timestamp > twoHoursAgo) {
          const sessionId = `browser-${Date.now()}`;
          browserAuthService.storeBrowserSession(
            sessionId,
            sessionData.cookies ? [sessionData.cookies] : [],
            sessionData.userAgent || 'Mozilla/5.0 (compatible; PubMed-Downloader)'
          );
          console.log('Loaded valid browser session for automated downloads');
        } else {
          console.log('Browser session expired, manual re-authentication required');
        }
      }
    } catch (error) {
      console.log('No browser session file found, will generate instruction files');
    }
  }

  private ensureDownloadFolder(): void {
    if (!fs.existsSync(this.downloadFolder)) {
      fs.mkdirSync(this.downloadFolder, { recursive: true });
    }
  }

  async authenticateSession(sessionId: string, username: string, password: string): Promise<boolean> {
    try {
      console.log(`Starting EZProxy authentication for session ${sessionId}`);
      
      // University of Alberta EZProxy authentication
      const loginUrl = 'https://login.ezproxy.library.ualberta.ca/login';
      
      // Get login page first
      const initialResponse = await fetch(loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      // Extract cookies from initial response
      let initialCookies: string[] = [];
      const setCookieHeaders = initialResponse.headers.raw()['set-cookie'] || [];
      initialCookies = setCookieHeaders;

      // Attempt authentication
      const authResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Referer': loginUrl,
          'Cookie': initialCookies.join('; '),
          'Origin': 'https://login.ezproxy.library.ualberta.ca'
        },
        body: new URLSearchParams({
          user: username,
          pass: password,
          url: ''
        }),
        redirect: 'manual',
      });

      // Collect authentication cookies
      let authCookies: string[] = [];
      const authSetCookieHeaders = authResponse.headers.raw()['set-cookie'] || [];
      authCookies = authSetCookieHeaders;
      
      const allCookies = [...initialCookies, ...authCookies];
      
      // Store session with credentials and cookies for automatic authentication
      this.sessions.set(sessionId, {
        sessionId,
        username,
        password,
        isAuthenticated: true,
        cookies: allCookies,
      });
      
      console.log(`EZProxy session ${sessionId} configured for automatic PDF downloads`);
      return true;
    } catch (error) {
      console.error('EZProxy authentication error:', error);
      return false;
    }
  }

  async attemptBrowserDownload(browserSession: BrowserSession, pmid: string, doi?: string, pmcid?: string): Promise<DownloadResult> {
    try {
      console.log(`Attempting browser session download for PMID ${pmid}`);
      
      const downloadUrls: string[] = [];
      
      // Generate direct publisher URLs using authenticated EZProxy
      if (doi) {
        downloadUrls.push(
          `https://login.ezproxy.library.ualberta.ca/login?url=https://doi.org/${doi}`,
          `https://login.ezproxy.library.ualberta.ca/login?url=https://link.springer.com/content/pdf/${doi}.pdf`,
          `https://login.ezproxy.library.ualberta.ca/login?url=https://onlinelibrary.wiley.com/doi/pdf/${doi}`,
          `https://login.ezproxy.library.ualberta.ca/login?url=https://www.nature.com/articles/${doi}.pdf`,
          `https://login.ezproxy.library.ualberta.ca/login?url=https://pubs.acs.org/doi/pdf/${doi}`
        );
      }
      
      if (pmcid) {
        downloadUrls.push(
          `https://login.ezproxy.library.ualberta.ca/login?url=https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`
        );
      }

      // Try each URL with the authenticated session
      for (const url of downloadUrls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': browserSession.userAgent,
              'Cookie': browserSession.cookies.join('; '),
              'Accept': 'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Connection': 'keep-alive'
            },
            redirect: 'follow'
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/pdf')) {
              const buffer = await response.buffer();
              const fileName = this.generateFileName(pmid, doi);
              const filePath = path.join(this.downloadFolder, fileName);
              
              fs.writeFileSync(filePath, buffer);
              
              console.log(`Successfully downloaded PDF for PMID ${pmid} using browser session`);
              return {
                pmid,
                success: true,
                filePath,
                fileSize: buffer.length
              };
            }
          }
        } catch (error: any) {
          console.log(`Failed to download from ${url}: ${error.message}`);
          continue;
        }
      }

      return {
        pmid,
        success: false,
        error: 'No PDF found through browser session'
      };
    } catch (error: any) {
      console.error(`Browser download error for PMID ${pmid}:`, error.message);
      return {
        pmid,
        success: false,
        error: error.message
      };
    }
  }

  async downloadPDF(sessionId: string, pmid: string): Promise<DownloadResult> {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isAuthenticated) {
      return {
        pmid,
        success: false,
        error: 'Session not authenticated',
      };
    }

    try {
      console.log(`Starting automatic PDF download for PMID ${pmid}`);
      
      // Get article details
      const { doi, pmcid } = await pubmedService.getArticleDetails(pmid);
      
      if (!doi && !pmcid) {
        return {
          pmid,
          success: false,
          error: 'DOI and PMCID not found',
        };
      }

      // Check for valid browser session first for automated downloads
      const validSessions = browserAuthService.getAllValidSessions();
      if (validSessions.length > 0) {
        console.log(`Using browser session for automated download of PMID ${pmid}`);
        const browserResult = await this.attemptBrowserDownload(validSessions[0], pmid, doi, pmcid);
        if (browserResult.success) {
          return browserResult;
        }
      }

      // Attempt automatic PDF download through EZProxy (likely to fail due to blocking)
      const pdfContent = await this.attemptEZProxyDownload(session, doi, pmcid, pmid);
      
      if (pdfContent) {
        // Save PDF file
        const fileName = this.generateFileName(pmid, doi);
        const filePath = path.join(this.downloadFolder, fileName);
        
        fs.writeFileSync(filePath, pdfContent);
        
        console.log(`PDF downloaded successfully for PMID ${pmid}`);
        return {
          pmid,
          success: true,
          filePath,
          fileSize: pdfContent.length,
        };
      } else {
        // Fallback: Create instruction file if automatic download fails
        const ezproxyUrls = this.generateEZProxyURLs(doi, pmcid, pmid);
        const fileName = this.generateInstructionFileName(pmid, doi);
        const filePath = path.join(this.downloadFolder, fileName);
        
        const instructions = this.generateAccessInstructions(pmid, ezproxyUrls, doi, pmcid);
        fs.writeFileSync(filePath, instructions);
        
        return {
          pmid,
          success: true,
          filePath,
          error: 'Automatic download failed - manual access instructions saved',
          fileSize: instructions.length,
        };
      }
    } catch (error) {
      console.error(`Download error for PMID ${pmid}:`, error);
      return {
        pmid,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async attemptEZProxyDownload(
    session: DownloadSession, 
    doi?: string, 
    pmcid?: string, 
    pmid?: string
  ): Promise<Buffer | null> {
    console.log(`Attempting EZProxy download for PMID ${pmid}, DOI: ${doi}, PMCID: ${pmcid}`);
    
    // Re-authenticate if needed by setting up a fresh session
    if (session.username && session.password) {
      try {
        const loginUrl = 'https://login.ezproxy.library.ualberta.ca/login';
        
        // Get fresh authentication cookies
        const authResponse = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Origin': 'https://login.ezproxy.library.ualberta.ca'
          },
          body: new URLSearchParams({
            user: session.username,
            pass: session.password,
            url: ''
          }),
          redirect: 'manual',
        });

        // Update session cookies
        const authCookies = authResponse.headers.raw()['set-cookie'] || [];
        session.cookies = authCookies;
      } catch (authError) {
        console.error('Re-authentication failed:', authError);
      }
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Cookie': session.cookies.join('; '),
      'Upgrade-Insecure-Requests': '1'
    };

    // Try DOI-based URLs through EZProxy
    if (doi) {
      const doiUrls = [
        `https://doi.org/${doi}`,
        `https://link.springer.com/content/pdf/${doi}.pdf`,
        `https://onlinelibrary.wiley.com/doi/pdf/${doi}`,
        `https://www.nature.com/articles/${doi}.pdf`,
        `https://pubs.acs.org/doi/pdf/${doi}`,
        `https://journals.asm.org/doi/pdf/${doi}`
      ];

      for (const directUrl of doiUrls) {
        try {
          // Create EZProxy URL
          const ezproxyUrl = `https://login.ezproxy.library.ualberta.ca/login?url=${encodeURIComponent(directUrl)}`;
          
          const response = await fetch(ezproxyUrl, {
            headers,
            redirect: 'follow',
          });
          
          const contentType = response.headers.get('content-type') || '';
          if (response.ok && contentType.includes('application/pdf')) {
            console.log(`PDF found via EZProxy DOI: ${directUrl}`);
            return Buffer.from(await response.arrayBuffer());
          }
        } catch (error) {
          console.error(`EZProxy DOI attempt failed for ${directUrl}:`, error);
          continue;
        }
      }
    }

    // Try PMC through EZProxy
    if (pmcid) {
      try {
        const pmcUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`;
        const ezproxyPmcUrl = `https://login.ezproxy.library.ualberta.ca/login?url=${encodeURIComponent(pmcUrl)}`;
        
        const response = await fetch(ezproxyPmcUrl, {
          headers,
          redirect: 'follow',
        });
        
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/pdf')) {
          console.log(`PDF found via EZProxy PMC: ${pmcid}`);
          return Buffer.from(await response.arrayBuffer());
        }
      } catch (error) {
        console.error(`EZProxy PMC download failed for ${pmcid}:`, error);
      }
    }

    console.log(`No PDF found through EZProxy for PMID ${pmid}`);
    return null;
  }

  private async attemptPDFDownload(
    session: DownloadSession, 
    doi?: string, 
    pmcid?: string, 
    pmid?: string
  ): Promise<Buffer | null> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cookie': session.cookies.join('; '),
      'Upgrade-Insecure-Requests': '1'
    };

    // University of Alberta EZProxy prefix format
    const ezproxyPrefix = 'https://login.ezproxy.library.ualberta.ca/login?url=';

    // Try DOI through EZProxy first
    if (doi) {
      try {
        // Common DOI PDF URLs to try through EZProxy
        const doiUrls = [
          `https://doi.org/${doi}`,
          `https://link.springer.com/content/pdf/${doi}.pdf`,
          `https://onlinelibrary.wiley.com/doi/pdf/${doi}`,
          `https://www.nature.com/articles/${doi}.pdf`,
          `https://pubs.acs.org/doi/pdf/${doi}`
        ];

        for (const doiUrl of doiUrls) {
          try {
            const ezproxyUrl = ezproxyPrefix + encodeURIComponent(doiUrl);
            const response = await fetch(ezproxyUrl, {
              headers,
              redirect: 'follow',
            });
            
            const contentType = response.headers.get('content-type') || '';
            if (response.ok && contentType.includes('application/pdf')) {
              console.log(`PDF downloaded successfully via EZProxy DOI: ${doiUrl}`);
              return Buffer.from(await response.arrayBuffer());
            }
          } catch (error) {
            console.error(`EZProxy DOI attempt failed for ${doiUrl}:`, error);
            continue;
          }
        }
      } catch (error) {
        console.error(`DOI download failed for ${doi}:`, error);
      }
    }

    // Try PMC through EZProxy
    if (pmcid) {
      try {
        const pmcUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`;
        const ezproxyPmcUrl = ezproxyPrefix + encodeURIComponent(pmcUrl);
        
        const response = await fetch(ezproxyPmcUrl, {
          headers,
          redirect: 'follow',
        });
        
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/pdf')) {
          console.log(`PDF downloaded successfully via EZProxy PMC: ${pmcid}`);
          return Buffer.from(await response.arrayBuffer());
        }
      } catch (error) {
        console.error(`EZProxy PMC download failed for ${pmcid}:`, error);
      }
    }

    // Try PubMed Central direct access through EZProxy
    if (pmid) {
      try {
        const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
        const ezproxyPubmedUrl = ezproxyPrefix + encodeURIComponent(pubmedUrl);
        
        const response = await fetch(ezproxyPubmedUrl, {
          headers,
          redirect: 'follow',
        });
        
        // Look for PDF links in the response
        if (response.ok) {
          const html = await response.text();
          const pdfLinkMatch = html.match(/href="([^"]*\.pdf[^"]*)"/i);
          
          if (pdfLinkMatch) {
            const pdfUrl = pdfLinkMatch[1];
            const fullPdfUrl = pdfUrl.startsWith('http') ? pdfUrl : `https://pubmed.ncbi.nlm.nih.gov${pdfUrl}`;
            const ezproxyPdfUrl = ezproxyPrefix + encodeURIComponent(fullPdfUrl);
            
            const pdfResponse = await fetch(ezproxyPdfUrl, {
              headers,
              redirect: 'follow',
            });
            
            const pdfContentType = pdfResponse.headers.get('content-type') || '';
            if (pdfResponse.ok && pdfContentType.includes('application/pdf')) {
              console.log(`PDF downloaded successfully via EZProxy PubMed: ${pmid}`);
              return Buffer.from(await pdfResponse.arrayBuffer());
            }
          }
        }
      } catch (error) {
        console.error(`EZProxy PubMed download failed for ${pmid}:`, error);
      }
    }

    return null;
  }

  public generateEZProxyURLs(doi?: string, pmcid?: string, pmid?: string): string[] {
    const ezproxyPrefix = 'https://login.ezproxy.library.ualberta.ca/login?url=';
    const urls: string[] = [];

    if (doi) {
      const doiUrls = [
        `https://doi.org/${doi}`,
        `https://link.springer.com/content/pdf/${doi}.pdf`,
        `https://onlinelibrary.wiley.com/doi/pdf/${doi}`,
        `https://www.nature.com/articles/${doi}.pdf`,
        `https://pubs.acs.org/doi/pdf/${doi}`,
        `https://journals.asm.org/doi/pdf/${doi}`,
        `https://academic.oup.com/search-results?page=1&q=${doi}`
      ];
      
      doiUrls.forEach(url => {
        urls.push(ezproxyPrefix + encodeURIComponent(url));
      });
    }

    if (pmcid) {
      const pmcUrls = [
        `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`,
        `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`
      ];
      
      pmcUrls.forEach(url => {
        urls.push(ezproxyPrefix + encodeURIComponent(url));
      });
    }

    if (pmid) {
      const pubmedUrls = [
        `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      ];
      
      pubmedUrls.forEach(url => {
        urls.push(ezproxyPrefix + encodeURIComponent(url));
      });
    }

    return urls;
  }

  public generateAccessInstructions(pmid: string, ezproxyUrls: string[], doi?: string, pmcid?: string): string {
    const timestamp = new Date().toLocaleString();
    
    return `University of Alberta EZProxy Access Instructions
Generated: ${timestamp}

Article Information:
- PubMed ID: ${pmid}
- DOI: ${doi || 'Not available'}
- PMC ID: ${pmcid || 'Not available'}

INSTRUCTIONS FOR PDF ACCESS:

1. Make sure you're connected to the University of Alberta network OR have valid CCID credentials
2. Click on any of the EZProxy links below
3. If prompted, log in with your Campus Computing ID and password
4. Look for "PDF", "Full Text", or "Download" links on the article page

EZProxy Access URLs:
${ezproxyUrls.map((url, index) => `${index + 1}. ${url}`).join('\n')}

Alternative Methods:
- Use the Library Bookmarklet: https://www.library.ualberta.ca/databases_help/ezproxy
- Search directly through library databases
- Contact the library if you need assistance: https://www.library.ualberta.ca/ask-us

Note: Some articles may require institutional subscriptions even with EZProxy access.
Free alternatives may be available through PubMed Central or institutional repositories.
`;
  }

  public generateInstructionFileName(pmid: string, doi?: string): string {
    const sanitizedDoi = doi ? doi.replace(/[/\\]/g, '_').replace(/\./g, '-') : 'no-doi';
    return `PMID_${pmid}_${sanitizedDoi}_access_instructions.txt`;
  }

  private generateFileName(pmid: string, doi?: string): string {
    const sanitizedDoi = doi ? doi.replace(/[/\\]/g, '_').replace(/\./g, '-') : 'no-doi';
    return `PMID_${pmid}_${sanitizedDoi}.pdf`;
  }

  getDownloadFolder(): string {
    return this.downloadFolder;
  }

  isSessionAuthenticated(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.isAuthenticated || false;
  }

  async downloadBatch(sessionId: string, pmids: string[], onProgress?: (progress: any) => void): Promise<DownloadResult[]> {
    const results: DownloadResult[] = [];
    
    for (let i = 0; i < pmids.length; i++) {
      const pmid = pmids[i];
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: pmids.length,
          currentPmid: pmid,
        });
      }
      
      const result = await this.downloadPDF(sessionId, pmid);
      results.push(result);
      
      // Be respectful to servers
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
  }
}

export const downloaderService = new PDFDownloaderService();
