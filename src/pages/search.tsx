import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/huemul/components/huemul-page-header";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { search } from "@/services/search";
import { Loader2, Search, FileText, X, AlertTriangle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useOrganization } from "@/contexts/organization-context";
import { DocumentResult } from "@/components/search/search-document-result";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { getErrorMessage } from "@/lib/error-utils";
import { ApiError } from "@/types/api-error";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation('search');
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") || "normal");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const { selectedOrganizationId } = useOrganization();
  
  // Get initial search query from URL
  const initialSearchQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const { data: searchResults, isLoading, isError, error, refetch } = useQuery<SearchResultData[]>({
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
    <div className="bg-gray-50 p-6 md:p-8 h-full w-full">
      <div className="mx-auto">
        {/* Header */}
        <PageHeader
          icon={Search}
          title={t('page.title')}
          showRefresh={false}
          searchConfig={{
            placeholder: t('page.searchPlaceholder'),
            value: query,
            onChange: setQuery,
            onKeyDown: handleKeyDown
          }}
        >
          <div className="flex gap-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full md:w-32 h-8 hover:cursor-pointer text-xs">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t('page.modeNormal')}</SelectItem>
                <SelectItem value="deep">{t('page.modeDeep')}</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSearch} 
              className="hover:cursor-pointer h-8 text-xs px-3" 
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Search className="h-3 w-3 mr-1" />
              )}
              {t('page.searchButton')}
            </Button>
            {searchQuery && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearSearch} 
                className="hover:cursor-pointer h-8 text-xs px-2"
                title={t('page.clearSearch')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PageHeader>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-4 pb-8 max-h-[calc(100vh-200px)] overflow-y-auto">
            {isLoading && <SearchResultsSkeleton />}

            {isError && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
                <p className="text-red-600 mb-2 font-medium">
                  {getErrorMessage(error, t('errors.performSearch'))}
                </p>
                {ApiError.isApiError(error) && error.detail && (
                  <p className="text-sm text-muted-foreground mb-4">{error.detail}</p>
                )}
                {!ApiError.isApiError(error) && (
                  <p className="text-sm text-muted-foreground mb-4">{t('errors.tryAgain')}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="hover:cursor-pointer"
                >
                  {t('errors.retry')}
                </Button>
              </div>
            )}

            {searchResults && searchResults.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                <FileText className="w-8 h-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium text-foreground mb-1">{t('empty.noResultsTitle')}</h3>
                <p className="text-xs text-muted-foreground">{t('empty.noResultsDescription')}</p>
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-foreground mb-3">{t('page.supportingDocuments')}</h2>
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
