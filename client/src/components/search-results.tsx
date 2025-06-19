import { useState } from "react";
import { ListFilter, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function SearchResults() {
  const [selectedPmids, setSelectedPmids] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: searchData, isLoading } = useQuery({
    queryKey: ['/api/search-results'],
  });

  const addToQueueMutation = useMutation({
    mutationFn: api.addToQueue,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Articles Added",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/download-queue'] });
        setSelectedPmids([]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Articles",
        description: error.message || "Unable to add articles to queue.",
        variant: "destructive",
      });
    },
  });

  const results = searchData?.results || [];

  const handleSelectAll = () => {
    if (selectedPmids.length === results.length) {
      setSelectedPmids([]);
    } else {
      setSelectedPmids(results.map((result: any) => result.pmid));
    }
  };

  const handleSelectArticle = (pmid: string, checked: boolean) => {
    if (checked) {
      setSelectedPmids(prev => [...prev, pmid]);
    } else {
      setSelectedPmids(prev => prev.filter(id => id !== pmid));
    }
  };

  const handleAddSelected = () => {
    if (selectedPmids.length === 0) {
      toast({
        title: "No Articles Selected",
        description: "Please select articles to add to the download queue.",
        variant: "destructive",
      });
      return;
    }

    addToQueueMutation.mutate(selectedPmids);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading search results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ListFilter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Search Results</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {results.length} results found
            </span>
            {results.length > 0 && (
              <Button variant="link" onClick={handleSelectAll} className="text-sm text-primary">
                {selectedPmids.length === results.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {results.length === 0 ? (
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <ListFilter className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No search results</p>
            <p className="text-sm">Use the search panel above to find articles</p>
          </div>
        </CardContent>
      ) : (
        <>
          <div className="overflow-x-auto table-container">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <Checkbox
                      checked={selectedPmids.length === results.length && results.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Authors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Journal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PMID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((article: any) => (
                  <tr key={article.pmid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedPmids.includes(article.pmid)}
                        onCheckedChange={(checked) => handleSelectArticle(article.pmid, checked as boolean)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {article.title}
                        </div>
                        {article.abstract && (
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {article.abstract}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {article.authors || "No authors available"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {article.journal || "No journal information"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {article.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary">
                      {article.pmid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleAddSelected}
                  disabled={selectedPmids.length === 0 || addToQueueMutation.isPending}
                  className="bg-primary hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addToQueueMutation.isPending ? "Adding..." : "Add Selected to Queue"}
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedPmids.length} article{selectedPmids.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
