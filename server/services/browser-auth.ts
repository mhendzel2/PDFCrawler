import fs from 'fs';
import path from 'path';
import os from 'os';

export interface BrowserSession {
  sessionId: string;
  cookies: string[];
  userAgent: string;
  lastAuthenticated: number;
  isValid: boolean;
}

export class BrowserAuthService {
  private sessionsFile: string;
  private sessions: Map<string, BrowserSession> = new Map();

  constructor() {
    this.sessionsFile = path.join(os.homedir(), '.pubmed-auth-sessions.json');
    this.loadSessions();
  }

  private loadSessions(): void {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf8');
        const sessions = JSON.parse(data);
        
        for (const [id, session] of Object.entries(sessions)) {
          // Only load sessions less than 2 hours old (EZProxy session timeout)
          const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
          if ((session as any).lastAuthenticated > twoHoursAgo) {
            this.sessions.set(id, session as BrowserSession);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved sessions:', error);
    }
  }

  private saveSessions(): void {
    try {
      const sessionsObj = Object.fromEntries(this.sessions);
      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessionsObj, null, 2));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  storeBrowserSession(sessionId: string, cookies: string[], userAgent: string): void {
    const session: BrowserSession = {
      sessionId,
      cookies: cookies.filter(cookie => 
        cookie.includes('ezproxy') || 
        cookie.includes('session') || 
        cookie.includes('auth')
      ),
      userAgent,
      lastAuthenticated: Date.now(),
      isValid: true
    };

    this.sessions.set(sessionId, session);
    this.saveSessions();
    console.log(`Browser session stored for ${sessionId}`);
  }

  getValidSession(sessionId: string): BrowserSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if session is still valid (less than 2 hours old)
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    if (session.lastAuthenticated < twoHoursAgo) {
      session.isValid = false;
      this.sessions.delete(sessionId);
      this.saveSessions();
      return null;
    }

    return session;
  }

  generateAuthenticatedURLs(doi?: string, pmcid?: string, pmid?: string): string[] {
    const ezproxyPrefix = 'https://login.ezproxy.library.ualberta.ca/login?url=';
    const urls: string[] = [];

    if (doi) {
      const doiUrls = [
        `https://doi.org/${doi}`,
        `https://link.springer.com/content/pdf/${doi}.pdf`,
        `https://onlinelibrary.wiley.com/doi/pdf/${doi}`,
        `https://www.nature.com/articles/${doi}.pdf`,
        `https://pubs.acs.org/doi/pdf/${doi}`,
        `https://science.sciencemag.org/content/early/recent`,
        `https://www.cell.com/action/showPdf?pii=${doi.replace('10.1016/j.', '').replace('.', '')}`
      ];
      
      doiUrls.forEach(url => {
        urls.push(ezproxyPrefix + encodeURIComponent(url));
      });
    }

    if (pmcid) {
      urls.push(ezproxyPrefix + encodeURIComponent(`https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`));
    }

    return urls;
  }

  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.saveSessions();
  }

  getAllValidSessions(): BrowserSession[] {
    const validSessions: BrowserSession[] = [];
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);

    const sessionsArray = Array.from(this.sessions.entries());
    for (const [id, session] of sessionsArray) {
      if (session.lastAuthenticated > twoHoursAgo) {
        validSessions.push(session);
      } else {
        this.sessions.delete(id);
      }
    }

    this.saveSessions();
    return validSessions;
  }
}

export const browserAuthService = new BrowserAuthService();