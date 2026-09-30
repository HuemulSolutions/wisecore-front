"use client"

import { ChevronRight, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { NavKnowledgeCreateMenu } from "@/components/layout/nav-knowledge-create-menu"

export interface NavKnowledgeRailProps {
  onExpand: () => void
  onSearch: () => void
}

/**
 * Rail vertical del panel de knowledge colapsado: chevron para expandir,
 * búsqueda (expande y abre el buscador) y menú "+" de creación.
 */
export function NavKnowledgeRail({ onExpand, onSearch }: NavKnowledgeRailProps) {
  const { t } = useTranslation('layout')

  return (
    <div
      className="flex h-full w-full flex-col items-center gap-1 border-r py-2"
      style={{ backgroundColor: "var(--adp-rail-bg, var(--muted))", borderColor: "var(--adp-border, var(--border))" }}
    >
      <button
        type="button"
        onClick={onExpand}
        title={t('knowledge.expand')}
        className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:cursor-pointer hover:bg-muted hover:text-foreground"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:cursor-pointer"
        onClick={onSearch}
        title={t('knowledge.searchPlaceholder')}
      >
        <Search className="h-4 w-4" />
      </Button>
      <NavKnowledgeCreateMenu side="right" align="start" />
    </div>
  )
}
