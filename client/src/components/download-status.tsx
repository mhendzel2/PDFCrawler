import { Folder, FolderOpen, ExternalLink, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function DownloadStatus() {
  const { data: folderData } = useQuery({
    queryKey: ['/api/download-folder'],
  });

  const { data: queueData } = useQuery({
    queryKey: ['/api/download-queue'],
    refetchInterval: 5000,
  });

  const completedDownloads = queueData?.queue?.filter((item: any) => 
    item.status === 'completed' || item.status === 'failed'
  ) || [];

  const handleOpenFolder = () => {
    if (folderData?.path) {
      // In a real application, you might use an API to open the folder
      // For now, we'll show the path
      alert(`Download folder: ${folderData.path}`);
    }
  };

  const handleOpenFile = (filePath: string) => {
    // In a real application, you might use an API to open the file
    alert(`File location: ${filePath}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Folder className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Download Results</h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Download Folder:</span>
              <code className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                {folderData?.path || "~/Documents/downloaded_pdfs"}
              </code>
            </div>
            <Button
              variant="link"
              onClick={handleOpenFolder}
              className="text-sm text-primary"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open Folder
            </Button>
          </div>
        </div>
        
        {completedDownloads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No download results</p>
            <p className="text-sm">Completed downloads will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedDownloads.map((item: any) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-3 border rounded-md ${
                  item.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.filePath ? 
                        item.filePath.split('/').pop() : 
                        `PMID_${item.pmid}`
                      }
                    </p>
                    <p className={`text-xs ${
                      item.status === 'completed' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.status === 'completed' 
                        ? `Downloaded successfully • ${formatFileSize(item.fileSize || 0)}`
                        : `Failed: ${item.errorMessage || 'Unknown error'}`
                      }
                    </p>
                  </div>
                </div>
                {item.status === 'completed' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenFile(item.filePath)}
                    className="text-gray-400 hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
