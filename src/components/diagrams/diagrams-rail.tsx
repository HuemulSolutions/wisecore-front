"use client"

import type { ComponentType, RefObject } from "react"
import { useTranslation } from "react-i18next"
import { Clock, FolderTree, Workflow } from "lucide-react"
import { cn } from "@/lib/utils"

export type DiagramsRailPanelKey = "tree" | "list" | "recents"

export interface DiagramsRailProps {
  active: DiagramsRailPanelKey | null
  onToggle: (key: DiagramsRailPanelKey) => void
  canList: boolean
  /** Ref al botón activo para devolverle el foco al cerrar su panel. */
  activeButtonRef?: RefObject<HTMLButtonElement | null>
}

interface RailItem {
  key: DiagramsRailPanelKey
  icon: ComponentType<{ className?: string }>
  visible: boolean
}

/**
 * Riel fijo de 52px: único cromo no flotante de /diagrams. Cada botón abre un
 * panel superpuesto de 300px sobre el canvas (no empuja el layout). El botón
 * activo se vuelve a pulsar para cerrar.
 */
export function DiagramsRail({ active, onToggle, canList, activeButtonRef }: DiagramsRailProps) {
  const { t } = useTranslation("diagrams")

  const items: RailItem[] = [
    { key: "tree", icon: FolderTree, visible: true },
    { key: "list", icon: Workflow, visible: canList },
    { key: "recents", icon: Clock, visible: canList },
  ]

  const renderItem = ({ key, icon: Icon }: RailItem) => {
    const isActive = active === key
    const label = t(`rail.${key}`)
    return (
      <button
        key={key}
        ref={isActive ? activeButtonRef : undefined}
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={isActive}
        onClick={() => onToggle(key)}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-[9px] border px-1 py-1.5 transition-colors hover:cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          isActive
            ? "border-transparent bg-[#eef2ff] font-semibold text-[#1d4ed8]"
            : "border-transparent bg-transparent text-slate-500 hover:bg-[#f4f6f9] hover:text-[#1d4ed8]",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="text-[10px] font-medium leading-none">{t(`rail.${key}Short`)}</span>
      </button>
    )
  }

  const visible = items.filter((i) => i.visible)

  return (
    <nav
      aria-label={t("rail.navLabel")}
      data-diagrams-rail
      className="flex w-18 shrink-0 flex-col items-center gap-1.5 border-r border-[#e9edf2] bg-white px-1.5 py-2.5"
    >
      {visible.map(renderItem)}
    </nav>
  )
}
