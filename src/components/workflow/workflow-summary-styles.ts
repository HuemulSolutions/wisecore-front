import type { LucideIcon } from "lucide-react";
import { Edit3, Eye } from "lucide-react";
import type { WorkflowSectionTone } from "@/components/workflow/workflow-section-card-state";

// Paleta hex literal de ESTA superficie (vista de resumen del panel de workflow), tal como la
// fija la spec visual — no tokens del tema, y no soporta dark mode (ver "ia context/detail-
// surface-guide.md" §3ter, misma decisión que huemul-section-card.tsx). `tone` sigue siendo la
// fuente semántica única (workflow-section-card-state.ts): esta tabla solo la traduce a color
// para esta tarjeta en particular.

export const SUMMARY_CARD_SHELL = "rounded-[10px] border border-[#e8ecf2] bg-white";

export const SUMMARY_CIRCLE_STYLES: Record<WorkflowSectionTone, string> = {
  success: "bg-[#dcfce7] text-[#15803d]",
  danger: "bg-[#fef3c7] text-[#92400e]",
  muted: "bg-[#f1f5f9] text-[#94a3b8]",
  info: "bg-[#eff5ff] text-[#1d4ed8]",
};

/** Color del mensaje de estado — independiente de `tone`: una sección "success" con
 *  opcionales sin responder muestra el texto en gris, no en verde (ver resolveSectionCardState,
 *  campo `statusTone`). */
export const SUMMARY_STATUS_TEXT_STYLES: Record<"success" | "danger" | "muted", string> = {
  success: "text-[#15803d]",
  danger: "text-[#92400e]",
  muted: "text-[#64748b]",
};

/** Tamaño/tipografía del botón del pie de la tarjeta — compartido por el botón de acción y por
 *  cualquier botón que lo reemplace (ej. "Dejar de editar" en assets). */
export const SUMMARY_ACTION_BUTTON_CLASS = "h-[30px] rounded-[7px] px-[12px] text-[12.5px] font-semibold";

export type WorkflowSummaryActionKind = "answer" | "edit" | "view";

export const SUMMARY_ACTION_ICONS: Record<WorkflowSummaryActionKind, LucideIcon> = {
  answer: Edit3,
  edit: Edit3,
  view: Eye,
};

export const SUMMARY_ACTION_STYLES: Record<WorkflowSummaryActionKind, string> = {
  answer: "border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]",
  edit: "border-[#dfe3ea] bg-white text-[#334155] hover:bg-[#f8fafc]",
  view: "border-[#dfe3ea] bg-white text-[#334155] hover:bg-[#f8fafc]",
};
