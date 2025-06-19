import { Download, History, X, Eraser, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface DownloadQueueProps {
  sessionId: string | null;
  isAuthenticated: boolean;
  downloadProgress: {
    current: number;
    total: number;
    isActive: boolean;
    currentPmid: string;
  };
}

export function DownloadQueue({ sessionId, isAuthenticated, downloadProgress }: DownloadQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queueData } = useQuery({
    queryKey: ['/api/download-queue'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const downloadMutation = useMutation({
    mutationFn: () => api.startDownload(sessionId!),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Download Started",
          description: `Processing ${data.total} articles.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Unable to start download process.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: api.removeFromQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/download-queue'] });
    },
  });

  const clearQueueMutation = useMutation({
    mutationFn: api.clearQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/download-queue'] });
      toast({
        title: "Queue Cleared",
        description: "All items have been removed from the download queue.",
      });
    },
  });

  const handleDownloadAll = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please authenticate with the university proxy first.",
        variant: "destructive",
      });
      return;
    }

    if (!queueData?.queue?.length) {
      toast({
        title: "Queue Empty",
        description: "No articles in the download queue.",
        variant: "destructive",
      });
      return;
    }

    downloadMutation.mutate();
  };

  const queue = queueData?.queue || [];
  const progressPercentage = downloadProgress.total > 0 
    ? (downloadProgress.current / downloadProgress.total) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Download Queue */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">Download Queue</h2>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {queue.length} items
            </Badge>
          </div>
          
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Download className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No articles in queue</p>
                <p className="text-sm">Add articles from search results or manual input</p>
              </div>
            ) : (
              queue.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      PMID: {item.pmid}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.title || `Manual PMID: ${item.pmid}`}
                    </p>
                    {item.status !== 'pending' && (
                      <Badge 
                        variant={item.status === 'completed' ? 'default' : 
                                item.status === 'failed' ? 'destructive' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {item.status}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItemMutation.mutate(item.id)}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleDownloadAll}
              disabled={!isAuthenticated || queue.length === 0 || downloadMutation.isPending || downloadProgress.isActive}
              className="w-full bg-accent hover:bg-green-600 text-white"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {downloadProgress.isActive ? "Downloading..." : "Download All PDFs"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => clearQueueMutation.mutate()}
              disabled={queue.length === 0 || clearQueueMutation.isPending}
              className="w-full"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {downloadProgress.isActive 
                  ? `Downloading: ${downloadProgress.currentPmid}`
                  : "Ready to download"
                }
              </span>
              <span className="text-gray-600">
                {downloadProgress.current}/{downloadProgress.total}
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="w-full h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
