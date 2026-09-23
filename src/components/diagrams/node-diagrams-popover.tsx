"use client"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AlertCircle, ExternalLink, Plus, RefreshCw, Workflow } from "lucide-react"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"
import { useDiagrams } from "@/hooks/useDiagrams"
import { useOrgPath } from "@/hooks/useOrgRouter"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { cn } from "@/lib/utils"
import type { Diagram } from "@/types/diagrams"

export interface NodeDiagramsPopoverProps {
  organizationId: string
  assetId: string
  assetName: string
  /** Versión del nodo: sus diagramas van primero y siembra "Nuevo diagrama". */
  executionId?: string
  /** Diagrama abierto en el canvas de fondo — se marca "actual" y no navega. */
  currentDiagramId?: string
  /** Punto de pantalla (clientX/clientY) donde se ancla el popup. */
  anchor: { x: number; y: number }
  onClose: () => void
}

const includesExecution = (diagram: Diagram, executionId?: string) =>
  !!executionId &&
  (diagram.execution_id === executionId ||
    diagram.details.some((d) => d.node_type === "execution" && d.execution_id === executionId))

/**
 * Popup flotante con todos los diagramas donde aparece un activo. Se abre con doble
 * clic sobre un nodo o con el badge "otros diagramas". Clic en una fila abre ese
 * diagrama siempre en una pestaña nueva (no arriesga el canvas actual).
 */
export function NodeDiagramsPopover({
  organizationId,
  assetId,
  assetName,
  executionId,
  currentDiagramId,
  anchor,
  onClose,
}: NodeDiagramsPopoverProps) {
  const { t, i18n } = useTranslation(["diagrams", "common"])
  const buildPath = useOrgPath()
  const { isOrgAdmin, hasPermission } = useUserPermissions()

  const { data, isLoading, isError, isFetching, refetch } = useDiagrams(organizationId, {
    documentId: assetId,
    pageSize: 100,
  })

  const diagrams = useMemo(() => {
    const list = [...(data?.data ?? [])]
    return list.sort((a, b) => {
      const byVersion = Number(includesExecution(b, executionId)) - Number(includesExecution(a, executionId))
      if (byVersion !== 0) return byVersion
      return b.updated_at.localeCompare(a.updated_at)
    })
  }, [data, executionId])

  const canCreate = isOrgAdmin || hasPermission("diagram:c")

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })

  const openInNewTab = (query: string) => {
    window.open(buildPath(`/diagrams?${query}`), "_blank", "noopener,noreferrer")
    onClose()
  }

  const handleCreate = () => {
    const params = new URLSearchParams({ diagram: "new", seedAsset: assetId })
    if (executionId) params.set("seedExecution", executionId)
    openInNewTab(params.toString())
  }

  return (
    // `modal` es necesario sobre React Flow: un Popover no-modal difiere el cierre al `click`
    // y lo cancela si el `mousedown` no llega a `document`, y d3-zoom/d3-drag (pane y nodos)
    // le hacen `stopImmediatePropagation()`. Modal bloquea el `pointer-events` del body, así
    // que el clic fuera lo consume la capa de Radix (igual que los menús modales del canvas).
    <Popover open modal onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor asChild>
        <div
          aria-hidden
          className="pointer-events-none fixed size-0"
          style={{ left: anchor.x, top: anchor.y }}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="right"
        collisionPadding={16}
        className="w-80 p-0"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Workflow className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="flex min-w-0 flex-1 flex-col">
            <HuemulTruncatedText text={assetName} className="text-[13px] font-semibold" />
            <span className="text-[11px] text-muted-foreground">
              {t("diagrams:nodeDiagrams.count", { count: diagrams.length })}
            </span>
          </div>
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            icon={RefreshCw}
            tooltip={t("common:refresh")}
            loading={isFetching}
            onClick={() => refetch()}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-1.5 p-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 p-5 text-center">
            <AlertCircle className="h-5 w-5 text-destructive/70" />
            <p className="text-xs text-muted-foreground">{t("diagrams:nodeDiagrams.loadingError")}</p>
            <HuemulButton size="sm" variant="outline" onClick={() => refetch()}>
              {t("common:retry")}
            </HuemulButton>
          </div>
        ) : diagrams.length === 0 ? (
          <HuemulPanelEmptyState
            className="m-3"
            icon={Workflow}
            title={t("diagrams:nodeDiagrams.emptyTitle")}
            description={t("diagrams:nodeDiagrams.emptyDescription")}
            action={canCreate ? { label: t("diagrams:nodeDiagrams.createAction"), onClick: handleCreate } : undefined}
          />
        ) : (
          <ul className={cn("max-h-72 overflow-y-auto p-1.5", isFetching && "opacity-60")}>
            {diagrams.map((diagram) => {
              const isCurrent = diagram.id === currentDiagramId
              return (
                <li key={diagram.id}>
                  <button
                    type="button"
                    disabled={isCurrent}
                    aria-current={isCurrent ? "true" : undefined}
                    title={isCurrent ? undefined : t("diagrams:nodeDiagrams.openNewTab")}
                    onClick={() => openInNewTab(new URLSearchParams({ diagram: diagram.id }).toString())}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden",
                      isCurrent
                        ? "bg-[#eef2ff] disabled:cursor-default"
                        : "hover:cursor-pointer hover:bg-[#f4f6f9]",
                    )}
                  >
                    <Workflow className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <HuemulTruncatedText
                        text={diagram.name}
                        className="text-[13px] font-medium text-[#0f172a]"
                      />
                      <span className="truncate text-[11px] text-muted-foreground">
                        {t("diagrams:nodeDiagrams.meta", {
                          count: diagram.details.length,
                          date: formatDate(diagram.updated_at),
                        })}
                      </span>
                    </span>
                    {isCurrent ? (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {t("diagrams:nodeDiagrams.currentBadge")}
                      </span>
                    ) : (
                      // Pista visual: abre fuera de esta pantalla.
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {canCreate && diagrams.length > 0 && (
          <div className="border-t p-1.5">
            <HuemulButton
              variant="ghost"
              size="sm"
              icon={Plus}
              className="w-full justify-start"
              onClick={handleCreate}
            >
              {t("diagrams:nodeDiagrams.createAction")}
            </HuemulButton>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
