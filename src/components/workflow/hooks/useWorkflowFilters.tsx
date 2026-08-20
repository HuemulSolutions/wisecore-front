import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { usePageAccess } from "@/hooks/usePageAccess"
import { HuemulCustomFieldFilter } from "@/huemul/components/huemul-custom-field-filter"
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field"
import { getDocumentTypes } from "@/services/document-types"
import { getUsers } from "@/services/users"
import { getAllTemplates } from "@/services/templates"
import type { HuemulFilterDef, HuemulFilterValue, HuemulDateRangeValue } from "@/types/huemul"
import type { UseWorkflowsOptions } from "@/types/workflow"
import type { ExecutionLifecycleState } from "@/types/execution"

interface UseWorkflowFiltersOptions {
  can: ReturnType<typeof usePageAccess<"workflow">>["can"]
  selectedOrganizationId: string | null
  /** Vuelve a page 1: se dispara en cada cambio de filtro (ver filter-panel-guide.md §2). */
  onPageReset: () => void
}

export type WorkflowQueryParams = Omit<UseWorkflowsOptions, "enabled" | "page" | "pageSize">

/**
 * Filtros de /workflow: declaración de filterDefs (superficie RBAC — cada
 * combobox asíncrono pega a su propio endpoint, ver rbac-audit-guide.md 17ª
 * pasada) + estado de useHuemulFilters + mapeo values -> params de useWorkflows.
 */
export function useWorkflowFilters({ can, selectedOrganizationId, onPageReset }: UseWorkflowFiltersOptions) {
  const { t } = useTranslation("workflow")
  const { t: tAssets } = useTranslation("assets")
  const { t: tFilters } = useTranslation("huemul-filters")

  const fetchDocumentTypes = useCallback(
    async ({ search: s }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getDocumentTypes({ search: s || undefined })
      return {
        options: (res.data ?? []).map((dt) => ({ value: dt.id, label: dt.name })),
        hasMore: false,
      }
    },
    [],
  )

  const fetchUsers = useCallback(
    async ({ search: s, page: p, pageSize: ps }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getUsers(selectedOrganizationId ?? undefined, p, ps, s)
      return {
        options: (res.data ?? []).map((u) => ({
          value: u.id,
          label: [u.name, u.last_name].filter(Boolean).join(" "),
        })),
        hasMore: res.has_next ?? false,
      }
    },
    [selectedOrganizationId],
  )

  const fetchExpressTemplates = useCallback(
    async ({ search: s, page: p, pageSize: ps }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getAllTemplates(selectedOrganizationId ?? "", s, p, ps, {
        can_create_express: true,
        mostrar_en_workflow: true,
      })
      return {
        options: (res.data ?? []).map((tpl) => ({ value: tpl.id, label: tpl.name })),
        hasMore: res.has_next ?? false,
      }
    },
    [selectedOrganizationId],
  )

  // Los filtros son superficie RBAC: cada combobox asíncrono pega a un endpoint
  // de OTRO recurso y sin permiso se come un 403 mudo al abrirse. Se omite la
  // entrada de `filterDefs` (elimina también su chip sin tocar useHuemulFilters).
  const canFilterByAssetType = can("listAssetTypes")
  const canFilterByTemplate = can("listTemplates")
  const canFilterByUser = can("listUsers")
  const canFilterByCustomField = can("listCustomFields")

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const classification = tFilters("groups.classification")
    const dates = tFilters("groups.dates")
    const other = tFilters("groups.other")
    return [
      {
        key: "search",
        type: "text",
        group: tFilters("groups.search"),
        toolbar: true,
        label: t("filters.search"),
        placeholder: t("filters.searchPlaceholder"),
        inputClassName: "w-full min-w-0",
      },
      {
        key: "lifecycleState",
        type: "select",
        group: classification,
        label: t("filters.lifecycleState"),
        allValue: "__all__",
        options: [
          { value: "__all__", label: t("filters.allLifecycleStates") },
          { value: "draft", label: tAssets("lifecycle.stateLabels.draft") },
          { value: "in_review", label: tAssets("lifecycle.stateLabels.in_review") },
          { value: "in_approval", label: tAssets("lifecycle.stateLabels.in_approval") },
          { value: "approved", label: tAssets("lifecycle.stateLabels.approved") },
          { value: "published", label: tAssets("lifecycle.stateLabels.published") },
          { value: "archived", label: tAssets("lifecycle.stateLabels.archived") },
        ],
      },
      // Sin el permiso del recurso que consulta, se omite la entrada entera
      // (elimina también su chip sin tocar useHuemulFilters, patrón /diagrams).
      ...(canFilterByAssetType
        ? [
            {
              key: "documentTypeId",
              type: "async-combobox" as const,
              group: classification,
              label: t("filters.documentType"),
              placeholder: t("filters.allDocumentTypes"),
              fetchOptions: fetchDocumentTypes,
              pageSize: 50,
              searchOnEnter: true,
            },
          ]
        : []),
      ...(canFilterByTemplate
        ? [
            {
              key: "templateId",
              type: "async-combobox" as const,
              group: classification,
              label: t("filters.template"),
              placeholder: t("filters.allTemplates"),
              fetchOptions: fetchExpressTemplates,
              pageSize: 20,
              searchOnEnter: true,
            },
          ]
        : []),
      // Sin `user:l|r` se DEGRADA a un select estático en vez de omitirse: la
      // opción __me__ manda owner_scope=me y no lista usuarios, y omitir la
      // entrada dejaría ese valor huérfano fuera de chips/clearAll (patrón /home).
      canFilterByUser
        ? ({
            key: "ownerValue",
            type: "async-combobox",
            group: classification,
            label: t("filters.ownerScope"),
            placeholder: t("filters.allOwners"),
            fetchOptions: fetchUsers,
            pageSize: 20,
            searchOnEnter: true,
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
      { key: "hasPendingAiSuggestion", type: "boolean", group: other, label: t("filters.pendingAiSuggestion") },
      { key: "hasUnresolvedComments", type: "boolean", group: other, label: t("filters.unresolvedComments") },
      { key: "expiringSoon", type: "boolean", group: other, label: t("filters.expiringSoon") },
    ]
  }, [
    t,
    tAssets,
    tFilters,
    fetchDocumentTypes,
    fetchExpressTemplates,
    fetchUsers,
    canFilterByAssetType,
    canFilterByTemplate,
    canFilterByUser,
    canFilterByCustomField,
  ])

  const {
    values,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    setValue,
    clearValue,
    clearAll,
    chips,
    activeCount,
    setSelectedLabel,
  } = useHuemulFilters({ filters: filterDefs, defaultOpen: false })

  const handleFilterChange = useCallback(
    (key: string, value: HuemulFilterValue) => {
      setValue(key, value)
      onPageReset()
    },
    [setValue, onPageReset],
  )

  const handleChipRemove = useCallback(
    (key: string) => {
      clearValue(key)
      onPageReset()
    },
    [clearValue, onPageReset],
  )

  const handleClearAll = useCallback(() => {
    clearAll()
    onPageReset()
  }, [clearAll, onPageReset])

  const expiration = (values.expirationDate as HuemulDateRangeValue | undefined) ?? {}
  const estimatedPublication = (values.estimatedPublicationDate as HuemulDateRangeValue | undefined) ?? {}
  const review = (values.reviewDate as HuemulDateRangeValue | undefined) ?? {}
  const audit = (values.auditDate as HuemulDateRangeValue | undefined) ?? {}

  const queryParams: WorkflowQueryParams = {
    search: (values.search as string) || undefined,
    document_type_id: (values.documentTypeId as string) || undefined,
    template_id: (values.templateId as string) || undefined,
    lifecycle_state: (values.lifecycleState && values.lifecycleState !== "__all__"
      ? values.lifecycleState
      : undefined) as ExecutionLifecycleState | undefined,
    owner_scope: values.ownerValue === "__me__" ? "me" : undefined,
    created_by: values.ownerValue && values.ownerValue !== "__me__" ? String(values.ownerValue) : undefined,
    has_pending_ai_suggestion: (values.hasPendingAiSuggestion as boolean) || undefined,
    has_unresolved_comments: (values.hasUnresolvedComments as boolean) || undefined,
    expiring_soon: (values.expiringSoon as boolean) || undefined,
    expiration_date: expiration.date || undefined,
    expiration_date_from: expiration.from || undefined,
    expiration_date_to: expiration.to || undefined,
    estimated_publication_date: estimatedPublication.date || undefined,
    estimated_publication_date_from: estimatedPublication.from || undefined,
    estimated_publication_date_to: estimatedPublication.to || undefined,
    review_date: review.date || undefined,
    review_date_from: review.from || undefined,
    review_date_to: review.to || undefined,
    audit_date: audit.date || undefined,
    audit_date_from: audit.from || undefined,
    audit_date_to: audit.to || undefined,
    custom_field_filter: (values.customFieldFilter as string[] | undefined)?.filter(Boolean).length
      ? (values.customFieldFilter as string[]).filter(Boolean)
      : undefined,
  }

  return {
    filterDefs,
    values,
    filtersOpen,
    setFiltersOpen,
    handleFilterChange,
    handleChipRemove,
    handleClearAll,
    chips,
    activeCount,
    setSelectedLabel,
    queryParams,
  }
}
