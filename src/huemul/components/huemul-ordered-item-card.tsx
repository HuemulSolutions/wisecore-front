"use client"

import * as React from "react"
import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { HuemulOrderedItemCardProps } from "@/types/huemul"

export type { HuemulOrderedItemCardProps, HuemulOrderedItemCardMenuAction } from "@/types/huemul"

/**
 * Fila numerada de una lista ordenable: círculo de orden, contenido central
 * clickeable, caja de contexto y chips opcionales, link "Configurar" y menú
 * de tres puntos armado desde `menuActions`. Sin dominio — el caller arma
 * `title`/`summary`/`contextBox`/`chips` con su propio JSX y le inyecta el
 * `dragHandle` (dnd-kit u otro) por slot.
 */
export function HuemulOrderedItemCard({
  orderLabel,
  accent = false,
  onClick,
  title,
  summary,
  contextBox,
  chips,
  configureLabel,
  onConfigure,
  menuActions,
  menuAriaLabel,
  dragHandle,
  isDragging = false,
  className,
  menuOpen,
  onMenuOpenChange,
}: HuemulOrderedItemCardProps) {
  const [uncontrolledMenuOpen, setUncontrolledMenuOpen] = React.useState(false)
  const isMenuControlled = menuOpen !== undefined && onMenuOpenChange !== undefined
  const resolvedMenuOpen = isMenuControlled ? menuOpen : uncontrolledMenuOpen
  const setMenuOpen = isMenuControlled ? onMenuOpenChange : setUncontrolledMenuOpen

  return (
    <div
      className={cn(
        "flex gap-3.5 rounded-xl border bg-white p-4",
        accent ? "border-[#dbe6ff]" : "border-[#e2e8f0]",
        isDragging && "opacity-80",
        className,
      )}
    >
      {dragHandle}

      <div
        className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        style={{
          backgroundColor: accent ? "#eff4ff" : "#f1f4f7",
          color: accent ? "#1d4ed8" : "#475569",
        }}
      >
        {orderLabel}
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onClick}
          disabled={!onClick}
          className={cn("flex w-full flex-col items-start gap-1 text-left", onClick && "hover:cursor-pointer")}
        >
          <div className="flex flex-wrap items-center gap-2">{title}</div>
          {summary && <div className="text-[13px] text-[#64748b]">{summary}</div>}
        </button>

        {contextBox && <div className="mt-2">{contextBox}</div>}
        {chips && <div className="mt-2 flex flex-wrap gap-1.5">{chips}</div>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {configureLabel && onConfigure && (
          <button
            type="button"
            onClick={onConfigure}
            className="text-[12px] font-medium text-[#2563eb] hover:cursor-pointer hover:underline"
          >
            {configureLabel}
          </button>
        )}
        {menuActions && menuActions.length > 0 && (
          <DropdownMenu open={resolvedMenuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={menuAriaLabel}
                className="flex h-5.5 w-5.5 items-center justify-center rounded-md text-[#64748b] hover:cursor-pointer hover:bg-[#f1f4f7]"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-[186px] rounded-[10px] border-[#e6ebf1] shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
            >
              {menuActions.map((action) => (
                <DropdownMenuItem
                  key={action.key}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  variant={action.destructive ? "destructive" : "default"}
                  className="text-[13px] hover:cursor-pointer"
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
