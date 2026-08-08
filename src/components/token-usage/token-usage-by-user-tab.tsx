import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableColumn } from "@/huemul/components/huemul-table"
import { HuemulAreaChart } from "@/huemul/components/huemul-area-chart"
import { useTokenUsageByUser } from "@/hooks/useTokenUsage"
import { useTokenUsageDailySeries } from "@/hooks/useTokenUsageDailySeries"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { formatTokens, formatUsd } from "@/lib/format-tokens"
import { TokenUsageByUserLlmBreakdown } from "./token-usage-by-user-llm-breakdown"
import type { TokenUsageActiveLLM, TokenUsageByUser, TokenUsageByUserSortBy, TokenUsageSortOrder } from "@/types/token-usage"

export interface TokenUsageByUserTabProps {
  organizationId: string
  dateFrom: string
  dateTo: string
  periodLabel: string
  userId?: string
  llmId?: string
  activeLlms: TokenUsageActiveLLM[]
}

function formatChartDay(dateIso: string): string {
  const day = Number(dateIso.slice(8, 10))
  return Number.isNaN(day) ? dateIso : String(day)
}

export function TokenUsageByUserTab({
  organizationId,
  dateFrom,
  dateTo,
  periodLabel,
  userId,
  llmId,
  activeLlms,
}: TokenUsageByUserTabProps) {
  const { t } = useTranslation("token-usage")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sort, setSort] = useState<string | null>("tokens_desc")
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const [sortBy, sortOrder] = useMemo((): [TokenUsageByUserSortBy | undefined, TokenUsageSortOrder | undefined] => {
    if (!sort) return [undefined, undefined]
    const [key, order] = sort.split("_")
    return [key as TokenUsageByUserSortBy, order as TokenUsageSortOrder]
  }, [sort])

  const { data, isLoading, isFetching, error, refetch } = useTokenUsageByUser(organizationId, {
    page,
    page_size: pageSize,
    user_id: userId,
    llm_id: llmId,
    date_from: dateFrom,
    date_to: dateTo,
    sort_by: sortBy,
    sort_order: sortOrder,
  })

  const { isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!data,
  })

  const rows = data?.data ?? []
  const activeLlmsByInternalName = useMemo(
    () => new Map(activeLlms.map((l) => [l.internal_name, l])),
    [activeLlms],
  )

  const columns = useMemo<HuemulTableColumn<TokenUsageByUser>[]>(
    () => [
      {
        key: "user",
        label: t("columns.user"),
        render: (u) => {
          const fullName = [u.name, u.last_name].filter(Boolean).join(" ")
          const displayName = fullName || u.email || t("columns.deletedUser")
          const initials = ((u.name?.charAt(0) ?? "") + (u.last_name?.charAt(0) ?? "")).toUpperCase()
          return (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-blue-100 text-[11px] font-semibold text-blue-700">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{displayName}</span>
            </div>
          )
        },
      },
      {
        key: "tokens",
        label: t("columns.tokens"),
        align: "right",
        sortKey: "tokens",
        render: (u) => formatTokens(u.total_tokens),
      },
      {
        key: "cost",
        label: t("columns.cost"),
        align: "right",
        sortKey: "cost",
        render: (u) => (
          <div className="flex flex-col items-end">
            <span>{formatUsd(u.estimated_cost_usd)}</span>
            {u.llms_used.length > 1 && (
              <span className="text-[11px] text-muted-foreground">
                {t("columns.consolidated", { count: u.llms_used.length })}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "llms",
        label: t("columns.llms"),
        render: (u) => (
          <div className="flex flex-wrap gap-1">
            {u.llms_used.map((internalName) => (
              <Badge key={internalName} variant="secondary" className="text-[11px] font-normal">
                {activeLlmsByInternalName.get(internalName)?.name ?? internalName}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: "percentage",
        label: t("columns.percentage"),
        align: "right",
        sortKey: "percentage",
        render: (u) => (
          <div className="flex items-center justify-end gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, u.percentage_of_total))}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums">{u.percentage_of_total.toFixed(0)}%</span>
          </div>
        ),
      },
    ],
    [t, activeLlmsByInternalName],
  )

  const { points, truncated, isLoading: seriesLoading } = useTokenUsageDailySeries({
    organizationId,
    dateFrom,
    dateTo,
    llmId,
  })
  const chartData = useMemo(
    () => points.map((p) => ({ label: formatChartDay(p.date), value: p.tokens })),
    [points],
  )

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="min-h-0 flex-1 overflow-hidden">
        <HuemulTable
          data={rows}
          columns={columns}
          getRowKey={(u) => u.user_id}
          isLoading={isTableLoading}
          isFetching={isTableFetching}
          error={error}
          onRetry={() => refetch()}
          sort={sort}
          onSortChange={(next) => {
            setSort(next)
            setPage(1)
          }}
          isExpandable={(u) => u.llms_used.length > 1}
          renderExpanded={(u) => (
            <TokenUsageByUserLlmBreakdown
              user={u}
              organizationId={organizationId}
              dateFrom={dateFrom}
              dateTo={dateTo}
              activeLlms={activeLlms}
            />
          )}
          expandedKeys={expandedKeys}
          onExpandedChange={setExpandedKeys}
          emptyState={{
            icon: Users,
            title: t("emptyState.title"),
            description: t("emptyState.description"),
          }}
          pagination={{
            page: data?.page ?? page,
            pageSize: data?.page_size ?? pageSize,
            hasNext: data?.has_next,
            hasPrevious: (data?.page ?? page) > 1,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size)
              setPage(1)
            },
            pageSizeOptions: [20, 50, 100],
          }}
        />
      </div>
      <div className="shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {t("chart.title")} — {periodLabel}
          </p>
        </div>
        {truncated && <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">{t("chart.truncated")}</p>}
        <HuemulAreaChart
          data={chartData}
          color="violet"
          valueFormatter={(v) => formatTokens(v)}
          loading={seriesLoading}
        />
      </div>
    </div>
  )
}
