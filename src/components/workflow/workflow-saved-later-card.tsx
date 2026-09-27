"use client"

import { ArrowRight, Plus, Save } from "lucide-react"
import { useTranslation } from "react-i18next"
import { WorkflowStatusCard, type WorkflowStatusAction } from "@/components/workflow/workflow-status-card"

interface WorkflowSavedLaterCardProps {
  /** Vuelve al wizard, en el mismo paso donde estaba (el panel nunca se desmonta). */
  onKeepGoing: () => void
  /** Ausente cuando no se conoce el template de origen (link de ejecución compartido directo). */
  onStartAnother?: () => void
}

/**
 * Tarjeta terminal que confirma el autoguardado tras "Continuar más tarde" (ver
 * `onContinueLater` en WorkflowDetailPanel). Puramente visual — no dispara ningún
 * guardado, ya lo hizo el autoguardado del formulario. Solo la usa la vista
 * fullscreen compartida (workflow-fill.tsx): es reversible ("Seguir completando"),
 * a diferencia de la pantalla terminal automática que prohíbe
 * ia context/fullscreen-share-route-guide.md.
 *
 * «Seguir completando» es la única acción principal (azul) del bloque «¿Algo más?».
 */
export function WorkflowSavedLaterCard({ onKeepGoing, onStartAnother }: WorkflowSavedLaterCardProps) {
  const { t } = useTranslation("workflow")

  const buttons: (WorkflowStatusAction & { primary?: boolean })[] = [
    { label: t("fill.savedKeepGoing"), icon: ArrowRight, onClick: onKeepGoing, primary: true },
    ...(onStartAnother ? [{ label: t("fill.savedStartAnother"), icon: Plus, onClick: onStartAnother }] : []),
  ]

  return (
    <WorkflowStatusCard
      icon={Save}
      tone="blue"
      title={t("fill.savedTitle")}
      description={t("fill.savedDescription")}
      needMore={{ label: t("fill.savedNeedMore"), buttons }}
      className="h-full"
    />
  )
}
