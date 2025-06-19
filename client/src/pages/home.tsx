import { useState, useEffect } from "react";
import { School, User } from "lucide-react";
import { AuthenticationCard } from "@/components/authentication-card";
import { BrowserAuthCard } from "@/components/browser-auth-card";
import { SearchPanel } from "@/components/search-panel";
import { DownloadQueue } from "@/components/download-queue";
import { SearchResults } from "@/components/search-results";
import { DownloadStatus } from "@/components/download-status";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
    isActive: false,
    currentPmid: "",
  });

  useEffect(() => {
    // Set up WebSocket connection for real-time updates
    if (sessionId && isAuthenticated) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws?sessionId=${sessionId}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setDownloadProgress({
            current: data.current,
            total: data.total,
            isActive: true,
            currentPmid: data.currentPmid,
          });
        } else if (data.type === 'download_complete') {
          setDownloadProgress(prev => ({
            ...prev,
            isActive: false,
          }));
        }
      };
      
      return () => ws.close();
    }
  }, [sessionId, isAuthenticated]);

  const handleAuthenticationSuccess = (newSessionId: string, newUsername: string) => {
    setSessionId(newSessionId);
    setIsAuthenticated(true);
    setUsername(newUsername);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <School className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold text-gray-900">PubMed Research Assistant</h1>
              </div>
              <span className="text-sm text-gray-500 border-l pl-4">University of Alberta</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {isAuthenticated ? `Authenticated as ${username}` : "Not authenticated"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Authentication Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AuthenticationCard 
            onSuccess={handleAuthenticationSuccess}
            isAuthenticated={isAuthenticated}
          />
          <BrowserAuthCard 
            downloadFolder="/home/runner/Documents/downloaded_pdfs"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-2">
            <SearchPanel sessionId={sessionId} />
          </div>

          {/* Download Queue */}
          <div>
            <DownloadQueue 
              sessionId={sessionId} 
              isAuthenticated={isAuthenticated}
              downloadProgress={downloadProgress}
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="mt-8">
          <SearchResults />
        </div>

        {/* Download Status */}
        <div className="mt-8">
          <DownloadStatus />
        </div>
      </main>
    </div>
  );
}
