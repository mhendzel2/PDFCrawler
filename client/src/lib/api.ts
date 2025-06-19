import { apiRequest } from './queryClient';

export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface SearchQuery {
  query: string;
  dateFrom?: string;
  dateTo?: string;
  maxResults?: number;
}

export interface ManualPmidRequest {
  pmids: string[];
}

export const api = {
  // Authentication
  authenticate: async (credentials: AuthenticationRequest) => {
    const response = await apiRequest('POST', '/api/authenticate', credentials);
    return response.json();
  },

  // Search
  search: async (query: SearchQuery) => {
    const response = await apiRequest('POST', '/api/search', query);
    return response.json();
  },

  getSearchResults: async () => {
    const response = await apiRequest('GET', '/api/search-results');
    return response.json();
  },

  // Download queue management
  addManualPmids: async (request: ManualPmidRequest) => {
    const response = await apiRequest('POST', '/api/add-manual-pmids', request);
    return response.json();
  },

  addToQueue: async (pmids: string[]) => {
    const response = await apiRequest('POST', '/api/add-to-queue', { pmids });
    return response.json();
  },

  getDownloadQueue: async () => {
    const response = await apiRequest('GET', '/api/download-queue');
    return response.json();
  },

  removeFromQueue: async (id: number) => {
    const response = await apiRequest('DELETE', `/api/download-queue/${id}`);
    return response.json();
  },

  clearQueue: async () => {
    const response = await apiRequest('DELETE', '/api/download-queue');
    return response.json();
  },

  // Download
  startDownload: async (sessionId: string) => {
    const response = await apiRequest('POST', '/api/download', { sessionId });
    return response.json();
  },

  getDownloadFolder: async () => {
    const response = await apiRequest('GET', '/api/download-folder');
    return response.json();
  },

  // Session
  checkSession: async (sessionId: string) => {
    const response = await apiRequest('GET', `/api/session/${sessionId}`);
    return response.json();
  },
};
