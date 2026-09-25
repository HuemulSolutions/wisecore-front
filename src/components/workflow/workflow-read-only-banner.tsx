import { Clock, Info, Loader, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowReadOnlyReason } from "@/components/workflow/hooks/useWorkflowPanelGating";

/** Motivo del aviso: los de `readOnlyReason` más «esperando a otros» (resumen con el turno de otro rol). */
export type WorkflowReadOnlyBannerReason = NonNullable<WorkflowReadOnlyReason> | "waiting";

export interface WorkflowReadOnlyBannerProps {
  /** Texto ya resuelto (ver readOnlyReason / stageNotice en useWorkflowPanelGating). Sin mensaje, no renderiza nada. */
  message: string | null | undefined;
  reason: WorkflowReadOnlyBannerReason;
}

interface ReasonStyle {
  box: string;
  text: string;
  iconColor: string;
  Icon: LucideIcon;
  spin?: boolean;
}

const NEUTRAL = { box: "border-[#e2e8f0] bg-[#f1f5f9]", text: "text-[#334155]", iconColor: "text-[#64748b]" };

// Colores por motivo (hex fijos, como el resto del panel). stage/permission/section comparten el
// look neutro con candado; sectionInactive cambia a «i»; externalElaboration es azul con spinner;
// waiting es ámbar porque el usuario espera a otro rol.
const REASON_STYLES: Record<WorkflowReadOnlyBannerReason, ReasonStyle> = {
  externalElaboration: {
    box: "border-[#dbeafe] bg-[#eff5ff]",
    text: "text-[#1e40af]",
    iconColor: "text-[#2563eb]",
    Icon: Loader,
    spin: true,
  },
  permission: { ...NEUTRAL, Icon: Lock },
  stage: { ...NEUTRAL, Icon: Lock },
  section: { ...NEUTRAL, Icon: Lock },
  sectionInactive: { ...NEUTRAL, Icon: Info },
  waiting: { box: "border-[#fde68a] bg-[#fffbeb]", text: "text-[#92400e]", iconColor: "text-[#d97706]", Icon: Clock },
};

/** Aviso de solo lectura del cuerpo del panel de workflow: ícono + motivo, con los colores del
 *  motivo. El texto lo resuelve useWorkflowPanelGating; acá solo se pinta. Sin margen propio: el
 *  gutter y el espaciado vertical los pone el wrapper de cada rama en workflow-detail-panel.tsx
 *  (o WorkflowSectionView, que lo ubica entre el navegador de secciones y el nombre de sección),
 *  para que el aviso alinee con el contenido de la vista en la que aparece. */
export function WorkflowReadOnlyBanner({ message, reason }: WorkflowReadOnlyBannerProps) {
  if (!message) return null;
  const { box, text, iconColor, Icon, spin } = REASON_STYLES[reason];
  return (
    <div className={cn("flex items-start gap-[10px] rounded-[8px] border px-[12px] py-[10px]", box)}>
      <Icon aria-hidden strokeWidth={2} className={cn("mt-[1px] h-4 w-4 shrink-0", iconColor, spin && "animate-spin")} />
      <p className={cn("text-[12.5px] leading-[1.5] [text-wrap:pretty]", text)}>{message}</p>
    </div>
  );
}
