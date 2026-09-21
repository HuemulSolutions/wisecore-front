"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DiagramsRailPanel } from "@/components/diagrams/diagrams-rail-panel"

export interface DiagramSearchItem {
  id: string
  label: string
  color?: string
}

export interface DiagramSearchPanelProps {
  items: DiagramSearchItem[]
  /** Centra y selecciona el nodo en el canvas. */
  onFocusNode: (id: string) => void
  onClose: () => void
  onCloseFocusRef?: React.RefObject<HTMLButtonElement | null>
}

/**
 * Panel "Buscar en el diagrama" del riel. Vive dentro del canvas (hermano de
 * `<ReactFlow>`) porque necesita el contexto de React Flow; el resto de paneles
 * del riel viven en la página.
 */
export function DiagramSearchPanel({ items, onFocusNode, onClose, onCloseFocusRef }: DiagramSearchPanelProps) {
  const { t } = useTranslation("diagrams")
  const [term, setTerm] = useState("")
  const query = term.trim().toLowerCase()

  const matches = useMemo(
    () => (query ? items.filter((i) => i.label.toLowerCase().includes(query)) : []),
    [items, query],
  )

  return (
    <DiagramsRailPanel
      title={t("searchPanel.title")}
      counter={query ? t("searchPanel.counter", { count: matches.length }) : undefined}
      onClose={onClose}
      onCloseFocusRef={onCloseFocusRef}
    >
      <div className="relative shrink-0 border-b border-[#e9edf2] p-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("searchPanel.placeholder")}
          aria-label={t("searchPanel.placeholder")}
          className="h-8 pl-8 text-xs"
          // El canvas escucha atajos globales: escribir no debe crear nodos.
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!query ? (
          <p className="p-4 text-[12.5px] leading-normal text-slate-500">{t("searchPanel.hint")}</p>
        ) : matches.length === 0 ? (
          <p className="p-4 text-[12.5px] leading-normal text-slate-500">
            {t("searchPanel.empty", { term: term.trim() })}
          </p>
        ) : (
          <ul className="p-1.5">
            {matches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onFocusNode(item.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#0f172a] transition-colors hover:cursor-pointer hover:bg-[#f4f6f9]"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color ?? "#94a3b8" }}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label || t("searchPanel.untitledNode")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DiagramsRailPanel>
  )
}
