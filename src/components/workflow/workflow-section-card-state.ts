import type { WorkflowSummaryActionKind } from "@/components/workflow/workflow-summary-styles";
import {
  computeSectionStats,
  hasRequiredQuestions,
  isSectionAnswerable,
  isSectionAnswersCompleted,
} from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";

export type WorkflowSectionTone = "success" | "danger" | "info" | "muted";

/** Fragmento del mensaje de estado: clave i18n (con prefijo de namespace cuando no es `workflow`) + parámetros. */
export interface WorkflowSectionStatusPart {
  key: string;
  params?: Record<string, unknown>;
}

export interface WorkflowSectionCardState {
  tone: WorkflowSectionTone;
  /**
   * Color del mensaje de estado — independiente de `tone`: una sección "success" con opcionales
   * sin responder muestra el texto en gris, no en verde (ver SUMMARY_STATUS_TEXT_STYLES).
   */
  statusTone: "success" | "danger" | "muted";
  isInactive: boolean;
  missingRequired: number;
  /** Mensaje de estado bajo el título, en fragmentos que la tarjeta traduce y une con « · ». */
  statusParts: WorkflowSectionStatusPart[];
  action: {
    /** Clave i18n, con prefijo de namespace cuando no es `workflow`. */
    labelKey: string;
    /** Estilo/icono del botón del pie — ver SUMMARY_ACTION_STYLES/SUMMARY_ACTION_ICONS. */
    kind: WorkflowSummaryActionKind;
  };
}

/**
 * Estado visual de una tarjeta de sección del resumen —
 * fuente única, sin React. Primera fila que matchea gana. Ver
 * "ia context" del rediseño del panel de workflow para las cuatro reglas y por qué NO existe
 * un quinto estado "azul = en progreso" (en secciones con obligatorias, missing_required === 0
 * ⇔ answers_status === 'completed'; las secciones sin obligatorias tienen su propio caso 2b).
 *
 * El mensaje de estado (`statusParts`) distingue obligatorias respondidas / pendientes,
 * opcionales sin responder y "todo respondido".
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
  const requiredTotal = questions.filter((f) => f.required).length;
  // Las obligatorias pendientes salen del backend (missing_required); las respondidas son el resto.
  const requiredAnswered = Math.max(0, requiredTotal - missingRequired);
  const optionalPending = totalQuestions - answeredCount;

  const optionalPendingPart: WorkflowSectionStatusPart = {
    key: "summary.card.optionalPending",
    params: { count: optionalPending },
  };

  // 1 — inactiva por depends_on: gana sobre cualquier otro estado, la sección no aplica con
  // las respuestas actuales (mismo criterio que computeSectionStats, que fuerza missingRequired
  // a 0 en este caso — pintarla de rojo contradiría su propio chip "Sección inactiva").
  if (!isSectionAnswerable(section)) {
    return {
      tone: "muted",
      statusTone: "muted",
      isInactive: true,
      missingRequired,
      statusParts: [{ key: "summary.card.inactive" }],
      action: { labelKey: "summary.card.view", kind: "view" },
    };
  }

  // 2 — completa: fuente única `answers_status`, nunca recalcular con missingRequired. Dentro de
  // este estado, la spec distingue "todo respondido" (obligatorias + opcionales) de "quedan
  // opcionales sin responder" — mismo tono verde en el círculo, pero el texto pasa a gris.
  if (isSectionAnswersCompleted(section)) {
    const action = canAnswer
      ? { labelKey: "sections:form.fill.editResponses", kind: "edit" as const }
      : { labelKey: "summary.card.view", kind: "view" as const };
    if (optionalPending > 0) {
      return {
        tone: "success",
        statusTone: "muted",
        isInactive: false,
        missingRequired: 0,
        statusParts: [
          ...(requiredTotal > 0
            ? [{ key: "summary.card.requiredAnswered", params: { count: requiredTotal } }]
            : []),
          optionalPendingPart,
        ],
        action,
      };
    }
    return {
      tone: "success",
      statusTone: "success",
      isInactive: false,
      missingRequired: 0,
      statusParts: [{ key: "summary.card.allDone" }],
      action,
    };
  }

  // 2b — sin ninguna obligatoria y aún pendiente: `missing_required` cuenta opcionales (ver
  // ContentSection.missing_required), así que no es "faltan obligatorias" (rojo) sino opcionales
  // sin responder, hasta responderlas o hasta que se abra la sección (mark_viewed).
  if (!hasRequiredQuestions(section)) {
    return {
      tone: "info",
      statusTone: optionalPending > 0 ? "muted" : "success",
      isInactive: false,
      missingRequired: 0,
      statusParts: [optionalPending > 0 ? optionalPendingPart : { key: "summary.card.allDone" }],
      action: !canAnswer
        ? { labelKey: "summary.card.view", kind: "view" }
        : answeredCount > 0
          ? { labelKey: "sections:form.fill.editResponses", kind: "edit" }
          : { labelKey: "sections:form.fill.answer", kind: "answer" },
    };
  }

  // 3 — faltan obligatorias y el usuario puede responderlas. Sin ninguna respondida se dice
  // solo cuántas faltan; con alguna respondida se dicen ambas cantidades.
  if (canAnswer) {
    return {
      tone: "danger",
      statusTone: "danger",
      isInactive: false,
      missingRequired,
      statusParts:
        requiredAnswered > 0
          ? [
              { key: "summary.card.requiredAnswered", params: { count: requiredAnswered } },
              { key: "summary.card.pendingShort", params: { count: missingRequired } },
            ]
          : [{ key: "summary.card.requiredPending", params: { count: missingRequired } }],
      action:
        answeredCount > 0
          ? { labelKey: "sections:form.fill.editResponses", kind: "edit" }
          : { labelKey: "sections:form.fill.answer", kind: "answer" },
    };
  }

  // 4 — faltan obligatorias pero no le tocan a este usuario (otro rol/otra etapa).
  return {
    tone: "info",
    statusTone: "muted",
    isInactive: false,
    missingRequired,
    statusParts: [{ key: "summary.card.pendingOthers" }],
    action: { labelKey: "summary.card.view", kind: "view" },
  };
}
