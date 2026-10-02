import { useMemo, useEffect, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, FileText, AlertTriangle, X, Sparkles } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { PageHeader } from "@/huemul/components/huemul-page-header";
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout";
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied";
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button";
import { HuemulFilterInline } from "@/huemul/components/huemul-filter-inline";
import { HuemulFilterPanel } from "@/huemul/components/huemul-filter-panel";
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips";
import { HuemulCustomFieldFilter } from "@/huemul/components/huemul-custom-field-filter";
import { useHuemulFilters } from "@/hooks/useHuemulFilters";
import { usePageAccess } from "@/hooks/usePageAccess";

import { search } from "@/services/search";
import type { SearchType, SearchResultDocument, SearchResponse } from "@/services/search";
import { getAssetTypes } from "@/services/asset-types";
import { getUsers } from "@/services/users";
import { getAllTemplates } from "@/services/templates";
import { getTags } from "@/services/tags";
import { useOrganization } from "@/contexts/organization-context";
import { DocumentResult } from "@/components/search/search-document-result";
import { SearchPassageResult } from "@/components/search/search-passage-result";
import { SearchPassageFeedback } from "@/components/search/search-passage-feedback";
import { SearchPassageGroup } from "@/components/search/search-passage-group";
import { HuemulSegmentedControl } from "@/huemul/components/huemul-segmented-control";
import { HuemulPagination } from "@/huemul/components/huemul-pagination";
import { groupPassagesByAsset } from "@/lib/search-passages";
import {
  GROUPED_PAGE_SIZE,
  PASSAGES_PAGE_SIZE,
  parseDisplayFromURL,
  parseModeFromURL,
  type PassageDisplay,
  type SearchMode,
} from "@/lib/search-mode";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { HuemulNotice } from "@/huemul/components/huemul-notice";
import { useSearchPassages } from "@/hooks/useSearchPassages";
import { useOrgPath } from "@/hooks/useOrgRouter";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import type { SearchIn, SearchPassagesBusinessDates, SearchPassagesParams, VersionScope } from "@/types/search";
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
    documentTypeIds: params.getAll("document_type_ids"),
    versionScope: (params.get("version_scope") as VersionScope) || "official",
    includeFiles: params.get("include_files") === "true",
    templateId: params.get("template_id") ?? "",
    tagIds: params.getAll("tag_id"),
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

function buildURLFromValues(values: HuemulFilterValues, mode: SearchMode, display: PassageDisplay): URLSearchParams {
  const params = new URLSearchParams();
  const query = String(values.query ?? "").trim();
  if (query) params.set("q", query);
  params.set("mode", mode);
  if (mode !== "classic" && display === "asset") params.set("group", "asset");
  if (mode === "classic") params.set("search_type", String(values.searchType ?? "semantic"));
  asList(values.documentTypeIds).forEach((id) => params.append("document_type_ids", id));
  if (values.versionScope && values.versionScope !== "official") params.set("version_scope", String(values.versionScope));
  if (values.includeFiles) params.set("include_files", "true");
  if (values.documentTypeId) params.set("document_type_id", String(values.documentTypeId));
  if (values.templateId) params.set("template_id", String(values.templateId));
  asList(values.tagIds).forEach((id) => params.append("tag_id", id));
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

/** Lista de ids de un filtro múltiple; tolera `''` (un filtro sin def por permisos). */
const asList = (v: HuemulFilterValue): string[] => (Array.isArray(v) ? (v as string[]).filter(Boolean) : []);
const dr = (v: HuemulFilterValue): HuemulDateRangeValue => (v as HuemulDateRangeValue | undefined) ?? {};

/** Las cuatro fechas de negocio con el nombre del query param (`expiration_date_from`, …). */
function businessDatesFromValues(values: HuemulFilterValues): SearchPassagesBusinessDates {
  const dates: Record<string, string> = {};
  for (const prefix of DATE_PREFIXES) {
    const v = dr(values[DATE_KEY_BY_PREFIX[prefix]]);
    if (v.date) dates[`${prefix}_date`] = v.date;
    if (v.from) dates[`${prefix}_date_from`] = v.from;
    if (v.to) dates[`${prefix}_date_to`] = v.to;
  }
  return dates as SearchPassagesBusinessDates;
}

export default function SearchPage() {
  const { t } = useTranslation(["search", "common"]);
  const { t: tAssets } = useTranslation("assets");
  const { t: tFilters } = useTranslation("huemul-filters");
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedOrganizationId, organizationToken } = useOrganization();
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess("search");

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

  const fetchTags = useCallback(
    async ({ search: s, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getTags({ search: s || undefined, page, page_size: pageSize });
      return {
        options: (res.data ?? []).map((tag) => ({ value: tag.id, label: tag.name, color: tag.color ?? undefined })),
        hasMore: res.has_next ?? false,
      };
    },
    [],
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
  // El modo y la presentación no son filtros: "Limpiar filtros" no los toca.
  const [mode, setMode] = useState<SearchMode>(() => parseModeFromURL(searchParams));
  const [display, setDisplay] = useState<PassageDisplay>(() => parseDisplayFromURL(searchParams));
  const [page, setPage] = useState(1);
  const isPassages = mode !== "classic";
  const buildPath = useOrgPath();
  const { canAccessModels, canRead } = useUserPermissions();

  // Cada filtro que pega al backend se gatea con el permiso del endpoint que
  // dispara, no con el de la página (ver ia context/rbac-audit-guide.md).
  const canFilterByAssetType = can("filterByAssetType");
  const canFilterByTemplate = can("filterByTemplate");
  const canFilterByUser = can("filterByUser");
  const canFilterByCustomField = can("filterByCustomField");
  const canFilterByTag = can("filterByTag");

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
        hidden: isPassages,
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
      // Sin filterByAssetType: se omite la entrada entera (elimina su chip
      // sin tocar useHuemulFilters, mismo patrón que /diagrams).
      ...(canFilterByAssetType
        ? [
            {
              key: "documentTypeId",
              type: "async-combobox" as const,
              hidden: isPassages,
              group: classification,
              label: t("filters.assetType"),
              placeholder: t("filters.all"),
              fetchOptions: fetchAssetTypes,
              pageSize: 20,
            },
            // Avanzada y Profunda aceptan varios tipos a la vez ("políticas y procedimientos");
            // /search/ acepta uno. Al cambiar de modo el valor pasa de una clave a la otra.
            {
              key: "documentTypeIds",
              type: "async-combobox" as const,
              multiSelect: true,
              hidden: !isPassages,
              group: classification,
              label: t("filters.assetTypes"),
              placeholder: t("filters.all"),
              fetchOptions: fetchAssetTypes,
              pageSize: 20,
            },
          ]
        : []),
      {
        key: "versionScope",
        type: "select",
        hidden: !isPassages,
        group: classification,
        label: t("filters.versionScope"),
        allValue: "official",
        options: [
          { value: "official", label: t("filters.versionScopeOfficial") },
          { value: "latest", label: t("filters.versionScopeLatest") },
          { value: "all", label: t("filters.versionScopeAll") },
        ],
      },
      ...(canFilterByTemplate
        ? [
            {
              key: "templateId",
              type: "async-combobox" as const,
              group: classification,
              label: t("filters.template"),
              placeholder: t("filters.all"),
              fetchOptions: fetchTemplates,
              pageSize: 20,
            },
          ]
        : []),
      // Varias etiquetas se combinan con OR, en los tres modos.
      ...(canFilterByTag
        ? [
            {
              key: "tagIds",
              type: "async-combobox" as const,
              multiSelect: true,
              group: classification,
              label: t("filters.tag"),
              placeholder: t("filters.all"),
              fetchOptions: fetchTags,
              pageSize: 20,
            },
          ]
        : []),
      // Sin filterByUser: se degrada a un select estático de una sola opción
      // ("Mis assets") en vez de omitir la entrada — la key también la
      // escribe el flujo __me__, y omitirla dejaría un valor huérfano fuera
      // de chips/clearAll (mismo patrón que /home).
      canFilterByUser
        ? ({
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
          } as HuemulFilterDef)
        : ({
            key: "ownerValue",
            type: "select",
            group: classification,
            label: t("filters.ownerScope"),
            allValue: "",
            options: [
              { value: "", label: t("filters.allOwners") },
              { value: "__me__", label: t("filters.ownerMe") },
            ],
          } as HuemulFilterDef),
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
          { value: "finalized", label: tAssets("lifecycle.stateLabels.finalized") },
        ],
      },
      { key: "expirationDate", type: "date-range", group: dates, label: t("filters.expirationDate") },
      { key: "estimatedPublicationDate", type: "date-range", group: dates, label: t("filters.estimatedPublicationDate") },
      { key: "reviewDate", type: "date-range", group: dates, label: t("filters.reviewDate") },
      { key: "auditDate", type: "date-range", group: dates, label: t("filters.auditDate") },
      ...(canFilterByCustomField
        ? [
            {
              key: "customFieldFilter",
              type: "custom" as const,
              multiEntry: true,
              group: t("filters.customFieldsGroup"),
              label: t("filters.customFields"),
              render: ({ value, setValue }: { value: HuemulFilterValue; setValue: (v: HuemulFilterValue) => void }) => (
                <HuemulCustomFieldFilter
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onChange={(next) => setValue(next)}
                />
              ),
            },
          ]
        : []),
      {
        key: "filterWithLlm",
        type: "boolean",
        group: other,
        label: t("filters.filterWithLlm"),
        chipLabel: t("filters.llmDisabledChip"),
        defaultValue: true,
        activeWhen: false,
        hidden: isPassages || currentSearchType !== "semantic",
      },
      { key: "hasUnresolvedComments", type: "boolean", group: other, label: t("filters.unresolvedComments") },
      { key: "hasPendingAiSuggestion", type: "boolean", group: other, label: t("filters.pendingAiSuggestion") },
      {
        key: "includeFiles",
        type: "boolean",
        hidden: !isPassages,
        group: other,
        label: t("filters.includeFiles"),
      },
    ];
  }, [
    t,
    tAssets,
    tFilters,
    fetchAssetTypes,
    fetchTemplates,
    fetchTags,
    fetchUsers,
    currentSearchType,
    isPassages,
    canFilterByAssetType,
    canFilterByTemplate,
    canFilterByTag,
    canFilterByUser,
    canFilterByCustomField,
  ]);

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
    setSearchParams(buildURLFromValues(values, mode, display), { replace: true });
  }, [values, mode, display, setSearchParams]);

  // Otra consulta, otro filtro, otro modo u otra presentación: vuelta a la página 1.
  useEffect(() => {
    setPage(1);
  }, [values, mode, display]);

  const chipLabel = useCallback(
    (key: string) => {
      const chip = chips.find((c) => c.key === key);
      if (!chip) return undefined;
      const sep = chip.label.indexOf(": ");
      return sep === -1 ? undefined : chip.label.slice(sep + 2);
    },
    [chips],
  );

  const changeMode = useCallback(
    (next: SearchMode) => {
      // El tipo de activo es único en la Clásica y múltiple en las otras: se traslada.
      const single = String(values.documentTypeId ?? "");
      const multi = asList(values.documentTypeIds);
      if (next === "classic" && mode !== "classic" && multi.length) {
        const label = chipLabel("documentTypeIds")?.split(", ")[0];
        setValue("documentTypeId", multi[0]);
        setSelectedLabel("documentTypeId", label);
        setValue("documentTypeIds", []);
        setSelectedLabel("documentTypeIds", undefined);
      } else if (next !== "classic" && mode === "classic" && single) {
        const label = chipLabel("documentTypeId");
        setValue("documentTypeIds", [single]);
        setSelectedLabel("documentTypeIds", label);
        setValue("documentTypeId", "");
        setSelectedLabel("documentTypeId", undefined);
      }
      setMode(next);
    },
    [values.documentTypeId, values.documentTypeIds, mode, chipLabel, setValue, setSelectedLabel],
  );

  // "Nothing until search": active when there's query text or any real filter
  // (filterWithLlm alone does not trigger a search, matching prior behavior).
  // Por pasajes solo se busca con texto: el endpoint no busca solo por filtros.
  const hasQueryText = !!String(values.query ?? "").trim();
  const hasActiveSearch = isPassages
    ? hasQueryText
    : hasQueryText || chips.some((c) => c.key !== "filterWithLlm");

  const searchTypeForQuery = (String(values.searchType ?? "semantic")) as SearchType;
  const exp = dr(values.expirationDate);
  const estPub = dr(values.estimatedPublicationDate);
  const rev = dr(values.reviewDate);
  const aud = dr(values.auditDate);

  const { data: searchResponse, isLoading, isError, error, refetch } = useQuery<SearchResponse>({
    queryKey: ["search", values, selectedOrganizationId, mode],
    queryFn: () =>
      search({
        query: String(values.query ?? ""),
        organizationId: selectedOrganizationId!,
        search_type: searchTypeForQuery,
        document_type_id: (values.documentTypeId as string) || null,
        template_id: (values.templateId as string) || null,
        tag_id: asList(values.tagIds),
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
    enabled:
      !isPassages &&
      hasActiveSearch &&
      !!selectedOrganizationId &&
      !!organizationToken &&
      can("performSearch"),
  });

  const passagesParams = useMemo<SearchPassagesParams | null>(() => {
    if (!isPassages || !selectedOrganizationId) return null;
    const lifecycle = values.lifecycleState && values.lifecycleState !== "__all__" ? [String(values.lifecycleState)] : undefined;
    const customFields = (values.customFieldFilter as string[] | undefined)?.filter(Boolean);
    const owner = String(values.ownerValue ?? "");
    return {
      organizationId: selectedOrganizationId,
      query: String(values.query ?? "").trim(),
      versionScope: (values.versionScope as VersionScope) || "official",
      lifecycleStates: lifecycle,
      documentTypeIds: asList(values.documentTypeIds),
      templateId: (values.templateId as string) || null,
      tagIds: asList(values.tagIds),
      ownerScope: owner === "__me__" ? "me" : undefined,
      createdBy: owner && owner !== "__me__" ? owner : null,
      hasUnresolvedComments: (values.hasUnresolvedComments as boolean) || undefined,
      hasPendingAiSuggestion: (values.hasPendingAiSuggestion as boolean) || undefined,
      businessDates: businessDatesFromValues(values),
      customFieldFilter: customFields?.length ? customFields : undefined,
      searchIn: (values.includeFiles ? ["executions", "media"] : ["executions"]) as SearchIn[],
      highPrecision: mode === "deep",
      page,
      pageSize: display === "asset" ? GROUPED_PAGE_SIZE : PASSAGES_PAGE_SIZE,
    };
  }, [isPassages, selectedOrganizationId, values, mode, page, display]);

  const passagesQuery = useSearchPassages(passagesParams, {
    enabled: isPassages && hasActiveSearch && !!organizationToken && can("searchPassages"),
  });
  const passagesResponse = passagesQuery.data;
  const rerankNotConfigured =
    ApiError.isApiError(passagesQuery.error) && passagesQuery.error.code === "RERANK_LLM_NOT_CONFIGURED";
  const canSendFeedback = can("sendSearchFeedback");
  const canDownloadMedia = canRead("media");

  const canSearch = !!queryDraft.trim() || hasActiveSearch;
  const passageGroups = useMemo(
    () => (display === "asset" && passagesResponse ? groupPassagesByAsset(passagesResponse.passages) : []),
    [display, passagesResponse],
  );
  const modeOptions = [
    { value: "classic" as const, label: t("modes.classic.label"), title: t("modes.classic.hint") },
    { value: "advanced" as const, label: t("modes.advanced.label"), title: t("modes.advanced.hint") },
    { value: "deep" as const, label: t("modes.deep.label"), title: t("modes.deep.hint"), icon: Sparkles },
  ];

  if (isLoadingPermissions) {
    return (
      <div className="flex h-full flex-col gap-4 p-6 md:p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!canAccessPage) {
    return <HuemulAccessDenied />;
  }

  const header = (
    <div className="flex flex-col gap-3">
      {/* Sin refresh: la query solo corre con búsqueda activa (`enabled`);
          el botón Search de abajo ya la re-ejecuta. */}
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
          loading={isPassages ? passagesQuery.isFetching : isLoading}
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
      <div className="flex flex-wrap items-center gap-2">
        <HuemulSegmentedControl
          value={mode}
          options={modeOptions}
          onChange={changeMode}
          ariaLabel={t("modes.label")}
          className="w-auto shrink-0"
          optionClassName="px-4"
        />
        {isPassages && (
          <HuemulSegmentedControl
            value={display}
            options={[
              { value: "passage" as const, label: t("display.passage") },
              { value: "asset" as const, label: t("display.asset") },
            ]}
            onChange={setDisplay}
            ariaLabel={t("display.label")}
            className="w-auto shrink-0"
          />
        )}
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

              {isPassages && !hasActiveSearch && chips.length > 0 && (
                <HuemulNotice tone="blue">{t("passages.needsQuery")}</HuemulNotice>
              )}

              {isPassages && hasActiveSearch && (
                <div className="space-y-4 pb-8">
                  {passagesQuery.isLoading && <SearchResultsSkeleton />}

                  {rerankNotConfigured && (
                    <HuemulNotice
                      tone="amber"
                      action={
                        <span className="flex shrink-0 items-center gap-2">
                          <HuemulButton
                            variant="outline"
                            size="sm"
                            label={t("passages.searchAdvanced")}
                            onClick={() => changeMode("advanced")}
                            className="h-7 text-xs"
                          />
                          {canAccessModels && (
                            <Link to={buildPath("/models")} className="text-xs font-semibold underline hover:cursor-pointer">
                              {t("passages.configureModel")}
                            </Link>
                          )}
                        </span>
                      }
                    >
                      {t("passages.rerankNotConfigured")}
                    </HuemulNotice>
                  )}

                  {passagesQuery.isError && !rerankNotConfigured && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                      <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
                      <p className="text-red-600 mb-2 font-medium">
                        {getErrorMessage(passagesQuery.error, t("errors.performSearch"))}
                      </p>
                      <HuemulButton
                        variant="outline"
                        size="sm"
                        label={t("errors.retry")}
                        onClick={() => { passagesQuery.refetch(); }}
                      />
                    </div>
                  )}

                  {passagesResponse && passagesResponse.passages.length === 0 && !passagesQuery.isLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                      <FileText className="w-8 h-8 text-muted-foreground mb-3" />
                      <h3 className="text-sm font-medium text-foreground mb-1">{t("empty.noResultsTitle")}</h3>
                      <p className="text-xs text-muted-foreground">{t("empty.noResultsDescription")}</p>
                    </div>
                  )}

                  {passagesResponse && passagesResponse.passages.length > 0 && (
                    <div className="space-y-3">
                      {passagesResponse.high_precision.requested && passagesResponse.high_precision.error && (
                        <HuemulNotice tone="blue">{t("passages.rerankFailed")}</HuemulNotice>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold text-foreground">
                          {t("passages.title")}{" "}
                          <span className="font-normal text-muted-foreground">
                            ·{" "}
                            {page > 1 || passagesResponse.has_next
                              ? t("passages.countPaged", { page, count: passagesResponse.passages.length })
                              : t("passages.count", { count: passagesResponse.passages.length })}
                          </span>
                        </h2>
                        {canSendFeedback && passagesResponse.search_log_id && selectedOrganizationId && (
                          <SearchPassageFeedback
                            key={passagesResponse.search_log_id}
                            organizationId={selectedOrganizationId}
                            searchLogId={passagesResponse.search_log_id}
                            label={t("feedback.searchQuestion")}
                          />
                        )}
                      </div>
                      {passagesResponse.high_precision.applied && passagesResponse.high_precision.llm_name && (
                        <p className="text-[11px] text-muted-foreground">
                          {t("passages.rankedWith", { name: passagesResponse.high_precision.llm_name })}
                        </p>
                      )}
                      {display === "asset"
                        ? passageGroups.map((group) => (
                            <SearchPassageGroup
                              key={`${passagesResponse.search_log_id ?? "log"}-${group.documentId}`}
                              group={group}
                              organizationId={selectedOrganizationId ?? ""}
                              searchLogId={passagesResponse.search_log_id}
                              canSendFeedback={canSendFeedback}
                            />
                          ))
                        : passagesResponse.passages.map((passage) => (
                            <SearchPassageResult
                              key={`${passagesResponse.search_log_id ?? "log"}-${passage.passage_id}`}
                              passage={passage}
                              organizationId={selectedOrganizationId ?? ""}
                              searchLogId={passagesResponse.search_log_id}
                              canSendFeedback={canSendFeedback}
                              canDownloadMedia={canDownloadMedia}
                            />
                          ))}
                      {(page > 1 || passagesResponse.has_next) && (
                        <HuemulPagination
                          page={page}
                          pageSize={passagesResponse.page_size ?? passagesParams?.pageSize ?? PASSAGES_PAGE_SIZE}
                          hasNext={Boolean(passagesResponse.has_next)}
                          hasPrevious={page > 1}
                          onPageChange={setPage}
                          variant="bare"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isPassages && hasActiveSearch && (
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
