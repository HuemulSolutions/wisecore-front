"use client"

import { Archive, CheckCircle2, Eye, Globe, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  WorkflowStatusCard,
  type WorkflowStatusAction,
  type WorkflowStatusTone,
} from "@/components/workflow/workflow-status-card"
import type { WorkflowFinishOutcome } from "@/lib/workflow-finish-outcome"

interface WorkflowFinishedCardProps {
  /** Transición de ciclo de vida que acaba de dejar al usuario sin nada más que
   *  hacer (ver `resolveWorkflowFinishOutcome`). Determina título e ícono. */
  outcome: WorkflowFinishOutcome
  /** Nombre del workflow (template), interpolado en el título. */
  workflowName: string
  /** Vuelve al resumen de secciones. Ausente cuando no hay ninguna sección visible
   *  para este usuario en este momento (p. ej. la vista heredada de un grupo de
   *  edición recién se activa al terminar la ETAPA completa, no al pasar de un
   *  grupo a otro dentro de la misma etapa) — el botón se oculta en vez de llevar
   *  a un resumen vacío o al bloque de "paso vacío", que no aplica acá. */
  onViewAnswers?: () => void
  /** Ausente cuando no se conoce el template de origen (link de ejecución compartido directo). */
  onStartAnother?: () => void
}

/**
 * Tarjeta terminal mostrada tras una transición de ciclo de vida (completar,
 * enviar a aprobación, aprobar, publicar) que deja al usuario sin `edit` ni
 * `can_advance`/`publish` sobre el documento — no hay nada más que pueda hacer
 * en esta pestaña. Solo la usa la vista fullscreen compartida (workflow-fill.tsx).
 *
 * Reversible como exige ia context/fullscreen-share-route-guide.md §4: "Ver mis
 * respuestas" vuelve al resumen de secciones (WorkflowSectionsSummary), ya en
 * solo lectura por el propio lifecycle. Mismo patrón que WorkflowSavedLaterCard.
 *
 * Usa el shell `WorkflowStatusCard` — compartido con el caso "el usuario
 * TODAVÍA puede avanzar el flujo" / "bloqueado por otra sección" en
 * workflow-detail-panel.tsx, mismo look, distinto bloque de acciones.
 */
export function WorkflowFinishedCard({ outcome, workflowName, onViewAnswers, onStartAnother }: WorkflowFinishedCardProps) {
  const { t } = useTranslation("workflow")

  const titleKey =
    outcome === "answersSent"
      ? "fill.finished.answersSentTitle"
      : outcome === "sentToApproval"
        ? "fill.finished.sentToApprovalTitle"
        : outcome === "approved"
          ? "fill.finished.approvedTitle"
          : outcome === "archived"
            ? "fill.finished.archivedTitle"
            : "fill.finished.publishedTitle"

  const isPublished = outcome === "published"
  const Icon = isPublished ? Globe : outcome === "archived" ? Archive : CheckCircle2
  const tone: WorkflowStatusTone = isPublished ? "blue" : outcome === "archived" ? "gray" : "green"

  const buttons: WorkflowStatusAction[] = [
    ...(onStartAnother ? [{ label: t("fill.savedStartAnother"), icon: Plus, onClick: onStartAnother }] : []),
    ...(onViewAnswers ? [{ label: t("fill.finished.viewAnswers"), icon: Eye, onClick: onViewAnswers }] : []),
  ]

  return (
    <WorkflowStatusCard
      icon={Icon}
      tone={tone}
      title={t(titleKey, { name: workflowName })}
      description={t(
        isPublished
          ? "fill.finished.publishedDescription"
          : outcome === "archived"
            ? "fill.finished.archivedDescription"
            : "fill.finished.description",
      )}
      needMore={{ label: t("fill.savedNeedMore"), buttons }}
    />
  )
}
