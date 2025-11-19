import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { search } from "@/services/search";
import SearchResult from "@/components/search_result";
import { Loader2, Search, FileText, X } from "lucide-react";
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Search</h1>
          <p className="text-gray-600">Search through your organization's documents and content</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter your search query..."
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="w-32 hover:cursor-pointer">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSearch} 
                className="bg-[#4464f7] hover:bg-[#3451e6] text-white hover:cursor-pointer px-6" 
                disabled={!query.trim()}
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
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Search results for: <span className="text-[#4464f7]">"</span><span className="text-gray-700">{searchQuery}</span><span className="text-[#4464f7]">"</span>
              </h2>
              <p className="text-sm text-gray-500">Search mode: {mode}</p>
            </div>
            
            {isLoading && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-3 text-[#4464f7]" />
                  <span className="text-gray-600">Searching through your documents...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="text-sm font-medium">Search Error</span>
                </div>
                <p className="text-sm text-red-600 mt-1">Error performing search. Please try again.</p>
              </div>
            )}

            {searchResults && searchResults.length === 0 && !isLoading && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500">Try adjusting your search query or using different keywords.</p>
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-4">
                {/* <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
                  </div>
                </div> */}
                <div className="space-y-4">
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
