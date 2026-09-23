import type { LucideIcon } from "lucide-react";
import { Edit3, Eye } from "lucide-react";
import type { WorkflowSectionTone } from "@/components/workflow/workflow-section-card-state";

// Paleta hex literal de ESTA superficie (vista de resumen del panel de workflow), tal como la
// fija la spec visual — no tokens del tema, y no soporta dark mode (ver "ia context/detail-
// surface-guide.md" §3ter, misma decisión que huemul-section-card.tsx). `tone` sigue siendo la
// fuente semántica única (workflow-section-card-state.ts): esta tabla solo la traduce a color
// para esta tarjeta en particular. Las píldoras de la vista 2 (workflow-section-pills.tsx) NO
// consumen esta tabla — siguen con toneDot() de lib/lifecycle-colors.ts, sin cambios.

export const SUMMARY_CARD_SHELL = "rounded-[10px] border border-[#e8ecf2] bg-white";

export const SUMMARY_CIRCLE_STYLES: Record<WorkflowSectionTone, string> = {
  success: "bg-[#dcfce7] text-[#15803d]",
  danger: "bg-[#fee2e2] text-[#b91c1c]",
  muted: "bg-[#f1f5f9] text-[#94a3b8]",
  info: "bg-[#eff5ff] text-[#1d4ed8]",
};

/** Color del texto de estado del pie — independiente de `tone`: una sección "success" con
 *  opcionales sin responder muestra el texto en gris, no en verde (ver resolveSectionCardState,
 *  campo `footerTone`). */
export const SUMMARY_FOOTER_TEXT_STYLES: Record<"success" | "danger" | "muted", string> = {
  success: "text-[#15803d]",
  danger: "text-[#b91c1c]",
  muted: "text-[#64748b]",
};

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
