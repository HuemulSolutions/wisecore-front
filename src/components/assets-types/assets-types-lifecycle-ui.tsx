"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

/**
 * Primitivos visuales de la pestaña «Permisos por rol» (matriz + panel lateral).
 * Viven en el módulo porque su paleta está fijada al diseño de esta superficie
 * (hex literales, sin variantes dark); lo genuinamente reutilizable —el control
 * segmentado— vive en `@/huemul/components/huemul-segmented-control`.
 */

// ─── Etiquetas de sección ─────────────────────────────────────────────────────

/** Label uppercase 11px con badge opcional (p. ej. «GRUPOS · 2»). */
export function PanelSectionLabel({
  label,
  count,
  className,
}: {
  label: string
  count?: number
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
        {label}
      </span>
      {count != null && (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#eef2f7] px-1.5 text-[11px] font-semibold text-[#64748b]">
          {count}
        </span>
      )}
    </div>
  )
}

/** Label de campo dentro del panel (12.5px), con estado deshabilitado. */
export function PanelFieldLabel({
  children,
  disabled,
  className,
}: {
  children: ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "text-[12.5px] font-medium leading-snug text-[#334155]",
        disabled && "opacity-50",
        className,
      )}
    >
      {children}
    </span>
  )
}

// ─── Lista de toggles ─────────────────────────────────────────────────────────

/** Contenedor de `SettingToggleRow` con divisores. */
export function SettingToggleList({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "divide-y divide-[#eef1f5] overflow-hidden rounded-[8px] border border-[#e5eaf0] bg-white",
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Fila de la lista de toggles: label + descripción a la izquierda, switch de
 * 34×19 a la derecha. El switch base mide 32×18 con thumb de 16px, así que las
 * medidas del diseño se aplican sobreescribiendo el thumb por `data-slot`.
 */
export function SettingToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  children,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  /** Contenido extra que se despliega bajo la fila cuando el toggle está activo. */
  children?: ReactNode
}) {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            className={cn(
              "text-[12.5px] font-medium leading-snug text-[#334155]",
              disabled && "opacity-60",
            )}
          >
            {label}
          </span>
          {description && (
            <span className="text-[11px] leading-snug text-[#94a3b8]">
              {description}
            </span>
          )}
        </div>
        <Switch
          checked={checked}
          disabled={disabled}
          onCheckedChange={(value) => onChange(Boolean(value))}
          aria-label={label}
          className={cn(
            "h-[19px] w-[34px] shrink-0 data-[state=checked]:bg-[#2563eb] data-[state=unchecked]:bg-[#dfe5ec]",
            "[&>[data-slot=switch-thumb]]:size-[15px] [&>[data-slot=switch-thumb]]:bg-white",
            "[&>[data-slot=switch-thumb][data-state=unchecked]]:translate-x-[2px]",
            "[&>[data-slot=switch-thumb][data-state=checked]]:translate-x-[15px]",
            !disabled && "hover:cursor-pointer",
          )}
        />
      </div>
      {children && <div className="pt-2">{children}</div>}
    </div>
  )
}

// ─── Icon button ──────────────────────────────────────────────────────────────

/** Icon-button discreto del panel (renombrar, eliminar, colapsar, cerrar). */
export function PanelIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone = "default",
  className,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: "default" | "danger"
  className?: string
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] text-[#94a3b8] transition-colors hover:cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        tone === "danger"
          ? "hover:bg-[#fef2f2] hover:text-[#dc2626]"
          : "hover:bg-[#eef2f7] hover:text-[#334155]",
        className,
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

// ─── Chips ────────────────────────────────────────────────────────────────────

/** Chip removible (rol asignado, regla de acceso). */
export function RemovableChip({
  label,
  onRemove,
  disabled,
  removeLabel,
}: {
  label: string
  onRemove?: () => void
  disabled?: boolean
  removeLabel?: string
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-[6px] border border-[#e3e9f0] bg-[#f6f8fb] py-1 pl-2 pr-1 text-[12px] text-[#334155]">
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={removeLabel ?? label}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] text-[#94a3b8] transition-colors hover:bg-[#fee2e2] hover:text-[#dc2626] hover:cursor-pointer disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

/** Contenedor de chips con wrap. */
export function ChipList({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>
}

// ─── Tarjeta ──────────────────────────────────────────────────────────────────

/** Tarjeta blanca del panel (grupo o bloque de permisos simples). */
export function PanelCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-[#e3e9f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Badge del tipo de paso («Manual» / «Automático») en la cabecera de la tarjeta. */
export function StepModeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-[20px] shrink-0 items-center rounded-full bg-[#f1f4f8] px-2 text-[11px] font-medium text-[#64748b]">
      {label}
    </span>
  )
}
