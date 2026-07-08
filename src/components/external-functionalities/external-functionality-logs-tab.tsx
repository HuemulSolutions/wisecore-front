import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle, XCircle, Clock, Loader2, Eye } from "lucide-react"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useExternalExecutionLogs } from "@/hooks/useExternalFunctionalities"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableColumn, HuemulTableAction } from "@/huemul/components/huemul-table"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulInfoGroup, HuemulInfoItem } from "@/huemul/components/huemul-info-display"
import { JsonViewer } from "@/huemul/components/json-viewer"
import { DEFAULT_PAGE_SIZE } from "@/huemul/constants"
import type { ExternalExecutionLog } from "@/types/external-systems"

interface ExternalFunctionalityLogsTabProps {
  organizationId: string
  systemId: string
  functionalityId: string
}

const PAGE_SIZE = DEFAULT_PAGE_SIZE

function StatusIcon({ status }: { status: ExternalExecutionLog["status"] }) {
  if (status === "completed") return <CheckCircle className="h-3.5 w-3.5 text-green-500" />
  if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-red-500" />
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
}

function statusLabel(status: ExternalExecutionLog["status"], t: (k: string) => string): string {
  const map: Record<string, string> = {
    completed: t("logs.statusCompleted"),
    failed: t("logs.statusFailed"),
    running: t("logs.statusRunning"),
    pending: t("logs.statusPending"),
  }
  return map[status] ?? status
}

function toJsonString(value: unknown): string {
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function LogDetailSheet({
  log,
  onOpenChange,
}: {
  log: ExternalExecutionLog | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const hasError = !!log && (log.status === "failed" || !!log.error_detail)

  return (
    <HuemulSheet
      open={!!log}
      onOpenChange={onOpenChange}
      title={t("logs.detail.title")}
      description={t("logs.detail.subtitle")}
      maxWidth="sm:max-w-2xl"
      showFooter={false}
    >
      {log && (
        <div className="flex flex-col gap-5 py-2">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <StatusIcon status={log.status} />
              <span className="font-medium">{statusLabel(log.status, t)}</span>
            </div>
            {log.http_status_code != null && (
              <span className="text-xs font-mono text-muted-foreground">
                {t("logs.detail.fields.httpStatus")}: {log.http_status_code}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(log.created_at).toLocaleString()}
            </span>
          </div>

          <HuemulInfoGroup label={t("logs.detail.sections.identifiers")} layout="grid-2">
            <HuemulInfoItem label={t("logs.detail.fields.documentId")} value={log.document_id} variant="mono" copyable />
            <HuemulInfoItem label={t("logs.detail.fields.executionId")} value={log.execution_id} variant="mono" copyable />
            <HuemulInfoItem label={t("logs.detail.fields.publishRunId")} value={log.publish_run_id} variant="mono" copyable />
            <HuemulInfoItem label={t("logs.detail.fields.lifecycleStepId")} value={log.lifecycle_step_id} variant="mono" copyable />
            <HuemulInfoItem label={t("logs.detail.fields.publishActionId")} value={log.lifecycle_external_publish_action_id} variant="mono" copyable />
            <HuemulInfoItem label={t("logs.detail.fields.jobId")} value={log.job_id} variant="mono" copyable />
            <HuemulInfoItem label={t("logs.detail.fields.executionOrder")} value={log.execution_order} />
            <HuemulInfoItem label={t("logs.detail.fields.createdBy")} value={log.created_by} variant="mono" copyable hideWhenEmpty />
            <HuemulInfoItem label={t("logs.detail.fields.updatedBy")} value={log.updated_by} variant="mono" copyable hideWhenEmpty />
            <HuemulInfoItem label={t("logs.detail.fields.createdAt")} value={new Date(log.created_at).toLocaleString()} />
            <HuemulInfoItem label={t("logs.detail.fields.updatedAt")} value={new Date(log.updated_at).toLocaleString()} />
          </HuemulInfoGroup>

          <HuemulInfoGroup label={t("logs.detail.sections.request")}>
            <HuemulInfoItem label={t("logs.detail.fields.resolvedUrl")} value={log.resolved_url} variant="mono" copyable />
            <HuemulInfoItem
              label={t("logs.detail.fields.resolvedParams")}
              value={<JsonViewer value={toJsonString(log.resolved_params)} maxHeight="240px" />}
            />
            <HuemulInfoItem
              label={t("logs.detail.fields.resolvedBody")}
              value={<JsonViewer value={log.resolved_body} maxHeight="240px" />}
            />
          </HuemulInfoGroup>

          <HuemulInfoGroup label={t("logs.detail.sections.response")}>
            {log.response_body ? (
              <HuemulInfoItem
                label={t("logs.detail.fields.responseBody")}
                value={<JsonViewer value={log.response_body} maxHeight="240px" />}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">{t("logs.detail.noResponseBody")}</p>
            )}
          </HuemulInfoGroup>

          {hasError && (
            <HuemulInfoGroup label={t("logs.detail.sections.error")}>
              {log.error_detail ? (
                <p className="text-sm text-destructive break-words">{log.error_detail}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t("logs.detail.noError")}</p>
              )}
            </HuemulInfoGroup>
          )}
        </div>
      )}
    </HuemulSheet>
  )
}

export function ExternalFunctionalityLogsTab({
  organizationId,
  systemId,
  functionalityId,
}: ExternalFunctionalityLogsTabProps) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const { isOrgAdmin, hasPermission } = useUserPermissions()
  const canList = isOrgAdmin || hasPermission("external_execution_log:l" as never)

  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<ExternalExecutionLog | null>(null)

  const { data, isLoading, isFetching } = useExternalExecutionLogs(
    systemId,
    functionalityId,
    organizationId,
    { page, page_size: PAGE_SIZE },
    canList,
  )

  const logs = data?.data ?? []

  if (!canList) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-16 text-center px-6">
        <p className="text-sm font-medium text-muted-foreground">{t("logs.empty")}</p>
        <p className="text-xs text-muted-foreground/60">{t("logs.emptyDescription")}</p>
      </div>
    )
  }

  const columns: HuemulTableColumn<ExternalExecutionLog>[] = [
    {
      key: "date",
      label: t("logs.date"),
      defaultWidth: 150,
      render: (log) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(log.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: t("logs.status"),
      defaultWidth: 110,
      render: (log) => (
        <div className="flex items-center gap-1.5">
          <StatusIcon status={log.status} />
          <span className="text-xs">{statusLabel(log.status, t)}</span>
        </div>
      ),
    },
    {
      key: "httpStatus",
      label: t("logs.httpStatus"),
      defaultWidth: 80,
      render: (log) => <span className="text-xs font-mono">{log.http_status_code ?? "—"}</span>,
    },
    {
      key: "order",
      label: t("logs.order"),
      defaultWidth: 70,
      render: (log) => <span className="text-xs font-mono">{log.execution_order}</span>,
    },
    {
      key: "url",
      label: t("logs.url"),
      defaultWidth: 320,
      minWidth: 160,
      render: (log) => (
        <span className="text-xs font-mono truncate block" title={log.resolved_url}>
          {log.resolved_url}
        </span>
      ),
    },
    {
      key: "error",
      label: t("logs.error"),
      defaultWidth: 260,
      minWidth: 120,
      render: (log) =>
        log.error_detail ? (
          <span className="text-xs text-destructive truncate block" title={log.error_detail}>
            {log.error_detail}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ]

  const actions: HuemulTableAction<ExternalExecutionLog>[] = [
    {
      key: "viewDetails",
      label: t("logs.viewDetails"),
      icon: Eye,
      onClick: (log) => setSelectedLog(log),
    },
  ]

  return (
    <div className="flex flex-col gap-3 p-4">
      <HuemulTable
        data={logs}
        columns={columns}
        actions={actions}
        getRowKey={(log) => log.id}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={{
          title: t("logs.empty"),
          description: t("logs.emptyDescription"),
        }}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          hasNext: data?.has_next,
          hasPrevious: page > 1,
          onPageChange: setPage,
        }}
        resizable
        columnsStorageKey="external-functionality-logs-columns"
        maxHeight="max-h-[60vh]"
      />

      <LogDetailSheet log={selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)} />
    </div>
  )
}
