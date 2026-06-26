import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useExternalExecutionLogs } from "@/hooks/useExternalFunctionalities"
import type { ExternalExecutionLog } from "@/types/external-systems"

interface ExternalFunctionalityLogsTabProps {
  organizationId: string
  systemId: string
  functionalityId: string
}

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

export function ExternalFunctionalityLogsTab({
  organizationId,
  systemId,
  functionalityId,
}: ExternalFunctionalityLogsTabProps) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const { isOrgAdmin, hasPermission } = useUserPermissions()
  const canList = isOrgAdmin || hasPermission("external_execution_log:l" as never)

  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading } = useExternalExecutionLogs(
    systemId,
    functionalityId,
    organizationId,
    { page, page_size: pageSize },
    canList,
  )

  const logs = data?.data ?? []
  const hasNext = data?.has_next ?? false

  if (!canList) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-16 text-center px-6">
        <p className="text-sm font-medium text-muted-foreground">{t("logs.empty")}</p>
        <p className="text-xs text-muted-foreground/60">{t("logs.emptyDescription")}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-16 text-center px-6">
        <p className="text-sm font-medium text-muted-foreground">{t("logs.empty")}</p>
        <p className="text-xs text-muted-foreground/60">{t("logs.emptyDescription")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left w-36">{t("logs.date")}</th>
                <th className="px-3 py-2 text-left w-24">{t("logs.status")}</th>
                <th className="px-3 py-2 text-left w-16">{t("logs.httpStatus")}</th>
                <th className="px-3 py-2 text-left">{t("logs.url")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={log.status} />
                      <span className="text-xs">{statusLabel(log.status, t)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-mono">
                    {log.http_status_code ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono truncate max-w-[280px]" title={log.resolved_url}>
                    {log.resolved_url}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasNext && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
            {t("logs.loadMore")}
          </Button>
        </div>
      )}
    </div>
  )
}
