import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronRight, ExternalLink, MessageSquareText, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulNotice } from "@/huemul/components/huemul-notice"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { HuemulTable } from "@/huemul/components/huemul-table"
import { HuemulField } from "@/huemul/components/huemul-field"
import { useOrganization } from "@/contexts/organization-context"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useSearchLogFeedback, useSearchLogs } from "@/hooks/useSearchPassages"
import { formatAbsoluteDate, formatRelativeTime } from "@/lib/format-relative-time"
import type { HuemulTableColumn } from "@/types/huemul"
import type { SearchLogItem } from "@/types/search"

const PAGE_SIZE = 50

/**
 * Búsquedas registradas por /search/passages y el chatbot, con el feedback que dejaron los
 * usuarios (PR backend #356). Es la fuente del golden set con preguntas reales
 * (testplanBusqueda.md §6). El backend exige `is_org_admin`: un root admin sin rol de admin en
 * la organización ve el aviso en vez de una ronda de 403.
 */
export default function SearchLogsPage() {
  const { t } = useTranslation("search")
  const { selectedOrganizationId } = useOrganization()
  const { isOrgAdmin } = useUserPermissions()
  const navigate = useOrgNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [onlyWithFeedback, setOnlyWithFeedback] = useState(true)
  const selectedId = searchParams.get("log")

  const logsQuery = useSearchLogs(selectedOrganizationId ?? "", {
    page,
    pageSize: PAGE_SIZE,
    onlyWithFeedback,
    enabled: isOrgAdmin,
  })
  const logs = useMemo(() => logsQuery.data?.data ?? [], [logsQuery.data])
  const selected = logs.find((log) => log.id === selectedId) ?? null

  const selectLog = (log: SearchLogItem | null) => {
    const next = new URLSearchParams(searchParams)
    if (log) next.set("log", log.id)
    else next.delete("log")
    setSearchParams(next, { replace: true })
  }

  const columns: HuemulTableColumn<SearchLogItem>[] = [
    {
      key: "query",
      label: t("logs.columns.query"),
      render: (log) => (
        <span className="block truncate text-[13px] font-medium text-foreground" title={log.query}>
          {log.query}
        </span>
      ),
    },
    {
      key: "source",
      label: t("logs.columns.source"),
      width: "110px",
      render: (log) => (
        <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px]">
          {t(`logs.sources.${log.source}`, { defaultValue: log.source })}
        </Badge>
      ),
    },
    {
      key: "feedback",
      label: t("logs.columns.feedback"),
      width: "120px",
      render: (log) =>
        log.feedback_count ? (
          <span className="inline-flex items-center gap-2 text-xs tabular-nums">
            <span className="inline-flex items-center gap-0.5 text-[#15803d]">
              <ThumbsUp className="size-3" />
              {log.useful_count}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[#b42318]">
              <ThumbsDown className="size-3" />
              {log.feedback_count - log.useful_count}
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "results",
      label: t("logs.columns.results"),
      width: "90px",
      align: "right",
      render: (log) => (
        <span className="inline-flex items-center gap-1 text-xs tabular-nums">
          {log.rerank_applied && (
            <span title={t("logs.rerankApplied")}>
              <Sparkles className="size-3 text-[#6d28d9]" />
            </span>
          )}
          {log.result_count}
        </span>
      ),
    },
    {
      key: "created_at",
      label: t("logs.columns.date"),
      width: "120px",
      hideOnMobile: true,
      render: (log) => (
        <span className="text-xs text-muted-foreground" title={formatAbsoluteDate(log.created_at)}>
          {formatRelativeTime(log.created_at)}
        </span>
      ),
    },
    {
      key: "chevron",
      label: "",
      align: "right",
      width: "40px",
      render: () => <ChevronRight className="ml-auto size-[15px] text-[#b6c0cd]" />,
    },
  ]

  const header = (
    <PageHeader
      icon={MessageSquareText}
      title={t("logs.title")}
      subtitle={t("logs.subtitle")}
      showRefresh={isOrgAdmin}
      onRefresh={() => logsQuery.refetch()}
      isLoading={logsQuery.isFetching}
    >
      {isOrgAdmin && (
        <HuemulField
          type="switch"
          label={t("logs.onlyWithFeedback")}
          value={onlyWithFeedback}
          onChange={(v) => {
            setOnlyWithFeedback(Boolean(v))
            setPage(1)
          }}
          className="w-auto"
        />
      )}
    </PageHeader>
  )

  if (!isOrgAdmin) {
    return (
      <HuemulPageLayout
        header={header}
        headerClassName="p-4 md:p-6"
        columns={[{ content: <div className="p-6"><HuemulNotice tone="amber">{t("logs.onlyOrgAdmins")}</HuemulNotice></div> }]}
      />
    )
  }

  return (
    <HuemulPageLayout
      header={header}
      headerClassName="p-4 md:p-6 pb-0 md:pb-0"
      columns={[
        {
          content: (
            <HuemulTable
              variant="detailed"
              data={logs}
              columns={columns}
              getRowKey={(log) => log.id}
              isLoading={logsQuery.isLoading}
              isFetching={logsQuery.isFetching}
              error={logsQuery.error as Error | null}
              onRetry={() => logsQuery.refetch()}
              onRowClick={(log) => selectLog(log)}
              activeKey={selectedId}
              emptyState={{
                icon: MessageSquareText,
                title: onlyWithFeedback ? t("logs.emptyWithFeedback") : t("logs.empty"),
                description: t("logs.emptyDescription"),
              }}
              pagination={{
                page,
                pageSize: PAGE_SIZE,
                hasNext: logsQuery.data?.has_next,
                hasPrevious: page > 1,
                onPageChange: setPage,
              }}
            />
          ),
          className: "flex flex-col",
          minSize: 45,
        },
        {
          content: selected ? (
            <SearchLogDetail
              log={selected}
              organizationId={selectedOrganizationId ?? ""}
              onClose={() => selectLog(null)}
              onOpenSearch={() =>
                navigate(`/search?${new URLSearchParams({ q: selected.query, mode: selected.rerank_applied ? "deep" : "advanced" }).toString()}`)
              }
            />
          ) : null,
          show: !!selected,
          defaultSize: 34,
          minSize: 24,
          maxSize: 45,
          className: "border-l border-border",
        },
      ]}
    />
  )
}

function SearchLogDetail({
  log,
  organizationId,
  onClose,
  onOpenSearch,
}: {
  log: SearchLogItem
  organizationId: string
  onClose: () => void
  onOpenSearch: () => void
}) {
  const { t } = useTranslation("search")
  const feedbackQuery = useSearchLogFeedback(organizationId, log.id)
  const feedback = feedbackQuery.data ?? []

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("logs.detail.query")}</p>
          <p className="text-sm font-semibold text-foreground">{log.query}</p>
          <p className="text-xs text-muted-foreground">
            {formatAbsoluteDate(log.created_at)} · {t(`logs.sources.${log.source}`, { defaultValue: log.source })} ·{" "}
            {t("logs.detail.results", { count: log.result_count })}
            {log.latency_ms != null && ` · ${log.latency_ms} ms`}
          </p>
        </div>
        <HuemulButton variant="ghost" size="icon" icon={X} className="h-7 w-7" onClick={onClose} tooltip={t("logs.detail.close")} />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <HuemulButton
          variant="outline"
          size="sm"
          icon={ExternalLink}
          label={t("logs.detail.openSearch")}
          onClick={onOpenSearch}
          className="self-start"
        />

        <section className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">{t("logs.detail.feedback")}</p>
          {feedbackQuery.isLoading && <p className="text-xs text-muted-foreground">{t("logs.detail.loading")}</p>}
          {!feedbackQuery.isLoading && feedback.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("logs.detail.noFeedback")}</p>
          )}
          {feedback.map((item) => (
            <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                {item.useful ? (
                  <Badge className="h-5 border-[#cdefd7] bg-[#eefbf1] px-1.5 text-[10px] text-[#15803d]">{t("feedback.useful")}</Badge>
                ) : (
                  <Badge className="h-5 border-[#fecdca] bg-[#fef3f2] px-1.5 text-[10px] text-[#b42318]">{t("feedback.notUseful")}</Badge>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {item.passage_id
                    ? t("logs.detail.aboutPassage", {
                        position: Math.max(1, log.passage_ids.indexOf(item.passage_id) + 1),
                      })
                    : t("logs.detail.aboutSearch")}
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground">{formatRelativeTime(item.created_at)}</span>
              </div>
              {item.comment && <p className="text-xs text-foreground">{item.comment}</p>}
            </div>
          ))}
        </section>

        {log.filters && Object.keys(log.filters).length > 0 && (
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">{t("logs.detail.filters")}</p>
            <pre className="max-h-60 overflow-auto rounded-md bg-muted/50 p-2 text-[11px] leading-snug">
              {JSON.stringify(
                Object.fromEntries(Object.entries(log.filters).filter(([, v]) => v !== null && v !== undefined)),
                null,
                2,
              )}
            </pre>
          </section>
        )}
      </div>
    </div>
  )
}
