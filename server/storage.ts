import { 
  users, 
  searchResults, 
  downloadQueue, 
  downloadSessions,
  type User, 
  type InsertUser,
  type SearchResult,
  type InsertSearchResult,
  type DownloadQueue,
  type InsertDownloadQueue,
  type DownloadSession,
  type InsertDownloadSession
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Search results methods
  getSearchResults(searchQuery?: string): Promise<SearchResult[]>;
  createSearchResult(result: InsertSearchResult): Promise<SearchResult>;
  createSearchResults(results: InsertSearchResult[]): Promise<SearchResult[]>;
  clearSearchResults(): Promise<void>;
  
  // Download queue methods
  getDownloadQueue(): Promise<DownloadQueue[]>;
  addToDownloadQueue(item: InsertDownloadQueue): Promise<DownloadQueue>;
  addMultipleToDownloadQueue(items: InsertDownloadQueue[]): Promise<DownloadQueue[]>;
  updateDownloadQueueItem(id: number, updates: Partial<DownloadQueue>): Promise<DownloadQueue | undefined>;
  removeFromDownloadQueue(id: number): Promise<boolean>;
  clearDownloadQueue(): Promise<void>;
  
  // Download session methods
  getDownloadSession(sessionId: string): Promise<DownloadSession | undefined>;
  createDownloadSession(session: InsertDownloadSession): Promise<DownloadSession>;
  updateDownloadSession(sessionId: string, updates: Partial<DownloadSession>): Promise<DownloadSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private searchResults: Map<number, SearchResult> = new Map();
  private downloadQueue: Map<number, DownloadQueue> = new Map();
  private downloadSessions: Map<string, DownloadSession> = new Map();
  private currentUserId = 1;
  private currentSearchResultId = 1;
  private currentDownloadQueueId = 1;

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Search results methods
  async getSearchResults(searchQuery?: string): Promise<SearchResult[]> {
    const results = Array.from(this.searchResults.values());
    if (searchQuery) {
      return results.filter(result => result.searchQuery === searchQuery);
    }
    return results;
  }

  async createSearchResult(insertResult: InsertSearchResult): Promise<SearchResult> {
    const id = this.currentSearchResultId++;
    const result: SearchResult = { 
      ...insertResult,
      authors: insertResult.authors || null,
      journal: insertResult.journal || null,
      year: insertResult.year || null,
      abstract: insertResult.abstract || null,
      doi: insertResult.doi || null,
      pmcid: insertResult.pmcid || null,
      searchQuery: insertResult.searchQuery || null,
      id, 
      createdAt: new Date() 
    };
    this.searchResults.set(id, result);
    return result;
  }

  async createSearchResults(insertResults: InsertSearchResult[]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    for (const insertResult of insertResults) {
      const result = await this.createSearchResult(insertResult);
      results.push(result);
    }
    return results;
  }

  async clearSearchResults(): Promise<void> {
    this.searchResults.clear();
  }

  // Download queue methods
  async getDownloadQueue(): Promise<DownloadQueue[]> {
    return Array.from(this.downloadQueue.values()).sort((a, b) => 
      a.createdAt!.getTime() - b.createdAt!.getTime()
    );
  }

  async addToDownloadQueue(insertItem: InsertDownloadQueue): Promise<DownloadQueue> {
    const id = this.currentDownloadQueueId++;
    const item: DownloadQueue = { 
      ...insertItem,
      title: insertItem.title || null,
      status: insertItem.status || "pending",
      filePath: insertItem.filePath || null,
      errorMessage: insertItem.errorMessage || null,
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.downloadQueue.set(id, item);
    return item;
  }

  async addMultipleToDownloadQueue(insertItems: InsertDownloadQueue[]): Promise<DownloadQueue[]> {
    const items: DownloadQueue[] = [];
    for (const insertItem of insertItems) {
      const item = await this.addToDownloadQueue(insertItem);
      items.push(item);
    }
    return items;
  }

  async updateDownloadQueueItem(id: number, updates: Partial<DownloadQueue>): Promise<DownloadQueue | undefined> {
    const item = this.downloadQueue.get(id);
    if (!item) return undefined;
    
    const updatedItem = { 
      ...item, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.downloadQueue.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromDownloadQueue(id: number): Promise<boolean> {
    return this.downloadQueue.delete(id);
  }

  async clearDownloadQueue(): Promise<void> {
    this.downloadQueue.clear();
  }

  // Download session methods
  async getDownloadSession(sessionId: string): Promise<DownloadSession | undefined> {
    return this.downloadSessions.get(sessionId);
  }

  async createDownloadSession(insertSession: InsertDownloadSession): Promise<DownloadSession> {
    const session: DownloadSession = { 
      id: Date.now(), // Simple ID for in-memory storage
      sessionId: insertSession.sessionId,
      username: insertSession.username ?? null,
      isAuthenticated: insertSession.isAuthenticated ?? false,
      totalItems: insertSession.totalItems ?? 0,
      completedItems: insertSession.completedItems ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.downloadSessions.set(session.sessionId, session);
    return session;
  }

  async updateDownloadSession(sessionId: string, updates: Partial<DownloadSession>): Promise<DownloadSession | undefined> {
    const session = this.downloadSessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.downloadSessions.set(sessionId, updatedSession);
    return updatedSession;
  }
}

export const storage = new MemStorage();
