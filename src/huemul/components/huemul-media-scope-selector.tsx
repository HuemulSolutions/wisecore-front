import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, History } from "lucide-react"

import { HuemulButton } from "./huemul-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getExecutionDisplayLabel } from "@/components/assets/content/utils/version-utils"
import { formatAbsoluteDate } from "@/lib/format-relative-time"
import { parseApiDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { MediaScope, MediaScopeExecutionOption } from "@/types/media"

export interface HuemulMediaScopeSelectorProps {
  scope: MediaScope
  onScopeChange: (scope: MediaScope) => void
  documentId: string
  executions: MediaScopeExecutionOption[]
  /** Label a mostrar en el trigger cuando el alcance activo es una versión — normalmente `getExecutionCompactLabel(execución activa)`. */
  activeExecutionLabel?: string
  /** Trigger más chico (h-7) y menú angosto, para usar en paneles laterales. */
  compact?: boolean
  className?: string
}

/**
 * `HuemulMediaScopeSelector` — selector "Documento completo" + lista de versiones,
 * usado para elegir a qué alcance de media mirar/subir. Extraído de `MediaListSheet`
 * para reusarlo también en el tab "Recursos" del panel de detalle del activo.
 *
 * Si no hay ejecuciones, no renderiza nada (no tiene sentido elegir alcance).
 *
 * @example
 * ```tsx
 * <HuemulMediaScopeSelector
 *   scope={scope}
 *   onScopeChange={setScope}
 *   documentId={documentId}
 *   executions={allExecutions}
 * />
 * ```
 */
export function HuemulMediaScopeSelector({
  scope,
  onScopeChange,
  documentId,
  executions,
  activeExecutionLabel,
  compact = false,
  className,
}: HuemulMediaScopeSelectorProps) {
  const { t } = useTranslation(["media"])
  const [menuOpen, setMenuOpen] = useState(false)
  const selectedExecutionItemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    // El contenido del dropdown recién se monta al abrir — esperar el próximo frame antes de scrollear.
    const raf = requestAnimationFrame(() => {
      selectedExecutionItemRef.current?.scrollIntoView({ block: "nearest" })
    })
    return () => cancelAnimationFrame(raf)
  }, [menuOpen])

  if (executions.length === 0) return null

  const sortedExecutions = [...executions].sort(
    (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime(),
  )
  const scopeExecution = scope.level === "execution" ? executions.find((e) => e.id === scope.parentId) : undefined
  const triggerLabel =
    scope.level === "document"
      ? t("media:listSheet.scope.document")
      : (activeExecutionLabel || (scopeExecution ? getExecutionDisplayLabel(scopeExecution) : t("media:listSheet.scope.document")))

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <HuemulButton
          variant="outline"
          size="sm"
          className={cn("min-w-0 gap-1.5 text-xs font-medium", compact ? "h-7" : "h-8", className)}
          tooltip={t("media:listSheet.scope.trigger")}
        >
          <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={cn("truncate", compact ? "max-w-24" : "max-w-40")}>{triggerLabel}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </HuemulButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={compact ? "w-56" : "w-72"}>
        <DropdownMenuItem
          className="hover:cursor-pointer"
          style={scope.level === "document" ? { backgroundColor: "var(--adp-accent-bg, var(--accent))", color: "var(--adp-accent-fg, var(--primary))" } : undefined}
          onClick={() => onScopeChange({ level: "document", parentId: documentId })}
        >
          {t("media:listSheet.scope.document")}
        </DropdownMenuItem>
        <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("media:listSheet.scope.versionsHeading")}
        </div>
        <div className="overflow-y-auto max-h-64">
          {sortedExecutions.map((execution) => {
            const isSelected = scope.level === "execution" && scope.parentId === execution.id
            return (
              <DropdownMenuItem
                key={execution.id}
                ref={isSelected ? selectedExecutionItemRef : undefined}
                className="hover:cursor-pointer"
                style={isSelected ? { backgroundColor: "var(--adp-accent-bg, var(--accent))" } : undefined}
                onClick={() => onScopeChange({ level: "execution", parentId: execution.id })}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span
                    className="text-sm truncate"
                    style={isSelected ? { fontWeight: 600, color: "var(--adp-accent-fg, var(--primary))" } : undefined}
                  >
                    {getExecutionDisplayLabel(execution)}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {[
                      execution.created_at ? formatAbsoluteDate(execution.created_at) : null,
                      execution.created_by_user
                        ? `${execution.created_by_user.name} ${execution.created_by_user.last_name}`.trim()
                        : null,
                    ].filter(Boolean).join(" · ")}
                  </span>
                </div>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
