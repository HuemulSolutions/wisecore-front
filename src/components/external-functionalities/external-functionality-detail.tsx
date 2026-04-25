import { useState } from "react"
import { Zap, Edit2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { JsonViewer } from "@/huemul/components/json-viewer"
import { cn } from "@/lib/utils"
import type { ExternalFunctionality } from "@/types/external-functionalities"
import { ExternalFunctionalityParamsTab } from "./external-functionality-params-tab"

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  POST: "bg-green-500/10 text-green-600 dark:text-green-400",
  PUT: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  PATCH: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
}

type Tab = "docs" | "params" | "body" | "logs"

interface ExternalFunctionalityDetailProps {
  functionality: ExternalFunctionality
  organizationId?: string
  systemId?: string
  onEdit?: () => void
  onDelete?: () => void
}

export function ExternalFunctionalityDetail({
  functionality,
  organizationId = "",
  systemId = "",
  onEdit,
  onDelete,
}: ExternalFunctionalityDetailProps) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const [activeTab, setActiveTab] = useState<Tab>("docs")

  const methodVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    GET: "default",
    POST: "secondary",
    PUT: "outline",
    PATCH: "outline",
    DELETE: "destructive",
  }

  const tabs: { id: Tab; label: string; dot?: boolean }[] = [
    { id: "docs", label: t("detail.tabs.docs", "Docs") },
    { id: "params", label: t("detail.tabs.params", "Params") },
    { id: "body", label: t("detail.tabs.body", "Body"), dot: !!functionality.body },
    { id: "logs", label: t("detail.tabs.logs", "Logs") },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Zap className="size-5 text-muted-foreground shrink-0" />
            <h2 className="text-base font-semibold truncate">{functionality.name}</h2>
            <Badge variant={methodVariant[functionality.http_method] ?? "secondary"} className="text-xs shrink-0">
              {functionality.http_method}
            </Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:cursor-pointer"
                onClick={onEdit}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:cursor-pointer"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Request bar */}
      <div className="px-4 pt-3 pb-0 shrink-0">
        <div className="flex items-center gap-0 rounded-md border bg-muted overflow-hidden font-mono">
          <span className={`px-3 py-2 text-xs font-bold shrink-0 border-r ${methodColors[functionality.http_method] ?? "bg-muted text-foreground"}`}>
            {functionality.http_method}
          </span>
          <span className="px-3 py-2 text-xs text-foreground break-all select-all">
            {functionality.partial_url}
          </span>
        </div>
      </div>

      {/* Tab bar — Postman style (underline) */}
      <div className="flex items-end gap-0 px-4 mt-2 border-b shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors hover:cursor-pointer",
              activeTab === tab.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.dot && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Vertical split via HuemulPageLayout: tab content (top) + response (bottom) */}
      <HuemulPageLayout
        direction="vertical"
        className="flex-1 min-h-0"
        columns={[
          {
            defaultSize: 55,
            minSize: 15,
            content: (
              <>
                {activeTab === "docs" && (
                  <div className="p-6 space-y-4">
                    {functionality.description ? (
                      <DetailField label={t("detail.description")} value={functionality.description} />
                    ) : (
                      <p className="text-xs text-muted-foreground">{t("detail.noDescription", "No description")}</p>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <DetailField
                        label={t("detail.objective")}
                        value={t(`objective.${functionality.objective}`)}
                      />
                      <DetailField
                        label={t("detail.functionalityClass")}
                        value={t(`class.${functionality.functionality_class}`)}
                      />
                      <DetailField
                        label={t("detail.executionType")}
                        value={t(`executionType.${functionality.execution_type}`)}
                      />
                    </div>

                    {functionality.storage_url && (
                      <>
                        <Separator />
                        <DetailField label={t("detail.storageUrl")} value={functionality.storage_url} />
                      </>
                    )}

                    {functionality.usage_example && (
                      <>
                        <Separator />
                        <DetailField label={t("detail.usageExample")} value={functionality.usage_example} />
                      </>
                    )}

                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <DetailField
                        label={t("detail.createdAt")}
                        value={new Date(functionality.created_at).toLocaleString()}
                      />
                      <DetailField
                        label={t("detail.updatedAt")}
                        value={new Date(functionality.updated_at).toLocaleString()}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "params" && (
                  <ExternalFunctionalityParamsTab
                    organizationId={organizationId}
                    systemId={systemId}
                    functionalityId={functionality.id}
                  />
                )}

                {activeTab === "body" && (
                  <div className="p-4">
                    {functionality.body ? (
                      <JsonViewer
                        value={functionality.body}
                        maxHeight="100%"
                        className="min-h-[120px]"
                      />
                    ) : (
                      <EmptyTabState label={t("detail.tabs.body", "Body")} />
                    )}
                  </div>
                )}

                {activeTab === "logs" && (
                  <EmptyTabState label={t("detail.tabs.logs", "Logs")} />
                )}
              </>
            ),
          },
          {
            defaultSize: 45,
            minSize: 15,
            className: "flex flex-col overflow-hidden",
            content: (
              <>
                <div className="flex items-end gap-0 px-4 border-b bg-muted/30 shrink-0">
                  <span className="px-3 py-2 text-xs font-medium text-muted-foreground border-b-2 border-transparent">
                    {t("detail.response.label", "Response")}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("detail.response.empty", "No response yet")}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {t("detail.response.hint", "Responses will appear here once the endpoint is called")}
                  </span>
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground break-all">{value}</span>
    </div>
  )
}

function EmptyTabState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center px-6">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-xs text-muted-foreground/60">No data available</span>
    </div>
  )
}
