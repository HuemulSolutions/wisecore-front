import { HuemulButton } from "@/huemul/components/huemul-button";
import { PageHeader } from "@/huemul/components/huemul-page-header";
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { search } from "@/services/search";
import type { SearchType, SearchResultDocument, SearchResponse } from "@/services/search";
import { Search, FileText, X, AlertTriangle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useOrganization } from "@/contexts/organization-context";
import { DocumentResult } from "@/components/search/search-document-result";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { SearchFilters } from "@/components/search/search-filters";
import type { SearchFilterValues } from "@/components/search/search-filters";
import { getErrorMessage } from "@/lib/error-utils";
import { ApiError } from "@/types/api-error";
import { useTranslation } from "react-i18next";

function parseFiltersFromURL(params: URLSearchParams): SearchFilterValues {
  return {
    document_type_id: params.get("document_type_id"),
    template_id: params.get("template_id"),
    created_by: params.get("created_by"),
    lifecycle_state: params.get("lifecycle_state"),
    filter_with_llm: params.get("filter_with_llm") !== "false",
  };
}

function buildSearchParams(
  q: string,
  searchType: SearchType,
  filters: SearchFilterValues,
): URLSearchParams {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("search_type", searchType);
  if (filters.document_type_id) params.set("document_type_id", filters.document_type_id);
  if (filters.template_id) params.set("template_id", filters.template_id);
  if (filters.created_by) params.set("created_by", filters.created_by);
  if (filters.lifecycle_state) params.set("lifecycle_state", filters.lifecycle_state);
  if (!filters.filter_with_llm) params.set("filter_with_llm", "false");
  return params;
}

export default function SearchPage() {
  const { t } = useTranslation('search');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchType, setSearchType] = useState<SearchType>((searchParams.get("search_type") as SearchType) || "semantic");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const { selectedOrganizationId } = useOrganization();

  const defaultFilters: SearchFilterValues = {
    document_type_id: null,
    template_id: null,
    created_by: null,
    lifecycle_state: null,
    filter_with_llm: true,
  };

  const initialFiltersFromURL = parseFiltersFromURL(searchParams);

  // Committed state: what's actually being searched right now
  const [committedQuery, setCommittedQuery] = useState(searchParams.get("q") || "");
  const [committedFilters, setCommittedFilters] = useState<SearchFilterValues>(initialFiltersFromURL);
  const [committedSearchType, setCommittedSearchType] = useState<SearchType>((searchParams.get("search_type") as SearchType) || "semantic");

  const hasActiveSearch = !!committedQuery.trim() ||
    !!committedFilters.document_type_id ||
    !!committedFilters.template_id ||
    !!committedFilters.created_by ||
    !!committedFilters.lifecycle_state;

  const { data: searchResponse, isLoading, isError, error, refetch } = useQuery<SearchResponse>({
    queryKey: [
      'search',
      committedQuery,
      committedSearchType,
      committedFilters,
      selectedOrganizationId,
    ],
    queryFn: () => search({
      query: committedQuery,
      organizationId: selectedOrganizationId!,
      search_type: committedSearchType,
      document_type_id: committedFilters.document_type_id,
      template_id: committedFilters.template_id,
      created_by: committedFilters.created_by,
      lifecycle_state: committedFilters.lifecycle_state,
      filter_with_llm: committedFilters.filter_with_llm,
    }),
    enabled: hasActiveSearch && !!selectedOrganizationId,
  });

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    const hasFilters = !!committedFilters.document_type_id ||
      !!committedFilters.template_id ||
      !!committedFilters.created_by ||
      !!committedFilters.lifecycle_state;

    if (!trimmedQuery && !hasFilters) return;

    const isSameState = trimmedQuery === committedQuery && searchType === committedSearchType;
    if (isSameState && hasActiveSearch) {
      refetch();
      return;
    }

    setCommittedQuery(trimmedQuery);
    setCommittedSearchType(searchType);

    setSearchParams(buildSearchParams(trimmedQuery, searchType, committedFilters));
  };

  const handleFiltersApply = (filters: SearchFilterValues) => {
    const trimmedQuery = query.trim();
    setCommittedFilters(filters);
    setCommittedQuery(trimmedQuery);
    setCommittedSearchType(searchType);
    setSearchParams(buildSearchParams(trimmedQuery, searchType, filters));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setCommittedQuery("");
    setCommittedFilters(defaultFilters);
    setSearchParams({});
  };

  return (
    <HuemulPageLayout
      header={
        <>
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
            <div className="flex gap-2 items-center">
              <HuemulButton
                icon={Search}
                label={t('page.searchButton')}
                loading={isLoading}
                onClick={handleSearch}
                className="h-8 text-xs px-3"
              />
              {hasActiveSearch && (
                <HuemulButton
                  variant="outline"
                  icon={X}
                  onClick={handleClearSearch}
                  className="h-8 px-2"
                  tooltip={t('page.clearSearch')}
                />
              )}
            </div>
          </PageHeader>

          {selectedOrganizationId && (
            <SearchFilters
              organizationId={selectedOrganizationId}
              searchType={searchType}
              onSearchTypeChange={setSearchType}
              onApply={handleFiltersApply}
              initialFilters={initialFiltersFromURL}
            />
          )}
        </>
      }
      headerClassName="p-6 md:p-8 pb-0 md:pb-0"
      columns={[
        {
          content: hasActiveSearch ? (
            <div className="space-y-4 pb-8">
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
                  <HuemulButton
                    variant="outline"
                    size="sm"
                    label={t('errors.retry')}
                    onClick={() => { refetch(); }}
                  />
                </div>
              )}

              {searchResponse && searchResponse.data.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                  <FileText className="w-8 h-8 text-muted-foreground mb-3" />
                  <h3 className="text-sm font-medium text-foreground mb-1">{t('empty.noResultsTitle')}</h3>
                  <p className="text-xs text-muted-foreground">{t('empty.noResultsDescription')}</p>
                </div>
              )}

              {searchResponse && searchResponse.data.length > 0 && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-foreground mb-3">{t('page.supportingDocuments')}</h2>
                    <div className="space-y-3">
                      {searchResponse.data.map((document: SearchResultDocument) => (
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
          ) : null,
          className: "p-6 md:p-8 pt-0 md:pt-0",
        },
      ]}
    />
  );
}
