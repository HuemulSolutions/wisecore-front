"use client"

import type { ComponentType, RefObject } from "react"
import { useTranslation } from "react-i18next"
import { Clock, FolderTree, Search, Workflow } from "lucide-react"
import { cn } from "@/lib/utils"

export type DiagramsRailPanelKey = "tree" | "list" | "recents" | "search"

export interface DiagramsRailProps {
  active: DiagramsRailPanelKey | null
  onToggle: (key: DiagramsRailPanelKey) => void
  canList: boolean
  /** "Buscar en el diagrama" solo tiene sentido con un diagrama (o canvas libre) abierto. */
  canSearch: boolean
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
export function DiagramsRail({ active, onToggle, canList, canSearch, activeButtonRef }: DiagramsRailProps) {
  const { t } = useTranslation("diagrams")

  const items: RailItem[] = [
    { key: "tree", icon: FolderTree, visible: true },
    { key: "list", icon: Workflow, visible: canList },
    { key: "recents", icon: Clock, visible: canList },
    { key: "search", icon: Search, visible: canSearch },
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
          "flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border transition-colors hover:cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          isActive
            ? "border-[#dbe1e9] bg-white text-slate-600"
            : "border-transparent bg-transparent text-slate-500 hover:bg-[#f4f6f9] hover:text-[#1d4ed8]",
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    )
  }

  const visible = items.filter((i) => i.visible)
  const top = visible.filter((i) => i.key !== "search")
  const search = visible.find((i) => i.key === "search")

  return (
    <nav
      aria-label={t("rail.navLabel")}
      data-diagrams-rail
      className="flex w-13 shrink-0 flex-col items-center gap-1.5 border-r border-[#e9edf2] bg-white py-2.5"
    >
      {top.map(renderItem)}
      {search && (
        <>
          <div className="my-1 h-px w-[22px] bg-[#e9edf2]" />
          {renderItem(search)}
        </>
      )}
    </nav>
  )
}
