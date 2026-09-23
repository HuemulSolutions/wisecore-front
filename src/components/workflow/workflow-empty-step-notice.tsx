import { Check, CheckCircle2, Eye, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { WorkflowStatusCard, type WorkflowStatusTone } from "@/components/workflow/workflow-status-card";

// Mismos tokens de superficie que el resto del panel.
const PANEL_SURFACE = "rounded-lg border border-border bg-card p-4 shadow-card";

export interface WorkflowEmptyStepAction {
  label: string;
  tooltip?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface WorkflowEmptyStepNoticeProps {
  isFullscreen: boolean;
  /** Tono e ícono de la tarjeta fullscreen (los resuelve useWorkflowPanelGating). El panel lateral conserva su estilo. */
  tone: WorkflowStatusTone;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Acción de ciclo de vida (ej. "Completar") cuando el usuario puede avanzar sin responder nada. */
  primaryAction?: WorkflowEmptyStepAction | null;
  /** "Ver las respuestas" — vuelve al resumen. */
  viewAnswersAction?: WorkflowEmptyStepAction | null;
}

/**
 * Bloque "nada por hacer ahora": cubre tanto "sin secciones respondibles por este usuario en
 * esta etapa" (isWaitingForOthers/canAdvanceEmptyStep/isBlockedByRequiredAnswers, ver
 * useWorkflowPanelGating) como el caso nuevo "este workflow no tiene formularios" (sin acciones).
 */
export function WorkflowEmptyStepNotice({
  isFullscreen,
  tone,
  icon,
  title,
  description,
  primaryAction,
  viewAnswersAction,
}: WorkflowEmptyStepNoticeProps) {
  if (isFullscreen) {
    return (
      <WorkflowStatusCard
        icon={icon}
        tone={tone}
        title={title}
        description={description}
        primaryAction={primaryAction ? { ...primaryAction, icon: Check } : null}
        linkAction={viewAnswersAction}
      />
    );
  }

  const actions =
    primaryAction || viewAnswersAction ? (
      <>
        {primaryAction && (
          <HuemulButton
            size="sm"
            icon={Check}
            iconPosition="left"
            {...primaryAction}
          />
        )}
        {viewAnswersAction && (
          <HuemulButton
            variant="outline"
            size="sm"
            icon={Eye}
            iconPosition="left"
            {...viewAnswersAction}
          />
        )}
      </>
    ) : null;

  return (
    <div className={cn(PANEL_SURFACE, "flex flex-col items-center gap-2 py-8 text-center")}>
      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      {actions && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
