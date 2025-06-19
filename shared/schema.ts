import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  pmid: text("pmid").notNull(),
  title: text("title").notNull(),
  authors: text("authors"),
  journal: text("journal"),
  year: integer("year"),
  abstract: text("abstract"),
  doi: text("doi"),
  pmcid: text("pmcid"),
  searchQuery: text("search_query"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const downloadQueue = pgTable("download_queue", {
  id: serial("id").primaryKey(),
  pmid: text("pmid").notNull(),
  title: text("title"),
  status: text("status").notNull().default("pending"), // pending, downloading, completed, failed
  filePath: text("file_path"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const downloadSessions = pgTable("download_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  isAuthenticated: boolean("is_authenticated").default(false),
  username: text("username"),
  totalItems: integer("total_items").default(0),
  completedItems: integer("completed_items").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertSearchResultSchema = createInsertSchema(searchResults).omit({
  id: true,
  createdAt: true,
});

export const insertDownloadQueueSchema = createInsertSchema(downloadQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDownloadSessionSchema = createInsertSchema(downloadSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const authenticationSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const searchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  maxResults: z.number().int().min(1).max(500).default(50),
});

export const manualPmidSchema = z.object({
  pmids: z.array(z.string().regex(/^\d+$/, "Invalid PubMed ID format")),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type SearchResult = typeof searchResults.$inferSelect;
export type InsertDownloadQueue = z.infer<typeof insertDownloadQueueSchema>;
export type DownloadQueue = typeof downloadQueue.$inferSelect;
export type InsertDownloadSession = z.infer<typeof insertDownloadSessionSchema>;
export type DownloadSession = typeof downloadSessions.$inferSelect;
export type AuthenticationRequest = z.infer<typeof authenticationSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type ManualPmidRequest = z.infer<typeof manualPmidSchema>;

// Add missing insert schema for users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});
