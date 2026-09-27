import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulLifecycleActions } from "@/huemul/components/huemul-lifecycle-actions";
import { HuemulLifecycleStageBadge } from "@/huemul/components/huemul-lifecycle-stage-badge";
import type { useLifecycleActions } from "@/hooks/useLifecycleActions";
import type { LifecycleStatus } from "@/types/assets";

export interface WorkflowPanelLifecycleRowProps {
  isFullscreen: boolean;
  lifecycle: ReturnType<typeof useLifecycleActions>;
  hideComplete: boolean;
  isFinished: boolean;
  onContinueLater?: () => void;
  /** Badge de etapa · grupo — antes vivía en el header del panel (workflow-panel-header.tsx). */
  showStageBadge: boolean;
  lifecycleStatus: LifecycleStatus | undefined;
}

/** Fila de acciones de ciclo de vida del panel: badge de etapa a la izquierda, acciones
 *  (Completar/Devolver/Publicar/Archivar…) + «Continuar más tarde» a la derecha. La sección
 *  actual, que antes vivía acá, ahora se ve en el header compacto de la vista 2
 *  (workflow-section-view.tsx). */
export function WorkflowPanelLifecycleRow({
  isFullscreen,
  lifecycle,
  hideComplete,
  isFinished,
  onContinueLater,
  showStageBadge,
  lifecycleStatus,
}: WorkflowPanelLifecycleRowProps) {
  const { t } = useTranslation("workflow");

  return (
    // La franja (fondo + borde) va a todo el ancho; el contenido se centra en fullscreen con la
    // misma columna que el header y el cuerpo (mx-auto max-w-3xl).
    <div className={cn("shrink-0 border-b border-divider bg-card px-4 py-2", isFullscreen && "sm:px-8")}>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2",
          isFullscreen && "mx-auto w-full max-w-3xl",
        )}
      >
        <div className="flex items-center gap-2">
          {showStageBadge && lifecycleStatus && (
            <HuemulLifecycleStageBadge
              status={lifecycleStatus}
              className="h-[26px] rounded-[13px] px-[10px] text-[12px] font-semibold"
            />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onContinueLater && !isFinished && (
            <HuemulButton
              variant="outline"
              size="sm"
              icon={Clock}
              iconPosition="left"
              iconClassName="h-3.5 w-3.5"
              label={t("fill.continueLater")}
              className="h-7 px-2.5 text-xs font-medium"
              onClick={onContinueLater}
            />
          )}
          <HuemulLifecycleActions controller={lifecycle} variant="row" showRerunExternalPublish hideComplete={hideComplete} />
        </div>
      </div>
    </div>
  );
}
