import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pubmedService } from "./services/pubmed";
import { downloaderService } from "./services/downloader";
import { browserAuthService } from "./services/browser-auth";
import { 
  authenticationSchema, 
  searchQuerySchema, 
  manualPmidSchema,
  insertDownloadQueueSchema 
} from "@shared/schema";
import { nanoid } from "nanoid";
import { WebSocketServer } from "ws";
import * as fs from 'fs';
import * as path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time progress updates
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    perMessageDeflate: false
  });
  const connections = new Map<string, Set<any>>();
  
  wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const sessionId = url.searchParams.get('sessionId');
      if (sessionId) {
        // Support multiple tabs per session
        if (!connections.has(sessionId)) {
          connections.set(sessionId, new Set());
        }
        connections.get(sessionId)!.add(ws);
        
        ws.on('close', () => {
          const sessionConnections = connections.get(sessionId);
          if (sessionConnections) {
            sessionConnections.delete(ws);
            if (sessionConnections.size === 0) {
              connections.delete(sessionId);
            }
          }
        });
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          const sessionConnections = connections.get(sessionId);
          if (sessionConnections) {
            sessionConnections.delete(ws);
            if (sessionConnections.size === 0) {
              connections.delete(sessionId);
            }
          }
        });
      }
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close();
    }
  });

  // Authentication endpoint
  app.post("/api/authenticate", async (req, res) => {
    try {
      const { username, password } = authenticationSchema.parse(req.body);
      const sessionId = nanoid();
      
      const success = await downloaderService.authenticateSession(sessionId, username, password);
      
      if (success) {
        // Create or update session in storage
        await storage.createDownloadSession({
          sessionId,
          isAuthenticated: true,
          username,
          totalItems: 0,
          completedItems: 0,
        });
        
        res.json({ 
          success: true, 
          sessionId,
          message: "Authentication successful" 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Authentication failed" 
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Search PubMed
  app.post("/api/search", async (req, res) => {
    try {
      const searchParams = searchQuerySchema.parse(req.body);
      
      // Clear previous search results
      await storage.clearSearchResults();
      
      const articles = await pubmedService.searchArticles(searchParams);
      
      // Store search results
      const searchResults = await storage.createSearchResults(
        articles.map(article => ({
          pmid: article.pmid,
          title: article.title,
          authors: article.authors,
          journal: article.journal,
          year: article.year,
          abstract: article.abstract,
          doi: article.doi || null,
          pmcid: article.pmcid || null,
          searchQuery: searchParams.query,
        }))
      );
      
      res.json({
        success: true,
        results: searchResults,
        count: searchResults.length,
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        success: false,
        message: "Search failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get search results
  app.get("/api/search-results", async (req, res) => {
    try {
      const results = await storage.getSearchResults();
      res.json({ results });
    } catch (error) {
      console.error("Get search results error:", error);
      res.status(500).json({ message: "Failed to get search results" });
    }
  });

  // Add manual PMIDs to queue
  app.post("/api/add-manual-pmids", async (req, res) => {
    try {
      const { pmids } = manualPmidSchema.parse(req.body);
      
      const queueItems = await storage.addMultipleToDownloadQueue(
        pmids.map(pmid => ({
          pmid,
          title: `Manual PMID: ${pmid}`,
          status: "pending",
          filePath: null,
          errorMessage: null,
        }))
      );
      
      res.json({
        success: true,
        message: `Added ${pmids.length} PMIDs to queue`,
        items: queueItems,
      });
    } catch (error) {
      console.error("Add manual PMIDs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add PMIDs to queue",
      });
    }
  });

  // Add selected articles to download queue
  app.post("/api/add-to-queue", async (req, res) => {
    try {
      const { pmids } = req.body;
      
      if (!Array.isArray(pmids)) {
        return res.status(400).json({ message: "PMIDs must be an array" });
      }
      
      // Get article details from search results
      const searchResults = await storage.getSearchResults();
      const selectedResults = searchResults.filter(result => pmids.includes(result.pmid));
      
      const queueItems = await storage.addMultipleToDownloadQueue(
        selectedResults.map(result => ({
          pmid: result.pmid,
          title: result.title,
          status: "pending",
          filePath: null,
          errorMessage: null,
        }))
      );
      
      res.json({
        success: true,
        message: `Added ${queueItems.length} articles to queue`,
        items: queueItems,
      });
    } catch (error) {
      console.error("Add to queue error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add articles to queue",
      });
    }
  });

  // Get download queue
  app.get("/api/download-queue", async (req, res) => {
    try {
      const queue = await storage.getDownloadQueue();
      res.json({ queue });
    } catch (error) {
      console.error("Get download queue error:", error);
      res.status(500).json({ message: "Failed to get download queue" });
    }
  });

  // Remove item from download queue
  app.delete("/api/download-queue/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeFromDownloadQueue(id);
      
      if (success) {
        res.json({ success: true, message: "Item removed from queue" });
      } else {
        res.status(404).json({ success: false, message: "Item not found" });
      }
    } catch (error) {
      console.error("Remove from queue error:", error);
      res.status(500).json({ success: false, message: "Failed to remove item" });
    }
  });

  // Clear download queue
  app.delete("/api/download-queue", async (req, res) => {
    try {
      await storage.clearDownloadQueue();
      res.json({ success: true, message: "Queue cleared" });
    } catch (error) {
      console.error("Clear queue error:", error);
      res.status(500).json({ success: false, message: "Failed to clear queue" });
    }
  });

  // Start download process
  app.post("/api/download", async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      // Check if session is authenticated
      if (!downloaderService.isSessionAuthenticated(sessionId)) {
        return res.status(401).json({ message: "Session not authenticated" });
      }

      const queue = await storage.getDownloadQueue();
      const pendingItems = queue.filter(item => item.status === "pending");
      
      if (pendingItems.length === 0) {
        return res.json({ 
          success: true, 
          message: "No items to download" 
        });
      }

      // Start download process in background
      res.json({ 
        success: true, 
        message: "Download started",
        total: pendingItems.length 
      });

      // Process downloads
      const sessionConnections = connections.get(sessionId);
      let completed = 0;

      // Helper function to broadcast to all connections for this session
      const broadcastToSession = (message: any) => {
        if (sessionConnections) {
          const messageStr = JSON.stringify(message);
          Array.from(sessionConnections).forEach(ws => {
            try {
              ws.send(messageStr);
            } catch (error) {
              console.error('Failed to send WebSocket message:', error);
              sessionConnections.delete(ws);
            }
          });
        }
      };

      for (const item of pendingItems) {
        // Update status to downloading
        await storage.updateDownloadQueueItem(item.id, { status: "downloading" });
        
        // Send progress update
        broadcastToSession({
          type: 'progress',
          current: completed + 1,
          total: pendingItems.length,
          currentPmid: item.pmid,
        });

        // Download PDF
        const result = await downloaderService.downloadPDF(sessionId, item.pmid);
        
        if (result.success) {
          await storage.updateDownloadQueueItem(item.id, {
            status: "completed",
            filePath: result.filePath,
          });
        } else {
          await storage.updateDownloadQueueItem(item.id, {
            status: "failed",
            errorMessage: result.error,
          });
        }

        completed++;
        
        // Send completion update
        broadcastToSession({
          type: 'item_complete',
          pmid: item.pmid,
          success: result.success,
          error: result.error,
          filePath: result.filePath,
        });
      }

      // Send final completion
      broadcastToSession({
        type: 'download_complete',
        completed,
        total: pendingItems.length,
      });

    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({
        success: false,
        message: "Download failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get download folder path
  app.get("/api/download-folder", (req, res) => {
    res.json({ 
      path: downloaderService.getDownloadFolder() 
    });
  });

  // Check session status
  app.get("/api/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getDownloadSession(sessionId);
      const isAuthenticated = downloaderService.isSessionAuthenticated(sessionId);
      
      res.json({
        exists: !!session,
        isAuthenticated,
        session,
      });
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ message: "Failed to check session" });
    }
  });

  // Browser session management endpoints
  app.post('/api/save-browser-session', async (req, res) => {
    try {
      const { cookies, userAgent, timestamp } = req.body;
      
      if (!cookies || !timestamp) {
        return res.status(400).json({ error: 'Missing required session data' });
      }

      // Check if session is recent (within 2 hours)
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      if (timestamp < twoHoursAgo) {
        return res.status(400).json({ error: 'Session has expired. Please log in again.' });
      }

      const sessionId = `browser-${Date.now()}`;
      browserAuthService.storeBrowserSession(
        sessionId,
        [cookies],
        userAgent || 'Mozilla/5.0 (compatible; PubMed-Downloader)'
      );

      // Also save to download folder for persistence
      const downloadFolder = downloaderService.getDownloadFolder();
      const sessionFile = path.join(downloadFolder, 'ezproxy-session.json');
      fs.writeFileSync(sessionFile, JSON.stringify(req.body, null, 2));

      res.json({ success: true, sessionId });
    } catch (error: any) {
      console.error('Error saving browser session:', error);
      res.status(500).json({ error: 'Failed to save session' });
    }
  });

  app.get('/api/browser-session-status', (req, res) => {
    try {
      const validSessions = browserAuthService.getAllValidSessions();
      res.json({ 
        hasValidSession: validSessions.length > 0,
        sessionCount: validSessions.length 
      });
    } catch (error: any) {
      console.error('Error checking session status:', error);
      res.json({ hasValidSession: false, sessionCount: 0 });
    }
  });

  return httpServer;
}
