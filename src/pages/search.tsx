import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { search } from "@/services/search";
import SearchResult from "@/components/search_result";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useOrganization } from "@/contexts/organization-context";

interface SearchResultData {
  content: string;
  execution_id: string;
  document_id: string;
  document_name: string;
  section_execution_name: string;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") || "normal");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const { selectedOrganizationId } = useOrganization();
  
  // Get initial search query from URL
  const initialSearchQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const { data: searchResults, isLoading, error } = useQuery<SearchResultData[]>({
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
      setSearchQuery(query.trim());
      
      // Update URL with search parameters
      const newParams = new URLSearchParams();
      newParams.set("q", query.trim());
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      <div className="flex gap-2">
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-32 hover:cursor-pointer">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="deep">Deep</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} className="hover:cursor-pointer" disabled={!query.trim()}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Search
        </Button>
        {searchQuery && (
          <Button 
            variant="outline" 
            onClick={handleClearSearch} 
            className="hover:cursor-pointer"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Search results for: "{searchQuery}"
          </h2>
          
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Searching...</span>
            </div>
          )}

          {error && (
            <div className="text-red-500 py-4">
              Error performing search. Please try again.
            </div>
          )}

          {searchResults && searchResults.length === 0 && !isLoading && (
            <div className="text-muted-foreground py-8 text-center">
              No results found for your search.
            </div>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              {searchResults.map((result, index) => (
                <SearchResult
                  key={`${result.execution_id}-${result.document_id}-${index}`}
                  content={result.content}
                  execution_id={result.execution_id}
                  document_id={result.document_id}
                  document_name={result.document_name}
                  section_execution_name={result.section_execution_name}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
