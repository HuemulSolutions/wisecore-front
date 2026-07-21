import { useMemo, useEffect, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, FileText, AlertTriangle, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { PageHeader } from "@/huemul/components/huemul-page-header";
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout";
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button";
import { HuemulFilterInline } from "@/huemul/components/huemul-filter-inline";
import { HuemulFilterPanel } from "@/huemul/components/huemul-filter-panel";
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips";
import { HuemulCustomFieldFilter } from "@/huemul/components/huemul-custom-field-filter";
import { useHuemulFilters } from "@/hooks/useHuemulFilters";

import { search } from "@/services/search";
import type { SearchType, SearchResultDocument, SearchResponse } from "@/services/search";
import { getAssetTypes } from "@/services/asset-types";
import { getUsers } from "@/services/users";
import { getAllTemplates } from "@/services/templates";
import { useOrganization } from "@/contexts/organization-context";
import { DocumentResult } from "@/components/search/search-document-result";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { getErrorMessage } from "@/lib/error-utils";
import { ApiError } from "@/types/api-error";
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field";
import type {
  HuemulFilterDef,
  HuemulFilterValue,
  HuemulFilterValues,
  HuemulDateRangeValue,
} from "@/types/huemul";

// ── URL <-> filter values ─────────────────────────────────────────────────────

const DATE_PREFIXES = ["expiration", "estimated_publication", "review", "audit"] as const;
const DATE_KEY_BY_PREFIX: Record<string, string> = {
  expiration: "expirationDate",
  estimated_publication: "estimatedPublicationDate",
  review: "reviewDate",
  audit: "auditDate",
};

function parseDateRange(params: URLSearchParams, prefix: string): HuemulDateRangeValue | undefined {
  const date = params.get(`${prefix}_date`) || undefined;
  const from = params.get(`${prefix}_date_from`) || undefined;
  const to = params.get(`${prefix}_date_to`) || undefined;
  if (!date && !from && !to) return undefined;
  return { date, from, to };
}

function parseValuesFromURL(params: URLSearchParams): HuemulFilterValues {
  const values: HuemulFilterValues = {
    query: params.get("q") ?? "",
    searchType: (params.get("search_type") as SearchType) || "semantic",
    documentTypeId: params.get("document_type_id") ?? "",
    templateId: params.get("template_id") ?? "",
    ownerValue: params.get("owner") ?? "",
    lifecycleState: params.get("lifecycle_state") ?? "__all__",
    filterWithLlm: params.get("filter_with_llm") !== "false",
    hasUnresolvedComments: params.get("has_unresolved_comments") === "true",
    hasPendingAiSuggestion: params.get("has_pending_ai_suggestion") === "true",
    customFieldFilter: params.getAll("custom_field_filter"),
  };
  for (const prefix of DATE_PREFIXES) {
    values[DATE_KEY_BY_PREFIX[prefix]] = parseDateRange(params, prefix);
  }
  return values;
}

function buildURLFromValues(values: HuemulFilterValues): URLSearchParams {
  const params = new URLSearchParams();
  const query = String(values.query ?? "").trim();
  if (query) params.set("q", query);
  params.set("search_type", String(values.searchType ?? "semantic"));
  if (values.documentTypeId) params.set("document_type_id", String(values.documentTypeId));
  if (values.templateId) params.set("template_id", String(values.templateId));
  if (values.ownerValue) params.set("owner", String(values.ownerValue));
  if (values.lifecycleState && values.lifecycleState !== "__all__") {
    params.set("lifecycle_state", String(values.lifecycleState));
  }
  if (values.filterWithLlm === false) params.set("filter_with_llm", "false");
  if (values.hasUnresolvedComments) params.set("has_unresolved_comments", "true");
  if (values.hasPendingAiSuggestion) params.set("has_pending_ai_suggestion", "true");
  const customFieldFilter = values.customFieldFilter as string[] | undefined;
  if (customFieldFilter?.length) {
    customFieldFilter.filter(Boolean).forEach((f) => params.append("custom_field_filter", f));
  }
  for (const prefix of DATE_PREFIXES) {
    const v = values[DATE_KEY_BY_PREFIX[prefix]] as HuemulDateRangeValue | undefined;
    if (!v) continue;
    if (v.date) params.set(`${prefix}_date`, v.date);
    if (v.from) params.set(`${prefix}_date_from`, v.from);
    if (v.to) params.set(`${prefix}_date_to`, v.to);
  }
  return params;
}

const dr = (v: HuemulFilterValue): HuemulDateRangeValue => (v as HuemulDateRangeValue | undefined) ?? {};

export default function SearchPage() {
  const { t } = useTranslation(["search", "common"]);
  const { t: tAssets } = useTranslation("assets");
  const { t: tFilters } = useTranslation("huemul-filters");
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedOrganizationId } = useOrganization();

  // ── async-combobox fetchers ──
  const fetchAssetTypes = useCallback(
    async ({ search: s, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAssetTypes(page, pageSize, s);
      return {
        options: (res.data ?? []).map((at) => ({ value: at.id, label: at.name, color: at.color ?? undefined })),
        hasMore: res.has_next ?? false,
      };
    },
    [],
  );

  const fetchTemplates = useCallback(
    async ({ search: s, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAllTemplates(selectedOrganizationId ?? "", s, page, pageSize);
      return {
        options: (res.data ?? []).map((tpl) => ({ value: tpl.id, label: tpl.name })),
        hasMore: res.has_next ?? false,
      };
    },
    [selectedOrganizationId],
  );

  const fetchUsers = useCallback(
    async ({ search: s, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getUsers(selectedOrganizationId ?? undefined, page, pageSize, s);
      return {
        options: (res.data ?? []).map((u) => ({
          value: u.id,
          label: [u.name, u.last_name].filter(Boolean).join(" "),
        })),
        hasMore: res.has_next ?? false,
      };
    },
    [selectedOrganizationId],
  );

  const initialValues = useMemo(() => parseValuesFromURL(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive the active searchType from the URL (kept in sync with `values` by the
  // persist effect below). Reading it here — rather than from the hook's `values`
  // — lets `filterDefs` toggle the LLM filter's visibility without a cycle
  // (filterDefs → hook → values → filterDefs).
  const currentSearchType = (searchParams.get("search_type") as SearchType) || "semantic";

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const groupSearch = tFilters("groups.search");
    const classification = tFilters("groups.classification");
    const dates = tFilters("groups.dates");
    const other = tFilters("groups.other");
    return [
      {
        // Rendered as the full-width search input in the header (not by the
        // filter system); kept here only so its value is tracked for URL/gating/clearAll.
        key: "query",
        type: "text",
        hidden: true,
        group: groupSearch,
        label: t("page.searchPlaceholder"),
        placeholder: t("page.searchPlaceholder"),
      },
      {
        key: "searchType",
        type: "select",
        toolbar: true,
        group: groupSearch,
        label: t("filters.searchType"),
        allValue: "semantic",
        inputClassName: "w-36",
        options: [
          { value: "semantic", label: t("page.typesSemantic") },
          { value: "title", label: t("page.typesTitle") },
          { value: "code", label: t("page.typesCode") },
          { value: "content", label: t("page.typesContent") },
        ],
      },
      {
        key: "documentTypeId",
        type: "async-combobox",
        group: classification,
        label: t("filters.assetType"),
        placeholder: t("filters.all"),
        fetchOptions: fetchAssetTypes,
        pageSize: 20,
      },
      {
        key: "templateId",
        type: "async-combobox",
        group: classification,
        label: t("filters.template"),
        placeholder: t("filters.all"),
        fetchOptions: fetchTemplates,
        pageSize: 20,
      },
      {
        key: "ownerValue",
        type: "async-combobox",
        group: classification,
        label: t("filters.ownerScope"),
        placeholder: t("filters.allOwners"),
        fetchOptions: fetchUsers,
        pageSize: 20,
        staticOptions: [
          { value: "__me__", label: t("filters.ownerMe"), description: t("filters.ownerMeDescription") },
        ],
        staticOptionsLabel: t("filters.ownerScopeLabel"),
        asyncResultsLabel: t("filters.ownerUsersLabel"),
      },
      {
        key: "lifecycleState",
        type: "select",
        group: classification,
        label: t("filters.lifecycleState"),
        allValue: "__all__",
        options: [
          { value: "__all__", label: t("filters.all") },
          { value: "draft", label: tAssets("lifecycle.stateLabels.draft") },
          { value: "in_review", label: tAssets("lifecycle.stateLabels.in_review") },
          { value: "in_approval", label: tAssets("lifecycle.stateLabels.in_approval") },
          { value: "approved", label: tAssets("lifecycle.stateLabels.approved") },
          { value: "published", label: tAssets("lifecycle.stateLabels.published") },
          { value: "archived", label: tAssets("lifecycle.stateLabels.archived") },
        ],
      },
      { key: "expirationDate", type: "date-range", group: dates, label: t("filters.expirationDate") },
      { key: "estimatedPublicationDate", type: "date-range", group: dates, label: t("filters.estimatedPublicationDate") },
      { key: "reviewDate", type: "date-range", group: dates, label: t("filters.reviewDate") },
      { key: "auditDate", type: "date-range", group: dates, label: t("filters.auditDate") },
      {
        key: "customFieldFilter",
        type: "custom",
        multiEntry: true,
        group: t("filters.customFieldsGroup"),
        label: t("filters.customFields"),
        render: ({ value, setValue }) => (
          <HuemulCustomFieldFilter
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(next) => setValue(next)}
          />
        ),
      },
      {
        key: "filterWithLlm",
        type: "boolean",
        group: other,
        label: t("filters.filterWithLlm"),
        chipLabel: t("filters.llmDisabledChip"),
        defaultValue: true,
        activeWhen: false,
        hidden: currentSearchType !== "semantic",
      },
      { key: "hasUnresolvedComments", type: "boolean", group: other, label: t("filters.unresolvedComments") },
      { key: "hasPendingAiSuggestion", type: "boolean", group: other, label: t("filters.pendingAiSuggestion") },
    ];
  }, [t, tAssets, tFilters, fetchAssetTypes, fetchTemplates, fetchUsers, currentSearchType]);

  const {
    values,
    open,
    setOpen,
    setValue,
    clearValue,
    clearAll,
    chips,
    activeCount,
    setSelectedLabel,
  } = useHuemulFilters({ filters: filterDefs, defaultOpen: false, initialValues });

  // Full-width search input draft; commits to values.query on Enter / "Buscar".
  const [queryDraft, setQueryDraft] = useState(String(values.query ?? ""));
  useEffect(() => {
    setQueryDraft(String(values.query ?? ""));
  }, [values.query]);

  const commitQuery = useCallback(() => {
    setValue("query", queryDraft.trim());
  }, [queryDraft, setValue]);

  const handleClearAll = useCallback(() => {
    setQueryDraft("");
    clearAll();
  }, [clearAll]);

  // Persist filter state to the URL (text only changes on Enter, selects on pick → no spam).
  useEffect(() => {
    setSearchParams(buildURLFromValues(values), { replace: true });
  }, [values, setSearchParams]);

  // "Nothing until search": active when there's query text or any real filter
  // (filterWithLlm alone does not trigger a search, matching prior behavior).
  const hasActiveSearch =
    !!String(values.query ?? "").trim() || chips.some((c) => c.key !== "filterWithLlm");

  const searchTypeForQuery = (String(values.searchType ?? "semantic")) as SearchType;
  const exp = dr(values.expirationDate);
  const estPub = dr(values.estimatedPublicationDate);
  const rev = dr(values.reviewDate);
  const aud = dr(values.auditDate);

  const { data: searchResponse, isLoading, isError, error, refetch } = useQuery<SearchResponse>({
    queryKey: ["search", values, selectedOrganizationId],
    queryFn: () =>
      search({
        query: String(values.query ?? ""),
        organizationId: selectedOrganizationId!,
        search_type: searchTypeForQuery,
        document_type_id: (values.documentTypeId as string) || null,
        template_id: (values.templateId as string) || null,
        owner_scope: values.ownerValue === "__me__" ? "me" : undefined,
        created_by: values.ownerValue && values.ownerValue !== "__me__" ? String(values.ownerValue) : undefined,
        lifecycle_state:
          values.lifecycleState && values.lifecycleState !== "__all__" ? String(values.lifecycleState) : null,
        filter_with_llm: searchTypeForQuery === "semantic" ? Boolean(values.filterWithLlm) : true,
        has_unresolved_comments: (values.hasUnresolvedComments as boolean) || undefined,
        has_pending_ai_suggestion: (values.hasPendingAiSuggestion as boolean) || undefined,
        expiration_date: exp.date || undefined,
        expiration_date_from: exp.from || undefined,
        expiration_date_to: exp.to || undefined,
        estimated_publication_date: estPub.date || undefined,
        estimated_publication_date_from: estPub.from || undefined,
        estimated_publication_date_to: estPub.to || undefined,
        review_date: rev.date || undefined,
        review_date_from: rev.from || undefined,
        review_date_to: rev.to || undefined,
        audit_date: aud.date || undefined,
        audit_date_from: aud.from || undefined,
        audit_date_to: aud.to || undefined,
        custom_field_filter: (values.customFieldFilter as string[] | undefined)?.filter(Boolean).length
          ? (values.customFieldFilter as string[]).filter(Boolean)
          : undefined,
      }),
    enabled: hasActiveSearch && !!selectedOrganizationId,
  });

  const canSearch = !!queryDraft.trim() || hasActiveSearch;

  const header = (
    <div className="flex flex-col gap-3">
      <PageHeader icon={Search} title={t("page.title")} showRefresh={false} className="!mb-0 !space-y-0" />

      {/* Full-width search row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitQuery(); }}
            placeholder={t("page.searchPlaceholder")}
            className="w-full pl-9"
          />
        </div>
        <HuemulButton
          icon={Search}
          label={t("common:search")}
          loading={isLoading}
          disabled={!canSearch}
          onClick={commitQuery}
        />
        {hasActiveSearch && (
          <HuemulButton
            variant="outline"
            icon={X}
            tooltip={t("page.clearSearch")}
            onClick={handleClearAll}
          />
        )}
      </div>

      {/* Filter controls (left-aligned) */}
      <div className="flex items-center gap-2">
        <HuemulFilterButton count={activeCount} open={open} onToggle={() => setOpen(!open)} />
        <HuemulFilterInline
          filters={filterDefs}
          values={values}
          onChange={setValue}
          onSelectedLabel={setSelectedLabel}
        />
      </div>
    </div>
  );

  return (
    <HuemulPageLayout
      header={header}
      headerClassName="px-6 py-4 md:px-8 md:py-5"
      columns={[
        {
          content: (
            <HuemulFilterPanel
              filters={filterDefs}
              values={values}
              onChange={setValue}
              onSelectedLabel={setSelectedLabel}
              onClose={() => setOpen(false)}
            />
          ),
          show: open,
          defaultSize: 22,
          minSize: 16,
          maxSize: 35,
          collapsible: true,
        },
        {
          content: (
            <div className="flex flex-col h-full overflow-auto p-6 md:p-8 pt-4 md:pt-6 gap-4">
              <HuemulFilterChips chips={chips} onRemove={clearValue} onClearAll={handleClearAll} />

              {!hasActiveSearch && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                  <Search className="w-8 h-8 text-muted-foreground mb-3" />
                  <h3 className="text-sm font-medium text-foreground mb-1">{t("empty.initialTitle")}</h3>
                  <p className="text-xs text-muted-foreground">{t("empty.initialDescription")}</p>
                </div>
              )}

              {hasActiveSearch && (
                <div className="space-y-4 pb-8">
                  {isLoading && <SearchResultsSkeleton />}

                  {isError && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                      <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
                      <p className="text-red-600 mb-2 font-medium">
                        {getErrorMessage(error, t("errors.performSearch"))}
                      </p>
                      {ApiError.isApiError(error) && error.detail && (
                        <p className="text-sm text-muted-foreground mb-4">{error.detail}</p>
                      )}
                      {!ApiError.isApiError(error) && (
                        <p className="text-sm text-muted-foreground mb-4">{t("errors.tryAgain")}</p>
                      )}
                      <HuemulButton
                        variant="outline"
                        size="sm"
                        label={t("errors.retry")}
                        onClick={() => { refetch(); }}
                      />
                    </div>
                  )}

                  {searchResponse && searchResponse.data.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                      <FileText className="w-8 h-8 text-muted-foreground mb-3" />
                      <h3 className="text-sm font-medium text-foreground mb-1">{t("empty.noResultsTitle")}</h3>
                      <p className="text-xs text-muted-foreground">{t("empty.noResultsDescription")}</p>
                    </div>
                  )}

                  {searchResponse && searchResponse.data.length > 0 && (
                    <div className="space-y-4">
                      <div className="mb-4">
                        <h2 className="text-sm font-semibold text-foreground mb-3">{t("page.supportingDocuments")}</h2>
                        <div className="space-y-3">
                          {searchResponse.data.map((document: SearchResultDocument) => (
                            <DocumentResult key={document.document_id} document={document} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
