import { useCallback, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useTokenUsageSummary, tokenUsageQueryKeys } from "@/hooks/useTokenUsage"
import { organizationDailyModelTelemetryQueryKeys } from "@/hooks/useOrganizationDailyModelTelemetry"
import { useHuemulFilters } from "@/hooks/useHuemulFilters"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulFilterButton } from "@/huemul/components/huemul-filter-button"
import { HuemulFilterInline } from "@/huemul/components/huemul-filter-inline"
import { HuemulFilterPanel } from "@/huemul/components/huemul-filter-panel"
import { HuemulFilterChips } from "@/huemul/components/huemul-filter-chips"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { getUsers } from "@/services/users"
import { getBrowserDateLocale } from "@/lib/format-date-range"
import { TokenUsagePageHeader } from "@/components/token-usage/token-usage-page-header"
import type { TokenUsagePeriodPreset } from "@/components/token-usage/token-usage-period-selector"
import { TokenUsageSummaryCards } from "@/components/token-usage/token-usage-summary-cards"
import { TokenUsageByUserTab } from "@/components/token-usage/token-usage-by-user-tab"
import { TokenUsagePlaceholderTab } from "@/components/token-usage/token-usage-placeholder-tab"
import type { FetchOptionsParams, FetchOptionsResult } from "@/huemul/components/huemul-field"
import type { HuemulFilterDef } from "@/types/huemul"

function computeDateRange(
  preset: TokenUsagePeriodPreset,
  customFrom: string,
  customTo: string,
): { dateFrom: string; dateTo: string } {
  const now = new Date()
  if (preset === "last3Months") {
    return {
      dateFrom: format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"),
      dateTo: format(endOfMonth(now), "yyyy-MM-dd"),
    }
  }
  if (preset === "custom" && customFrom && customTo) {
    return { dateFrom: customFrom, dateTo: customTo }
  }
  return {
    dateFrom: format(startOfMonth(now), "yyyy-MM-dd"),
    dateTo: format(endOfMonth(now), "yyyy-MM-dd"),
  }
}

function computePeriodLabel(preset: TokenUsagePeriodPreset, dateFrom: string, dateTo: string): string {
  const locale = getBrowserDateLocale()
  const capitalize = (s: string) => (s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s)
  if (preset === "thisMonth") {
    return capitalize(format(parseISO(dateFrom), "MMMM yyyy", { locale }))
  }
  const from = capitalize(format(parseISO(dateFrom), "MMM yyyy", { locale }))
  const to = capitalize(format(parseISO(dateTo), "MMM yyyy", { locale }))
  return from === to ? from : `${from} – ${to}`
}

function TokenUsagePageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  )
}

export default function TokenUsagePage() {
  const { t } = useTranslation("token-usage")
  const { t: tCommon } = useTranslation("common")
  const { t: tFilters } = useTranslation("huemul-filters")
  const queryClient = useQueryClient()

  const { canAccessTokenUsage, isLoading: isLoadingPermissions } = useUserPermissions()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [preset, setPreset] = useState<TokenUsagePeriodPreset>("thisMonth")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const { dateFrom, dateTo } = useMemo(
    () => computeDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  )
  const periodLabel = useMemo(() => computePeriodLabel(preset, dateFrom, dateTo), [preset, dateFrom, dateTo])

  const queriesEnabled = !!selectedOrganizationId && !!organizationToken && canAccessTokenUsage

  const {
    data: summary,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    isError: summaryHasError,
  } = useTokenUsageSummary(selectedOrganizationId ?? "", {
    date_from: dateFrom,
    date_to: dateTo,
    enabled: queriesEnabled,
  })

  const activeLlms = useMemo(() => summary?.active_llms ?? [], [summary])

  const fetchUsers = useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getUsers(selectedOrganizationId ?? undefined, page, pageSize, search)
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

  const filterDefs = useMemo<HuemulFilterDef[]>(
    () => [
      {
        key: "userId",
        type: "async-combobox",
        toolbar: true,
        group: tFilters("groups.search"),
        label: t("filters.user"),
        placeholder: t("filters.userPlaceholder"),
        fetchOptions: fetchUsers,
        pageSize: 20,
        searchOnEnter: true,
      },
      {
        key: "llmId",
        type: "select",
        group: tFilters("groups.classification"),
        label: t("filters.llm"),
        allValue: "__all__",
        options: [
          { value: "__all__", label: t("filters.allLlms") },
          ...activeLlms.map((l) => ({ value: l.id, label: l.name })),
        ],
      },
    ],
    [t, tFilters, fetchUsers, activeLlms],
  )

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
  } = useHuemulFilters({ filters: filterDefs })

  const userId = (values.userId as string) || undefined
  const llmIdRaw = values.llmId as string | undefined
  const llmId = llmIdRaw && llmIdRaw !== "__all__" ? llmIdRaw : undefined

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tokenUsageQueryKeys.summaryBase() }),
        queryClient.invalidateQueries({ queryKey: tokenUsageQueryKeys.byUserBase() }),
        queryClient.invalidateQueries({ queryKey: tokenUsageQueryKeys.statsBase() }),
        queryClient.invalidateQueries({ queryKey: organizationDailyModelTelemetryQueryKeys.listBase() }),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoadingPermissions) {
    return <TokenUsagePageSkeleton />
  }

  if (!canAccessTokenUsage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-6">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-semibold">{tCommon("accessDenied")}</h1>
          <p className="text-muted-foreground">{tCommon("noPermission")}</p>
        </div>
      </div>
    )
  }

  return (
    <HuemulPageLayout
      header={
        <TokenUsagePageHeader
          onRefresh={handleRefresh}
          isLoading={isRefreshing || summaryFetching}
          hasError={summaryHasError}
          periodProps={{
            preset,
            onPresetChange: setPreset,
            customFrom,
            customTo,
            onCustomRangeChange: (from, to) => {
              setCustomFrom(from)
              setCustomTo(to)
            },
          }}
        />
      }
      headerClassName="p-6 md:p-8 pb-0 md:pb-0"
      columns={[
        {
          content: (
            <HuemulFilterPanel
              filters={filterDefs}
              values={values}
              onChange={setValue}
              onSelectedLabel={setSelectedLabel}
              onClose={() => setFiltersOpen(false)}
            />
          ),
          show: filtersOpen,
          defaultSize: 22,
          minSize: 16,
          maxSize: 35,
          collapsible: true,
        },
        {
          content: (
            <div className="flex h-full flex-col gap-4 overflow-hidden p-4 md:p-6">
              <TokenUsageSummaryCards summary={summary} loading={summaryLoading} periodLabel={periodLabel} />

              <div className="flex flex-wrap items-center gap-2">
                <HuemulFilterButton count={activeCount} open={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} />
                <HuemulFilterInline
                  filters={filterDefs}
                  values={values}
                  onChange={setValue}
                  onSelectedLabel={setSelectedLabel}
                />
              </div>
              <HuemulFilterChips chips={chips} onRemove={clearValue} onClearAll={clearAll} />

              <Tabs defaultValue="by-user" className="flex w-full min-h-0 flex-1 flex-col">
                <TabsList className="shrink-0">
                  <TabsTrigger value="by-user" className="hover:cursor-pointer">
                    {t("tabs.byUser")}
                  </TabsTrigger>
                  <TabsTrigger value="by-document-type" className="hover:cursor-pointer">
                    {t("tabs.byDocumentType")}
                  </TabsTrigger>
                  <TabsTrigger value="by-document" className="hover:cursor-pointer">
                    {t("tabs.byDocument")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="by-user" className="mt-4 flex min-h-0 flex-1 flex-col">
                  <TokenUsageByUserTab
                    organizationId={selectedOrganizationId ?? ""}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    periodLabel={periodLabel}
                    userId={userId}
                    llmId={llmId}
                    activeLlms={activeLlms}
                  />
                </TabsContent>
                <TabsContent value="by-document-type" className="mt-4 flex min-h-0 flex-1 flex-col">
                  <TokenUsagePlaceholderTab />
                </TabsContent>
                <TabsContent value="by-document" className="mt-4 flex min-h-0 flex-1 flex-col">
                  <TokenUsagePlaceholderTab />
                </TabsContent>
              </Tabs>
            </div>
          ),
        },
      ]}
    />
  )
}
