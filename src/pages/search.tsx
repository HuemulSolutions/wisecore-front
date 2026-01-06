import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { search } from "@/services/search";
import { Loader2, Search, FileText, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useOrganization } from "@/contexts/organization-context";
import { DocumentResult } from "@/components/search/document-result";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";

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
      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Search</h1>
          </div>
        </div>

        {/* Search Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter your search query..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full md:w-32 h-8 hover:cursor-pointer text-xs">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSearch} 
              className="hover:cursor-pointer h-9 text-xs px-3" 
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Search className="h-3 w-3 mr-1" />
              )}
              Search
            </Button>
            {searchQuery && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearSearch} 
                className="hover:cursor-pointer h-8 text-xs px-2"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-4 pb-8 max-h-[calc(100vh-200px)] overflow-y-auto">
            {isLoading && <SearchResultsSkeleton />}

            {error && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                <p className="text-red-600 mb-4 font-medium">Search Error</p>
                <p className="text-sm text-muted-foreground">Error performing search. Please try again.</p>
              </div>
            )}

            {searchResults && searchResults.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                <FileText className="w-8 h-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium text-foreground mb-1">No results found</h3>
                <p className="text-xs text-muted-foreground">Try adjusting your search query or using different keywords.</p>
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3">Supporting Documents</h2>
                  <div className="space-y-3">
                    {searchResults.map((document) => (
                      <DocumentResult 
                        key={document.document_id} 
                        document={document}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
