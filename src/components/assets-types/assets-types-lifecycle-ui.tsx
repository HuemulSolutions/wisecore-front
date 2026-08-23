"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Info, Plus, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { HuemulField } from "@/huemul/components/huemul-field"
import { cn } from "@/lib/utils"
import type { AccessRuleType, AccessRuleTypeOption } from "@/types/lifecycle"
import type { EditStepCardAccessRule } from "@/types/assets"

/**
 * Primitivos visuales compartidos por los tabs del sheet de configuración de
 * tipos de activo (matriz de «Permisos por rol» y lista/detalle de «Plantillas»).
 * Viven en el módulo porque su paleta está fijada al diseño de estas superficies
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
        <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#eef2f7] px-1.5 text-[11px] font-semibold text-[#64748b]">
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
        "divide-y divide-[#eef1f5] overflow-hidden rounded-xl border border-[#e5eaf0] bg-white",
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
  className,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  /** Contenido extra que se despliega bajo la fila cuando el toggle está activo. */
  children?: ReactNode
  /** Override de estilos del contenedor (ej. `px-0` al usarse fuera de `SettingToggleList`). */
  className?: string
}) {
  return (
    <div className={cn("px-3 py-2.5", className)}>
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
            "h-4.75 w-8.5 shrink-0 data-[state=checked]:bg-[#2563eb] data-[state=unchecked]:bg-[#dfe5ec]",
            "*:data-[slot=switch-thumb]:size-3.75 *:data-[slot=switch-thumb]:bg-white",
            "[&>[data-slot=switch-thumb][data-state=unchecked]]:translate-x-0.5",
            "[&>[data-slot=switch-thumb][data-state=checked]]:translate-x-3.75",
            !disabled && "hover:cursor-pointer",
          )}
        />
      </div>
      {children && <div className="pt-2">{children}</div>}
    </div>
  )
}

// ─── Pill button ──────────────────────────────────────────────────────────────

/** Pill con borde e ícono opcional (Editar, Cancelar, Listo). */
export function PanelPillButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone = "default",
  className,
}: {
  icon?: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: "default" | "primary"
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "inline-flex h-6.5 shrink-0 items-center gap-1 rounded-[7px] border px-2 text-[12px] font-medium transition-colors hover:cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        tone === "primary"
          ? "border-[#bfd3fb] bg-[#f5f8ff] text-[#1d4ed8] hover:bg-[#eaf1ff]"
          : "border-[#dde4ec] text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {label}
    </button>
  )
}

/** Pastilla de estado activo («Editando»), hermana de `StepModeBadge`. */
export function PanelStatePill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-[#bfd3fb] bg-[#f5f8ff] px-2 text-[11px] font-medium text-[#1d4ed8]">
      {label}
    </span>
  )
}

/** Badge de cambios sin guardar («• Editado»). */
export function PanelDirtyBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-[#fef6e7] px-2 text-[11px] font-medium text-[#b45309]">
      <span className="size-1.5 rounded-full bg-[#f59e0b]" />
      {label}
    </span>
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
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
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
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-[#fee2e2] hover:text-[#dc2626] hover:cursor-pointer disabled:pointer-events-none disabled:opacity-50"
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
    <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[#f1f4f8] px-2 text-[11px] font-medium text-[#64748b]">
      {label}
    </span>
  )
}

// ─── Resumen de solo lectura ──────────────────────────────────────────────────

/** Fila «label: valor» del resumen colapsado (grupo o paso simple en modo lectura). */
export function PanelSummaryRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
        {label}
      </span>
      <div className="text-[12.5px] leading-snug text-[#334155]">{children}</div>
    </div>
  )
}

// ─── Ayuda contextual ─────────────────────────────────────────────────────────

/**
 * Bloque de ayuda siempre visible (no depende de hover): ícono + texto, con
 * acción opcional a la derecha. `tone="warning"` se usa para avisos accionables
 * (p. ej. roles con acceso a otro step pero no a este); `tone="info"` para
 * explicaciones neutras de qué controla el campo.
 */
export function PanelInfoHint({
  children,
  tone = "info",
  action,
  className,
}: {
  children: ReactNode
  tone?: "info" | "warning"
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12px] leading-snug",
        tone === "warning"
          ? "border-[#fbe2b8] bg-[#fef8ee] text-[#92600c]"
          : "border-[#dbe6fb] bg-[#f5f8ff] text-[#3854a5]",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1.5">
        <span className="min-w-0">{children}</span>
        {action}
      </div>
    </div>
  )
}

// ─── Reglas adicionales de acceso ──────────────────────────────────────────────

/**
 * Editor de `access_rules` (creador / jefe del creador / jefe del propietario /
 * jefe de quien completó un step anterior). Compartido por `EditStepCard`
 * (Elaboración/Revisión/Aprobación) y `CreateStepContent` (Creador/Publicación/
 * Archivado/Lector) — antes solo vivía inline en `EditStepCard`, dejando a los
 * steps sin grupos sin forma de configurar estas reglas desde la UI aunque el
 * backend las soporta.
 */
export function AccessRulesEditor({
  accessRules,
  accessRuleTypeOptions,
  earlierStepOptions,
  onChange,
  disabled,
  t,
}: {
  accessRules: EditStepCardAccessRule[]
  accessRuleTypeOptions: AccessRuleTypeOption[]
  earlierStepOptions: { value: string; label: string }[]
  onChange: (rules: EditStepCardAccessRule[]) => void
  disabled?: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  const [pendingRuleType, setPendingRuleType] = useState<AccessRuleType | "">("")
  const [pendingSourceStepId, setPendingSourceStepId] = useState("")

  // Non-repeatable rule types already present can't be added again (backend
  // rejects exact rule_type+source_step_id duplicates); step_actor_manager can
  // repeat with a different source step, so it stays selectable.
  const addedSimpleRuleTypes = new Set(
    accessRules.filter((r) => r.rule_type !== "step_actor_manager").map((r) => r.rule_type)
  )
  const availableRuleTypeOptions = accessRuleTypeOptions.filter(
    (o) => !addedSimpleRuleTypes.has(o.value)
  )
  const ruleTypeLabel = (ruleType: AccessRuleType) =>
    t(`lifecycle.accessRuleTypes.${ruleType}`, {
      defaultValue: accessRuleTypeOptions.find((o) => o.value === ruleType)?.label ?? ruleType,
    })
  const sourceStepLabel = (sourceStepId: string | null) =>
    sourceStepId ? earlierStepOptions.find((o) => o.value === sourceStepId)?.label ?? sourceStepId : null

  const handleAdd = () => {
    if (!pendingRuleType) return
    if (pendingRuleType === "step_actor_manager" && !pendingSourceStepId) return
    onChange([
      ...accessRules,
      {
        rule_type: pendingRuleType,
        source_step_id: pendingRuleType === "step_actor_manager" ? pendingSourceStepId : null,
      },
    ])
    setPendingRuleType("")
    setPendingSourceStepId("")
  }

  const handleRemove = (index: number) => {
    onChange(accessRules.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <PanelFieldLabel disabled={disabled}>{t("lifecycle.accessRules.title")}</PanelFieldLabel>
      {accessRules.length > 0 && (
        <ChipList>
          {accessRules.map((rule, index) => (
            <RemovableChip
              key={`${rule.rule_type}-${rule.source_step_id ?? "none"}-${index}`}
              label={`${ruleTypeLabel(rule.rule_type)}${
                sourceStepLabel(rule.source_step_id)
                  ? ` (${sourceStepLabel(rule.source_step_id)})`
                  : ""
              }`}
              disabled={disabled}
              onRemove={disabled ? undefined : () => handleRemove(index)}
            />
          ))}
        </ChipList>
      )}
      <div className="flex items-center gap-2">
        <HuemulField
          type="select"
          label=""
          name={`access-rule-type-${accessRules.length}`}
          value={pendingRuleType}
          options={availableRuleTypeOptions.map((o) => ({
            value: o.value,
            label: ruleTypeLabel(o.value),
          }))}
          placeholder={t("lifecycle.panel.addRulePlaceholder")}
          onChange={(v) => {
            setPendingRuleType((v as AccessRuleType) || "")
            setPendingSourceStepId("")
          }}
          disabled={disabled}
          className="flex-1"
        />
        {pendingRuleType === "step_actor_manager" && (
          <HuemulField
            type="select"
            label=""
            name="access-rule-source"
            value={pendingSourceStepId}
            options={earlierStepOptions}
            placeholder={t("lifecycle.accessRules.sourceStepPlaceholder")}
            onChange={(v) => setPendingSourceStepId(String(v ?? ""))}
            disabled={disabled}
            className="flex-1"
          />
        )}
        <button
          type="button"
          onClick={handleAdd}
          title={t("lifecycle.accessRules.add")}
          aria-label={t("lifecycle.accessRules.add")}
          disabled={
            disabled ||
            !pendingRuleType ||
            (pendingRuleType === "step_actor_manager" && !pendingSourceStepId)
          }
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#dde4ec] text-[#64748b] transition-colors hover:cursor-pointer hover:bg-[#f8fafc] hover:text-[#334155] disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {pendingRuleType === "step_actor_manager" && (
        <p className="text-[11px] text-[#94a3b8]">
          {t("lifecycle.accessRules.stepActorManagerNote")}
        </p>
      )}
    </div>
  )
}
