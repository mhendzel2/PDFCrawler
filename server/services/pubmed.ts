import fetch from 'node-fetch';
import * as xml2js from 'xml2js';
import { InsertSearchResult } from '@shared/schema';

export interface PubMedSearchParams {
  query: string;
  dateFrom?: string;
  dateTo?: string;
  maxResults?: number;
  retstart?: number;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract: string;
  doi?: string;
  pmcid?: string;
}

export class PubMedService {
  private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

  async searchArticles(params: PubMedSearchParams): Promise<PubMedArticle[]> {
    try {
      // Step 1: Search for PMIDs
      const searchUrl = this.buildSearchUrl(params);
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json() as any;
      
      if (!searchData.esearchresult || !searchData.esearchresult.idlist) {
        return [];
      }
      
      const pmids = searchData.esearchresult.idlist;
      if (pmids.length === 0) {
        return [];
      }
      
      // Step 2: Fetch detailed information for each PMID
      const articles = await this.fetchArticleDetails(pmids);
      return articles;
    } catch (error) {
      console.error('Error searching PubMed:', error);
      throw new Error('Failed to search PubMed articles');
    }
  }

  async getArticleDetails(pmid: string): Promise<{ doi?: string; pmcid?: string }> {
    try {
      const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;
      const response = await fetch(summaryUrl);
      const data = await response.json() as any;
      
      const result = data.result?.[pmid];
      if (!result) {
        return {};
      }
      
      let doi: string | undefined;
      let pmcid: string | undefined;
      
      if (result.articleids) {
        for (const articleId of result.articleids) {
          if (articleId.idtype === 'doi') {
            doi = articleId.value;
          } else if (articleId.idtype === 'pmc') {
            pmcid = articleId.value;
          }
        }
      }
      
      return { doi, pmcid };
    } catch (error) {
      console.error(`Error getting details for PMID ${pmid}:`, error);
      return {};
    }
  }

  private buildSearchUrl(params: PubMedSearchParams): string {
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: params.query,
      retmode: 'json',
      retmax: (params.maxResults || 50).toString(),
      retstart: (params.retstart || 0).toString(),
    });

    if (params.dateFrom || params.dateTo) {
      const dateFilter = this.buildDateFilter(params.dateFrom, params.dateTo);
      if (dateFilter) {
        searchParams.set('term', `${params.query} AND ${dateFilter}`);
      }
    }

    return `${this.baseUrl}/esearch.fcgi?${searchParams.toString()}`;
  }

  private buildDateFilter(dateFrom?: string, dateTo?: string): string {
    if (!dateFrom && !dateTo) return '';
    
    const from = dateFrom || '1900/01/01';
    const to = dateTo || new Date().toISOString().split('T')[0].replace(/-/g, '/');
    
    return `("${from}"[Date - Publication] : "${to}"[Date - Publication])`;
  }

  private async fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
    try {
      const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
      const summaryResponse = await fetch(summaryUrl);
      const summaryData = await summaryResponse.json() as any;
      
      const fetchUrl = `${this.baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
      const fetchResponse = await fetch(fetchUrl);
      const xmlData = await fetchResponse.text();
      
      return await this.parseArticlesFromXML(xmlData, summaryData);
    } catch (error) {
      console.error('Error fetching article details:', error);
      return [];
    }
  }

  private async parseArticlesFromXML(xmlData: string, summaryData: any): Promise<PubMedArticle[]> {
    const articles: PubMedArticle[] = [];
    
    try {
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        ignoreAttrs: false,
        trim: true
      });
      
      const result = await parser.parseStringPromise(xmlData);
      const pubmedArticles = result?.PubmedArticleSet?.PubmedArticle || [];
      const articlesArray = Array.isArray(pubmedArticles) ? pubmedArticles : [pubmedArticles];
      
      for (const article of articlesArray) {
        try {
          const pmid = article?.MedlineCitation?.PMID?._ || article?.MedlineCitation?.PMID || '';
          if (!pmid) continue;
          
          const summaryInfo = summaryData.result?.[pmid];
          const medlineCitation = article.MedlineCitation;
          const pubmedData = article.PubmedData;
          
          // Extract title
          const title = medlineCitation?.Article?.ArticleTitle || 'No title available';
          
          // Extract abstract
          const abstractObj = medlineCitation?.Article?.Abstract;
          let abstract = '';
          if (abstractObj?.AbstractText) {
            if (typeof abstractObj.AbstractText === 'string') {
              abstract = abstractObj.AbstractText;
            } else if (Array.isArray(abstractObj.AbstractText)) {
              abstract = abstractObj.AbstractText.join(' ');
            } else if (abstractObj.AbstractText._) {
              abstract = abstractObj.AbstractText._;
            }
          }
          
          // Extract authors
          const authorList = medlineCitation?.Article?.AuthorList?.Author || [];
          const authorsArray = Array.isArray(authorList) ? authorList : [authorList];
          const authors = authorsArray.slice(0, 3).map((author: any) => {
            const lastName = author?.LastName || '';
            const firstName = author?.ForeName || author?.FirstName || '';
            return firstName ? `${firstName} ${lastName}` : lastName;
          }).filter(Boolean).join(', ') || 'No authors available';
          
          // Extract journal
          const journal = medlineCitation?.Article?.Journal?.Title || 
                         medlineCitation?.Article?.Journal?.ISOAbbreviation || 
                         'No journal information';
          
          // Extract year
          const pubDate = medlineCitation?.Article?.Journal?.JournalIssue?.PubDate;
          let year = new Date().getFullYear();
          if (pubDate?.Year) {
            year = parseInt(pubDate.Year) || year;
          } else if (pubDate?.MedlineDate) {
            const yearMatch = pubDate.MedlineDate.match(/(\d{4})/);
            if (yearMatch) year = parseInt(yearMatch[1]);
          }
          
          // Get DOI and PMC ID from summary
          let doi: string | undefined;
          let pmcid: string | undefined;
          
          if (summaryInfo?.articleids) {
            for (const articleId of summaryInfo.articleids) {
              if (articleId.idtype === 'doi') {
                doi = articleId.value;
              } else if (articleId.idtype === 'pmc') {
                pmcid = articleId.value;
              }
            }
          }
          
          articles.push({
            pmid: pmid.toString(),
            title: this.cleanXmlText(title),
            authors,
            journal: this.cleanXmlText(journal),
            year,
            abstract: this.cleanXmlText(abstract),
            doi,
            pmcid,
          });
        } catch (articleError) {
          console.error(`Error parsing individual article:`, articleError);
          continue;
        }
      }
    } catch (error) {
      console.error('Error parsing XML with xml2js:', error);
      // Fallback to regex parsing if xml2js fails
      return this.parseArticlesFromXMLFallback(xmlData, summaryData);
    }
    
    return articles;
  }

  private parseArticlesFromXMLFallback(xmlData: string, summaryData: any): PubMedArticle[] {
    const articles: PubMedArticle[] = [];
    
    try {
      // Fallback regex-based parsing
      const articleMatches = xmlData.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
      
      for (const articleXml of articleMatches) {
        const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
        if (!pmidMatch) continue;
        
        const pmid = pmidMatch[1];
        const summaryInfo = summaryData.result?.[pmid];
        
        const titleMatch = articleXml.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/);
        const title = titleMatch ? this.cleanXmlText(titleMatch[1]) : 'No title available';
        
        const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
        const abstract = abstractMatch ? this.cleanXmlText(abstractMatch[1]) : '';
        
        // Extract authors
        const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
        const authors = authorMatches.slice(0, 3).map(authorXml => {
          const lastNameMatch = authorXml.match(/<LastName[^>]*>(.*?)<\/LastName>/);
          const firstNameMatch = authorXml.match(/<ForeName[^>]*>(.*?)<\/ForeName>/);
          const lastName = lastNameMatch ? lastNameMatch[1] : '';
          const firstName = firstNameMatch ? firstNameMatch[1] : '';
          return firstName ? `${firstName} ${lastName}` : lastName;
        }).filter(Boolean).join(', ');
        
        // Extract journal and year
        const journalMatch = articleXml.match(/<Title[^>]*>(.*?)<\/Title>/);
        const journal = journalMatch ? this.cleanXmlText(journalMatch[1]) : '';
        
        const yearMatch = articleXml.match(/<Year[^>]*>(\d{4})<\/Year>/);
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
        
        // Get DOI and PMC ID from summary
        let doi: string | undefined;
        let pmcid: string | undefined;
        
        if (summaryInfo?.articleids) {
          for (const articleId of summaryInfo.articleids) {
            if (articleId.idtype === 'doi') {
              doi = articleId.value;
            } else if (articleId.idtype === 'pmc') {
              pmcid = articleId.value;
            }
          }
        }
        
        articles.push({
          pmid,
          title,
          authors: authors || 'No authors available',
          journal: journal || 'No journal information',
          year,
          abstract,
          doi,
          pmcid,
        });
      }
    } catch (error) {
      console.error('Error in fallback XML parsing:', error);
    }
    
    return articles;
  }

  private cleanXmlText(text: any): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/<[^>]*>/g, '') // Remove XML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}

export const pubmedService = new PubMedService();
