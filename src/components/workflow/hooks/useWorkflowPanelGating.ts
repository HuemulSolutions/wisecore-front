import * as React from "react";
import { AlertTriangle, CircleArrowRight, Clock, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { lifecycleAllows, lifecycleStageAllowsEditing } from "@/hooks/useDocumentAccess";
import {
  READ_ONLY_NOTICE_STATES,
  resolveLifecycleActionsVisibility,
  isExternalElaborationLocked,
} from "@/lib/lifecycle-access";
import { resolveWorkflowFinishOutcome, type WorkflowFinishOutcome } from "@/lib/workflow-finish-outcome";
import { useLifecycleActions } from "@/hooks/useLifecycleActions";
import { workflowQueryKeys } from "@/hooks/useWorkflows";
import { isSectionAnswerable } from "@/components/workflow/workflow-section-stats";
import { resolveSectionCanEdit, type SectionAccessMap } from "@/hooks/useDocumentSectionAccess";
import type { WorkflowStatusTone } from "@/components/workflow/workflow-status-card";
import type { AssetContentResponse, ContentSection } from "@/types/assets";

export type WorkflowReadOnlyReason = "permission" | "externalElaboration" | "stage" | "sectionInactive" | "section" | null;

export interface UseWorkflowPanelGatingOptions {
  isFullscreen: boolean;
  /** Prop `showLifecycle` del panel — factor de showLifecycleRow/showStageBadge (default true en
   *  ambos usos actuales, pero un caller futuro puede pasarlo en false). */
  showLifecycle: boolean;
  documentId: string | null;
  /** executionId ?? data?.execution_id — la ejecución real sobre la que corre el ciclo de vida. */
  lifecycleExecutionId: string | undefined;
  organizationId: string | null;
  needsNameStep: boolean;
  isLoading: boolean;
  isSectionAccessLoading: boolean;
  error: unknown;
  data: AssetContentResponse["data"] | undefined;
  sectionAccess: SectionAccessMap;
  formSections: ContentSection[];
  activeSection: ContentSection | undefined;
  /** view === "section" — distinto de `!!activeSection`: durante el reanclaje por id (un
   *  depends_on cambia formSections) puede haber un render con view "section" y activeSection
   *  aún sin resolver; hideComplete debe seguir leyendo ese frame como "en la vista de sección". */
  isSectionView: boolean;
  isLastSection: boolean;
  canUpdateAssetContent: boolean;
  canListCustomFields: boolean;
  canReadExternalPublishConfig: boolean;
  documentName: string | undefined;
  template: { name?: string } | null | undefined;
  /** Estables (ver useWorkflowPanelView) — los consume useLifecycleActions.onGoToSection/onAfterComplete. */
  openSection: (index: number) => void;
  goToSummary: () => void;
}

/**
 * Todo el bloque de derivación de permisos/ciclo de vida del panel: cruce lifecycle × etapa ×
 * RBAC (ver ia context/rbac-audit-guide.md), motivo de solo lectura, outcome terminal
 * (fullscreen) y visibilidad de las acciones de ciclo de vida. Sin JSX — lo consume el panel y
 * lo resuelve a texto/props para el header, el banner, el pie y el bloque "paso vacío".
 */
export function useWorkflowPanelGating({
  isFullscreen,
  showLifecycle,
  documentId,
  lifecycleExecutionId,
  organizationId,
  needsNameStep,
  isLoading,
  isSectionAccessLoading,
  error,
  data,
  sectionAccess,
  formSections,
  activeSection,
  isSectionView,
  isLastSection,
  canUpdateAssetContent,
  canListCustomFields,
  canReadExternalPublishConfig,
  documentName,
  template,
  openSection,
  goToSummary,
}: UseWorkflowPanelGatingOptions) {
  const { t } = useTranslation(["workflow", "assets"]);

  // Cruce lifecycle × etapa × RBAC (AND): el lifecycle contesta "¿sos el editor DE ESTE
  // documento?" (rol), la etapa "¿este documento admite respuestas AHORA?" y RBAC "¿tu rol te
  // permite escribir EN ABSOLUTO?". `lifecycle_permissions.edit` es un permiso de ROL, no de
  // etapa: sin el factor de etapa, un aprobador que también es actor de un grupo de
  // elaboración veía los campos habilitados en aprobación y el PATCH no persistía. Los
  // `undefined` degradan a "solo RBAC decide", igual que en /asset. El cuarto factor (sin
  // ElaborationRun bloqueando) es independiente de la etapa.
  const canAnswerForm =
    canUpdateAssetContent &&
    lifecycleAllows(data?.lifecycle_permissions, "edit") &&
    lifecycleStageAllowsEditing(data?.lifecycle_status) &&
    !isExternalElaborationLocked(data?.lifecycle_status);

  // Resuelto contra sectionAccess (GET /documents/{id}/sections), no contra
  // currentSection.can_edit (siempre undefined, /content no lo manda). `null` = el flag no
  // aplica a esta sección/documento — no degrada a solo lectura por eso solo, `can_answer` en
  // cada form_field sigue siendo la autoridad. isSectionAnswerable cubre el depends_on propio
  // de la sección.
  const canAnswerSpecificSection = React.useCallback(
    (section: ContentSection) =>
      canAnswerForm && resolveSectionCanEdit(section, sectionAccess) !== false && isSectionAnswerable(section),
    [canAnswerForm, sectionAccess],
  );

  const canAnswerSection = activeSection ? canAnswerSpecificSection(activeSection) : canAnswerForm;

  // Al menos una sección del documento es respondible AHORA por este usuario — distingue
  // "tengo permiso de rol para editar en general" de "hay algo puntual que pueda responder ya"
  // (hand-off entre dos grupos secuenciales de la MISMA etapa `edit`).
  const hasAnswerableSection = React.useMemo(
    () => formSections.some((s) => canAnswerSpecificSection(s)),
    [formSections, canAnswerSpecificSection],
  );

  // Motivo del aviso de solo lectura: distingue "no tenés permiso/rol", "hay un ElaborationRun
  // bloqueando la execution", "esta etapa ya no admite respuestas", "esta sección está inactiva
  // según las respuestas dadas" y "esta sección es de solo lectura en esta etapa".
  // externalElaboration va antes que stage/permission: es el motivo más específico y accionable.
  const readOnlyReason: WorkflowReadOnlyReason = canAnswerSection
    ? null
    : isExternalElaborationLocked(data?.lifecycle_status)
      ? "externalElaboration"
      : !canUpdateAssetContent || !lifecycleAllows(data?.lifecycle_permissions, "edit")
        ? "permission"
        : !lifecycleStageAllowsEditing(data?.lifecycle_status)
          ? "stage"
          : activeSection && !isSectionAnswerable(activeSection)
            ? "sectionInactive"
            : "section";

  // El bloqueo por ciclo de vida viene de lifecycleStageAllowsEditing: stage distinto de `edit`
  // o estado terminal. En el caso terminal el `stage` miente (publish vs published), así que el
  // aviso nombra el `state`; los que no encajan en la frase caen al genérico.
  const stageNotice = React.useMemo(() => {
    const state = data?.lifecycle_status?.state;
    if (!state || !READ_ONLY_NOTICE_STATES.has(state)) return t("fill.readOnlyLifecycleNotice");
    return t("fill.readOnlyStateNotice", {
      state: t(`lifecycle.stateLabels.${state}`, { ns: "assets", defaultValue: state }).toLocaleLowerCase(),
    });
  }, [data?.lifecycle_status?.state, t]);

  const readOnlyMessage = readOnlyReason
    ? readOnlyReason === "externalElaboration"
      ? t("fill.readOnlyExternalElaborationNotice")
      : readOnlyReason === "stage"
        ? stageNotice
        : readOnlyReason === "sectionInactive"
          ? t("fill.readOnlyInactiveSectionNotice")
          : readOnlyReason === "section"
            ? t("fill.readOnlySectionNotice")
            : t("fill.readOnlyNotice")
    : null;

  // Se levanta justo antes de abrir el diálogo de "Completar" desde el botón primario del pie de
  // la vista 2, para distinguir esa apertura de la del botón "Completar" de HuemulLifecycleActions
  // (mismo isCheckDialogOpen compartido) — solo la primera debe volver al resumen al terminar.
  const finishAfterCompleteRef = React.useRef(false);

  const lifecycle = useLifecycleActions({
    documentId,
    executionId: lifecycleExecutionId,
    organizationId,
    documentTypeId: data?.document_type?.id,
    lifecycleStatus: data?.lifecycle_status,
    lifecyclePermissions: data?.lifecycle_permissions,
    rbac: { canTransition: canUpdateAssetContent },
    extraRefreshKeys: () => [workflowQueryKeys.listBase()],
    canListCustomFields,
    canReadExternalPublishConfig,
    // ContentSection.id ES el section execution id. Si la sección no está en formSections (de
    // otro step, o sin permiso de vista), no hay a dónde navegar y el botón se omite.
    onGoToSection: (sectionExecutionId: string) => {
      const index = formSections.findIndex((s) => s.id === sectionExecutionId);
      if (index !== -1) openSection(index);
    },
    onAfterComplete: () => {
      if (!finishAfterCompleteRef.current) return;
      finishAfterCompleteRef.current = false;
      goToSummary();
    },
  });

  // Nombre del workflow para la tarjeta terminal: el nombre del TEMPLATE, no el del documento.
  const workflowName = data?.template_name ?? template?.name ?? documentName ?? "";

  // Outcome terminal DECLARATIVO: se recalcula en cada render a partir del estado actual del
  // documento. Solo aplica en fullscreen: en el panel de /workflow el usuario sigue dentro de
  // la app, no hay pestaña que cerrar.
  const finishOutcome = React.useMemo<WorkflowFinishOutcome | null>(() => {
    if (!isFullscreen || !documentId || needsNameStep) return null;
    if (isLoading || isSectionAccessLoading || !!error) return null;
    return resolveWorkflowFinishOutcome({
      status: data?.lifecycle_status,
      permissions: data?.lifecycle_permissions,
      canTransition: canUpdateAssetContent,
      finalLifecycleStage: lifecycle.finalLifecycleStage,
      hasAnswerableSection,
    });
  }, [
    isFullscreen,
    documentId,
    needsNameStep,
    isLoading,
    error,
    isSectionAccessLoading,
    data?.lifecycle_status,
    data?.lifecycle_permissions,
    canUpdateAssetContent,
    lifecycle.finalLifecycleStage,
    hasAnswerableSection,
  ]);

  const willAdvanceOnFinish =
    isLastSection && lifecycle.canTransition && (!!lifecycle.status?.can_advance || lifecycle.isBlockedByRequiredAnswers);

  // Sin secciones form para este paso/usuario (etapas de revisión/aprobación típicamente):
  // mismo criterio que willAdvanceOnFinish pero sin depender de isLastSection.
  const canAdvanceEmptyStep = lifecycle.canTransition && (!!lifecycle.status?.can_advance || lifecycle.isBlockedByRequiredAnswers);

  const emptyStepTitleKey = lifecycle.isBlockedByRequiredAnswers
    ? "wizard.emptyStep.blockedTitle"
    : canAdvanceEmptyStep
      ? "wizard.emptyStep.advanceTitle"
      : "wizard.emptyStep.waitingTitle";
  const emptyStepDescriptionKey = lifecycle.isBlockedByRequiredAnswers
    ? "wizard.emptyStep.blockedDescription"
    : canAdvanceEmptyStep
      ? "wizard.emptyStep.advanceDescription"
      : "wizard.emptyStep.waitingDescription";

  // Tono e ícono de la tarjeta fullscreen del paso vacío — misma prioridad que las claves de arriba.
  const emptyStepTone: WorkflowStatusTone = lifecycle.isBlockedByRequiredAnswers
    ? "amber"
    : canAdvanceEmptyStep
      ? "blue"
      : "gray";
  const emptyStepIcon: LucideIcon = lifecycle.isBlockedByRequiredAnswers
    ? AlertTriangle
    : canAdvanceEmptyStep
      ? CircleArrowRight
      : Clock;

  // Tooltip del botón deshabilitado: encabezado + una línea por sección con obligatorias
  // pendientes (title nativo, multilínea con saltos de línea — ver ia context/tooltip-guide.md
  // §4). Reusa las claves de assets:lifecycle.advanceBlockers.* que ya consume el diálogo de
  // blockers.
  const blockersDetailTooltip = [
    t("lifecycle.advanceBlockers.errorTitle", { ns: "assets" }),
    ...lifecycle.advanceBlockers.map(
      (blocker) =>
        `· ${t("lifecycle.advanceBlockers.sectionItem", {
          ns: "assets",
          section: blocker.section_name,
          count: blocker.missing_required,
        })}`,
    ),
  ].join("\n");

  const emptyStepButtonConfig = canAdvanceEmptyStep
    ? {
        label: lifecycle.completeLabel,
        tooltip: lifecycle.isBlockedByRequiredAnswers ? blockersDetailTooltip : lifecycle.completeTooltip,
        loading: lifecycle.checkMutation.isPending,
        disabled: lifecycle.isBlockedByRequiredAnswers,
        onClick: () => {
          finishAfterCompleteRef.current = true;
          lifecycle.setIsCheckDialogOpen(true);
        },
      }
    : null;

  // Último paso bloqueado por respuestas obligatorias pendientes (en esta sección u otra): el
  // botón primario se deshabilita con tooltip en vez de degradar a un simple cierre.
  const isBlockedLastSection = isLastSection && lifecycle.canTransition && lifecycle.isBlockedByRequiredAnswers;

  // El pie ya ofrece "Finalizar/Completar" (o la sección no es respondible por este usuario): no
  // duplicar el botón "Completar" en la fila de lifecycle.
  const hideComplete = willAdvanceOnFinish || (isSectionView && !canAnswerSection);

  const lifecycleActions = resolveLifecycleActionsVisibility({
    status: data?.lifecycle_status,
    permissions: data?.lifecycle_permissions,
    canTransition: canUpdateAssetContent,
    finalLifecycleStage: lifecycle.finalLifecycleStage,
    isBlockedByRequiredAnswers: lifecycle.isBlockedByRequiredAnswers,
    showRerunExternalPublish: true,
    hasEnabledExternalPublishConfig: lifecycle.hasEnabledExternalPublishConfig,
    hideComplete,
  });

  // Al usuario no le queda nada por hacer con este documento: ni respuesta/avance ni ninguna
  // otra acción de ciclo de vida. Solo aplica cuando finishOutcome dio algo (fullscreen).
  const isFinished = finishOutcome !== null && !lifecycleActions.hasAny;

  // canAnswerForm × !hasAnswerableSection × !lifecycleActions.hasAny: nadie de lo que puede
  // hacer este usuario está disponible ahora — el turno es de otro rol/grupo.
  const isWaitingForOthers = canAnswerForm && !hasAnswerableSection && !lifecycleActions.hasAny;

  const showLifecycleRow = showLifecycle && !!data?.lifecycle_status && !needsNameStep && (!isFinished || lifecycleActions.hasAny);
  const showStageBadge = showLifecycleRow && !isFinished;

  return {
    canAnswerForm,
    canAnswerSpecificSection,
    canAnswerSection,
    hasAnswerableSection,
    readOnlyReason,
    readOnlyMessage,
    finishOutcome,
    lifecycle,
    lifecycleActions,
    isFinished,
    isWaitingForOthers,
    willAdvanceOnFinish,
    canAdvanceEmptyStep,
    emptyStepTitleKey,
    emptyStepDescriptionKey,
    emptyStepButtonConfig,
    emptyStepTone,
    emptyStepIcon,
    isBlockedLastSection,
    hideComplete,
    showLifecycleRow,
    showStageBadge,
    workflowName,
    finishAfterCompleteRef,
  };
}
