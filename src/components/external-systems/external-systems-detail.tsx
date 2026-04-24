import { useState } from "react"
import { Network, Plus, Edit2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ExternalSystem } from "@/types/external-systems"
import { ExternalSystemParamsTab } from "./external-system-params-tab"
import { ExternalSystemSecretsTab } from "./external-system-secrets-tab"

type Tab = "docs" | "params" | "secrets"

interface ExternalSystemDetailProps {
  system: ExternalSystem | null
  organizationId?: string
  onAddFunctionality?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ExternalSystemDetail({ system, organizationId = "", onAddFunctionality, onEdit, onDelete }: ExternalSystemDetailProps) {
  const { t } = useTranslation(["external-systems", "external-functionalities", "common"])
  const [activeTab, setActiveTab] = useState<Tab>("docs")

  const tabs: { id: Tab; label: string }[] = [
    { id: "docs", label: t("external-functionalities:detail.tabs.docs") },
    { id: "params", label: t("external-functionalities:detail.tabs.params") },
    { id: "secrets", label: t("external-functionalities:detail.tabs.secrets") },
  ]

  if (!system) {
    return (
      <div className="flex h-full items-center justify-center text-center text-muted-foreground p-6">
        <div className="flex flex-col items-center gap-3">
          <Network className="size-10 opacity-25" />
          <p className="text-sm">{t("detail.placeholder")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Network className="size-5 text-muted-foreground shrink-0" />
            <h2 className="text-base font-semibold truncate">{system.name}</h2>
            <Badge variant={system.status === "active" ? "default" : "secondary"} className="text-xs shrink-0">
              {system.status === "active" ? t("common:active") : t("common:inactive")}
            </Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onAddFunctionality && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 hover:cursor-pointer"
                onClick={onAddFunctionality}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("external-functionalities:addFunctionality")}
              </Button>
            )}
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

      {/* Base URL bar */}
      <div className="px-4 pt-3 pb-0 shrink-0">
        <div className="flex items-center gap-0 rounded-md border bg-muted overflow-hidden font-mono">
          <span className="px-3 py-2 text-xs font-bold shrink-0 border-r bg-muted/60 text-muted-foreground">
            BASE URL
          </span>
          <span className="px-3 py-2 text-xs text-foreground break-all select-all">
            {system.base_url}
          </span>
        </div>
      </div>

      {/* Tab bar */}
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
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "docs" && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label={t("detail.createdAt")}
                value={new Date(system.created_at).toLocaleString()}
              />
              <DetailField
                label={t("detail.updatedAt")}
                value={new Date(system.updated_at).toLocaleString()}
              />
            </div>
          </div>
        )}

        {activeTab === "params" && (
          <ExternalSystemParamsTab organizationId={organizationId} systemId={system.id} />
        )}

        {activeTab === "secrets" && (
          <ExternalSystemSecretsTab organizationId={organizationId} systemId={system.id} />
        )}
      </div>
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
