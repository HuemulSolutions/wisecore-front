import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { search } from "@/services/search";
import SearchResult from "@/components/search_result";
import { Loader2, Search, FileText, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useOrganization } from "@/contexts/organization-context";

interface SearchResultSection {
  section_execution_id: string;
  section_execution_name: string;
  content: string;
}

interface SearchResultData {
  document_id: string;
  execution_id: string;
  document_name: string;
  sections: SearchResultSection[];
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") || "normal");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const { selectedOrganizationId } = useOrganization();
  
  // Get initial search query from URL
  const initialSearchQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const { data: searchResults, isLoading, error, refetch } = useQuery<SearchResultData[]>({
    queryKey: ['search', searchQuery, selectedOrganizationId],
    queryFn: () => search(searchQuery, selectedOrganizationId!),
    enabled: !!searchQuery && searchQuery.trim().length > 0,
  });

  // Update URL params when mode changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (mode) {
      newParams.set("mode", mode);
    } else {
      newParams.delete("mode");
    }
    setSearchParams(newParams, { replace: true });
  }, [mode, searchParams, setSearchParams]);

  const handleSearch = () => {
    if (query.trim()) {
      const trimmedQuery = query.trim();
      
      // Si es la misma query que ya estamos buscando, forzar refetch
      if (trimmedQuery === searchQuery && searchQuery) {
        refetch();
      } else {
        setSearchQuery(trimmedQuery);
      }
      
      // Update URL with search parameters
      const newParams = new URLSearchParams();
      newParams.set("q", trimmedQuery);
      newParams.set("mode", mode);
      setSearchParams(newParams);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setSearchQuery("");
    setSearchParams({});
  };

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Search className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Search</h1>
              <p className="text-muted-foreground">Search through your organization's documents and content</p>
            </div>
          </div>
        </div>

        {/* Search Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Enter your search query..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full md:w-32 hover:cursor-pointer">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSearch} 
              className="hover:cursor-pointer px-6" 
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={handleClearSearch} 
                className="hover:cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-4 pb-8 max-h-[calc(100vh-200px)] overflow-y-auto">
            {isLoading && (
              <Card className="border border-border bg-card p-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-3 text-primary" />
                  <span className="text-muted-foreground">Searching through your documents...</span>
                </div>
              </Card>
            )}

            {error && (
              <Card className="border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="text-sm font-medium">Search Error</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">Error performing search. Please try again.</p>
              </Card>
            )}

            {searchResults && searchResults.length === 0 && !isLoading && (
              <Card className="border border-border bg-card p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">Try adjusting your search query or using different keywords.</p>
              </Card>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-4">
                <Card className="border border-border bg-card p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Found {searchResults.length} document{searchResults.length !== 1 ? 's' : ''} with {searchResults.reduce((total, doc) => total + (doc.sections?.length || 0), 0)} matching sections</span>
                  </div>
                </Card>
                <SearchResult documents={searchResults} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
