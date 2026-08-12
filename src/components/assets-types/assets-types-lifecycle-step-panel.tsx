"use client"

import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { StepContent } from "./assets-types-lifecycle-dialog"
import type { LifecycleStepPanelProps } from "@/types/assets"

export type { LifecycleStepPanelProps } from "@/types/assets"

/**
 * Panel lateral de configuración de una columna (step) de la matriz de permisos
 * por rol. Se abre desde el engranaje del header de columna
 * (`assets-types-lifecycle-matrix.tsx`) y reutiliza tal cual el router
 * `StepContent`: `EditStepContent` para pasos con grupos (Elaboración, Revisión,
 * Aprobación) y `CreateStepContent` para permisos simples — nada de SLA, modo
 * manual/automático, reglas de acceso o alta/baja de grupos cambia, solo el
 * punto de entrada.
 */
export function LifecycleStepPanel({
  documentTypeId,
  step,
  onClose,
  onEditingChange,
  organizationId,
}: LifecycleStepPanelProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const stepTypeLabel = t(`lifecycle.stepTypes.${step.type}`, { defaultValue: step.type })

  return (
    <div className="flex flex-col h-full min-h-0 border-l border-border bg-background">
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground truncate">
          {t("lifecycle.matrix.configureStep", { step: stepTypeLabel })}
        </p>
        <HuemulButton
          icon={X}
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClose}
          tooltip={t("common:close")}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-3">
        <StepContent
          documentTypeId={documentTypeId}
          stepType={step.type}
          stepLabel={step.name ?? stepTypeLabel}
          onEditingChange={onEditingChange}
          organizationId={organizationId}
        />
      </div>
    </div>
  )
}
