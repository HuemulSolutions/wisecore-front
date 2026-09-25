"use client"

import { HuemulButton } from "@/huemul/components/huemul-button"
import { cn } from "@/lib/utils"

/**
 * Movido desde `assets-types-lifecycle-ui.tsx` (su docstring original ya
 * aclaraba que "lo genuinamente reutilizable" no debía vivir ahí). Segundo
 * consumidor real: el panel de detalle de `/users`
 * (`UserDetailPanel` + `useUserRolesStaging`, ver
 * `ia context/sheet-footer-batch-save-guide.md`, variante "sheet sin footer").
 * `assets-types-lifecycle-ui.tsx` reexporta `PanelSaveBar`/`PanelDirtyBadge`
 * desde acá para no tocar sus 3 consumidores existentes.
 */

/** Badge de cambios sin guardar («• Editado»). */
export function HuemulPanelDirtyBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-[#fef6e7] px-2 text-[11px] font-medium text-[#b45309]">
      <span className="size-1.5 rounded-full bg-[#f59e0b]" />
      {label}
    </span>
  )
}

export interface HuemulPanelSaveBarProps {
  isDirty: boolean
  /** Gate adicional de validación (ej. nombre requerido). Por defecto, igual a `isDirty`. */
  canSave?: boolean
  isSaving?: boolean
  /** Resumen de lo pendiente, p. ej. «2 roles por agregar · 1 rol por quitar». Solo se muestra si `isDirty`. */
  dirtyLabel?: string
  /** Texto muted opcional junto al resumen — siempre visible, sin depender de `isDirty`. */
  hintLabel?: string
  saveLabel: string
  discardLabel: string
  onSave: () => void
  onDiscard: () => void
  className?: string
}

/**
 * Barra de guardado para un panel/tab con staging: «Descartar» siempre
 * accesible + «Guardar cambios» a la derecha, con el resumen de lo pendiente
 * a la izquierda. Vive dentro del contenido, en el mismo sitio donde vive el
 * estado `isDirty` (patrón "sheet/panel sin footer propio" — ver
 * `ia context/sheet-footer-batch-save-guide.md`).
 */
export function HuemulPanelSaveBar({
  isDirty,
  canSave = isDirty,
  isSaving,
  dirtyLabel,
  hintLabel,
  saveLabel,
  discardLabel,
  onSave,
  onDiscard,
  className,
}: HuemulPanelSaveBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-[#e9edf2] bg-white pt-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {isDirty && dirtyLabel && <HuemulPanelDirtyBadge label={dirtyLabel} />}
        {hintLabel && (
          <span className="truncate text-[11px] text-[#94a3b8]">{hintLabel}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <HuemulButton
          variant="ghost"
          size="sm"
          label={discardLabel}
          disabled={!isDirty || isSaving}
          onClick={onDiscard}
        />
        <HuemulButton
          size="sm"
          label={saveLabel}
          loading={isSaving}
          disabled={!canSave}
          onClick={onSave}
        />
      </div>
    </div>
  )
}
