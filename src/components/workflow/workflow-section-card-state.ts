import type { ColorHue } from "@/lib/lifecycle-colors";
import type { WorkflowSummaryActionKind } from "@/components/workflow/workflow-summary-styles";
import {
  computeSectionStats,
  hasRequiredQuestions,
  isSectionAnswerable,
  isSectionAnswersCompleted,
} from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";

export type WorkflowSectionTone = "success" | "danger" | "info" | "muted";

/** Mismo hue que pinta el punto de la píldora de la vista 2 (workflow-section-pills.tsx, vía
 *  lib/lifecycle-colors.ts) — una sola tabla para que ambas superficies no diverjan. El color
 *  del CÍRCULO de la tarjeta del resumen ya no sale de acá: ver SUMMARY_CIRCLE_STYLES en
 *  workflow-summary-styles.ts (paleta hex literal propia de esa superficie). */
export const WORKFLOW_SECTION_TONE_HUE: Record<WorkflowSectionTone, ColorHue> = {
  success: "green",
  danger: "red",
  info: "blue",
  muted: "gray",
};

export interface WorkflowSectionCardState {
  tone: WorkflowSectionTone;
  /**
   * Color del TEXTO de estado del pie — independiente de `tone`: una sección "success" con
   * opcionales sin responder muestra el texto en gris, no en verde (ver SUMMARY_FOOTER_TEXT_STYLES).
   */
  footerTone: "success" | "danger" | "muted";
  /** Solo en success: reemplaza el número del círculo por un ✓. */
  showCheckIcon: boolean;
  isInactive: boolean;
  answeredCount: number;
  totalQuestions: number;
  missingRequired: number;
  /** Clave i18n del texto del pie, con prefijo de namespace cuando no es `workflow` (ej. "sections:form.fill.answeredCount"). */
  footerTextKey: string;
  footerTextParams?: Record<string, unknown>;
  action: {
    /** Idem footerTextKey. */
    labelKey: string;
    /** Estilo/icono del botón del pie — ver SUMMARY_ACTION_STYLES/SUMMARY_ACTION_ICONS. */
    kind: WorkflowSummaryActionKind;
  };
}

/**
 * Estado visual de una tarjeta de sección del resumen (y de su píldora en la vista 2) —
 * fuente única, sin React. Primera fila que matchea gana. Ver
 * "ia context" del rediseño del panel de workflow para las cuatro reglas y por qué NO existe
 * un quinto estado "azul = en progreso" (en secciones con obligatorias, missing_required === 0
 * ⇔ answers_status === 'completed'; las secciones sin obligatorias tienen su propio caso 2b).
 *
 * `canAnswer` es `canAnswerSpecificSection(section)` del panel — cruza permiso de documento,
 * permiso de sección por ciclo de vida (section_lifecycle_access) y si la sección está activa.
 */
export function resolveSectionCardState(
  section: ContentSection,
  canAnswer: boolean,
): WorkflowSectionCardState {
  const { answeredCount, questions } = computeSectionStats(section);
  const totalQuestions = questions.length;
  const missingRequired = section.missing_required ?? 0;

  // 1 — inactiva por depends_on: gana sobre cualquier otro estado, la sección no aplica con
  // las respuestas actuales (mismo criterio que computeSectionStats, que fuerza missingRequired
  // a 0 en este caso — pintarla de rojo contradiría su propio chip "Sección inactiva").
  if (!isSectionAnswerable(section)) {
    return {
      tone: "muted",
      footerTone: "muted",
      showCheckIcon: false,
      isInactive: true,
      answeredCount,
      totalQuestions,
      missingRequired,
      footerTextKey: "summary.card.inactive",
      action: { labelKey: "summary.card.view", kind: "view" },
    };
  }

  // 2 — completa: fuente única `answers_status`, nunca recalcular con missingRequired. Dentro de
  // este estado, la spec distingue "todo respondido" (obligatorias + opcionales) de "quedan
  // opcionales sin responder" — mismo tono verde en el círculo, pero el texto del pie pasa a gris.
  if (isSectionAnswersCompleted(section)) {
    const optionalPending = totalQuestions - answeredCount;
    const action = canAnswer
      ? { labelKey: "sections:form.fill.editResponses", kind: "edit" as const }
      : { labelKey: "summary.card.view", kind: "view" as const };
    if (optionalPending > 0) {
      return {
        tone: "success",
        footerTone: "muted",
        showCheckIcon: true,
        isInactive: false,
        answeredCount,
        totalQuestions,
        missingRequired: 0,
        footerTextKey: "summary.card.optionalPending",
        footerTextParams: { count: optionalPending },
        action,
      };
    }
    return {
      tone: "success",
      footerTone: "success",
      showCheckIcon: true,
      isInactive: false,
      answeredCount,
      totalQuestions,
      missingRequired: 0,
      footerTextKey: "summary.card.allAnswered",
      action,
    };
  }

  // 2b — sin ninguna obligatoria y aún pendiente: `missing_required` cuenta opcionales (ver
  // ContentSection.missing_required), así que no es "faltan obligatorias" (rojo) sino opcionales
  // sin responder, hasta responderlas o hasta que se abra la sección (mark_viewed).
  if (!hasRequiredQuestions(section)) {
    return {
      tone: "info",
      footerTone: "muted",
      showCheckIcon: false,
      isInactive: false,
      answeredCount,
      totalQuestions,
      missingRequired: 0,
      footerTextKey: "summary.card.optionalPending",
      footerTextParams: { count: totalQuestions - answeredCount },
      action: !canAnswer
        ? { labelKey: "summary.card.view", kind: "view" }
        : answeredCount > 0
          ? { labelKey: "sections:form.fill.editResponses", kind: "edit" }
          : { labelKey: "sections:form.fill.answer", kind: "answer" },
    };
  }

  // 3 — faltan obligatorias y el usuario puede responderlas.
  if (canAnswer) {
    return {
      tone: "danger",
      footerTone: "danger",
      showCheckIcon: false,
      isInactive: false,
      answeredCount,
      totalQuestions,
      missingRequired,
      footerTextKey: "wizard.summary.missingRequired",
      footerTextParams: { count: missingRequired },
      action:
        answeredCount > 0
          ? { labelKey: "sections:form.fill.editResponses", kind: "edit" }
          : { labelKey: "sections:form.fill.answer", kind: "answer" },
    };
  }

  // 4 — faltan obligatorias pero no le tocan a este usuario (otro rol/otra etapa).
  return {
    tone: "info",
    footerTone: "muted",
    showCheckIcon: false,
    isInactive: false,
    answeredCount,
    totalQuestions,
    missingRequired,
    footerTextKey: "summary.card.pendingOthers",
    action: { labelKey: "summary.card.view", kind: "view" },
  };
}
