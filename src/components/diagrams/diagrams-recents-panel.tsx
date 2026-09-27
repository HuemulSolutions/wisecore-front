"use client"

import { useTranslation } from "react-i18next"
import { Clock } from "lucide-react"
import { HuemulPanelEmptyState } from "@/huemul/components/huemul-panel-empty-state"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"
import { cn } from "@/lib/utils"
import type { RecentDiagram } from "@/hooks/useRecentDiagrams"
import { DiagramsRailPanel } from "./diagrams-rail-panel"

export interface DiagramsRecentsPanelProps {
  recents: RecentDiagram[]
  activeDiagramId?: string | null
  onOpen: (diagram: RecentDiagram) => void
  /** Estado vacío: lleva al panel de listado. */
  onViewAll: () => void
  onClose: () => void
  onCloseFocusRef?: React.RefObject<HTMLButtonElement | null>
}

/**
 * Últimos diagramas abiertos en este navegador (localStorage por organización).
 * Sin botón de refresh: no consume datos del backend.
 */
export function DiagramsRecentsPanel({
  recents,
  activeDiagramId,
  onOpen,
  onViewAll,
  onClose,
  onCloseFocusRef,
}: DiagramsRecentsPanelProps) {
  const { t } = useTranslation("diagrams")

  return (
    <DiagramsRailPanel
      title={t("actions.recentDiagrams")}
      onClose={onClose}
      onCloseFocusRef={onCloseFocusRef}
    >
      {recents.length === 0 ? (
        <HuemulPanelEmptyState
          className="m-3"
          icon={Clock}
          title={t("recentsPanel.emptyTitle")}
          description={t("recentsPanel.emptyDescription")}
          action={{ label: t("recentsPanel.viewList"), onClick: onViewAll }}
        />
      ) : (
        <ul className="overflow-y-auto p-1.5">
          {recents.map((diagram) => (
            <li key={diagram.id}>
              <button
                type="button"
                onClick={() => onOpen(diagram)}
                aria-current={diagram.id === activeDiagramId ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:cursor-pointer hover:bg-[#f4f6f9]",
                  diagram.id === activeDiagramId && "bg-[#eef2ff]",
                )}
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <HuemulTruncatedText
                  text={diagram.name}
                  className="text-[13px] font-medium text-[#0f172a]"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </DiagramsRailPanel>
  )
}
