"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { RefreshCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HuemulButton } from "./huemul-button"
import { cn } from "@/lib/utils"
import type { HuemulPanelHeaderProps } from "@/types/huemul"

export type { HuemulPanelHeaderProps, PanelHeaderSearchConfig } from "@/types/huemul"

/**
 * Header de un panel lateral: título a la izquierda y controles icon-only a la
 * derecha en orden fijo (búsqueda → refresh → acciones). Existe para que todos
 * los paneles laterales del producto se manejen igual, sin importar si el panel
 * lista un árbol de conocimiento o una paleta de tipos de activo.
 *
 * El refresh es opcional a propósito: cuando la página ya expone uno en su
 * `PageHeader` no se pasa aquí (un botón por contenedor, no por endpoint).
 */
export function HuemulPanelHeader({
  title,
  icon: Icon,
  search,
  onRefresh,
  isRefreshing = false,
  actions,
  className,
}: HuemulPanelHeaderProps) {
  const { t } = useTranslation("common")
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  const isSearchOpen = search?.open ?? uncontrolledOpen
  const isSearchVisible = !!search && (search.alwaysOpen || isSearchOpen)

  const handleToggleSearch = () => {
    // Cerrar limpia: un filtro activo que no se ve es un filtro que confunde.
    if (isSearchOpen) {
      search?.onChange("")
      search?.onCommit?.("")
    }
    const next = !isSearchOpen
    if (search?.onOpenChange) search.onOpenChange(next)
    else setUncontrolledOpen(next)
  }

  return (
    <div className={cn("relative flex w-full min-w-0 flex-col px-2 py-0", className)}>
      <div className="flex items-center justify-between">
        <div className="flex h-8 min-w-0 shrink items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground">
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {search && !search.alwaysOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:cursor-pointer"
              onClick={handleToggleSearch}
            >
              {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          )}
          {onRefresh && (
            <HuemulButton
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              icon={RefreshCw}
              iconClassName="h-4 w-4"
              tooltip={t("refresh")}
              loading={isRefreshing}
              onClick={onRefresh}
            />
          )}
          {actions}
        </div>
      </div>
      {isSearchVisible && search && (
        <div className="px-2 pt-1 pb-1">
          <Input
            placeholder={search.placeholder}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search.onCommit?.(search.value) }}
            className="h-7 text-xs"
            autoFocus={!search.alwaysOpen}
          />
        </div>
      )}
    </div>
  )
}
