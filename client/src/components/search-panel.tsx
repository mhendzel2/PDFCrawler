import { useState } from "react";
import { Search, Edit, Upload, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface SearchPanelProps {
  sessionId: string | null;
}

export function SearchPanel({ sessionId }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [maxResults, setMaxResults] = useState("50");
  const [manualPmids, setManualPmids] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: api.search,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Search Completed",
          description: `Found ${data.count} articles matching your query.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Unable to search PubMed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addPmidsMutation = useMutation({
    mutationFn: api.addManualPmids,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "PMIDs Added",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/download-queue'] });
        setManualPmids("");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add PMIDs",
        description: error.message || "Please check the PMID format and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search query.",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate({
      query: searchQuery.trim(),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      maxResults: parseInt(maxResults),
    });
  };

  const handleAddManualPmids = () => {
    const pmids = manualPmids
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && /^\d+$/.test(line));

    if (pmids.length === 0) {
      toast({
        title: "No Valid PMIDs Found",
        description: "Please enter valid PubMed IDs (numbers only), one per line.",
        variant: "destructive",
      });
      return;
    }

    addPmidsMutation.mutate({ pmids });
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setManualPmids(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* PubMed Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">PubMed Search</h2>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="search-query" className="text-sm font-medium text-gray-700 mb-2">
                Search Query
              </Label>
              <Input
                id="search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter keywords, authors, or advanced search terms..."
                className="focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date-from" className="text-sm font-medium text-gray-700 mb-2">
                  Date From
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="date-to" className="text-sm font-medium text-gray-700 mb-2">
                  Date To
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <Label htmlFor="max-results" className="text-sm font-medium text-gray-700 mb-2">
                  Max Results
                </Label>
                <Select value={maxResults} onValueChange={setMaxResults}>
                  <SelectTrigger className="focus:ring-primary focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-blue-700"
              disabled={searchMutation.isPending}
            >
              <Search className="h-4 w-4 mr-2" />
              {searchMutation.isPending ? "Searching..." : "Search PubMed"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Manual PMID Input Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Edit className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Manual PMID Input</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="pmid-input" className="text-sm font-medium text-gray-700 mb-2">
                PubMed IDs (one per line)
              </Label>
              <Textarea
                id="pmid-input"
                value={manualPmids}
                onChange={(e) => setManualPmids(e.target.value)}
                rows={6}
                placeholder="Enter PubMed IDs, one per line:&#10;34567890&#10;34567891&#10;34567892"
                className="focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleFileUpload}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Text File
              </Button>
              
              <Button
                type="button"
                onClick={handleAddManualPmids}
                disabled={addPmidsMutation.isPending}
                className="flex-1 bg-secondary hover:bg-gray-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addPmidsMutation.isPending ? "Adding..." : "Add to Queue"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
