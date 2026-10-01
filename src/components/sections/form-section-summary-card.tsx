import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HuemulAnswersStatusBadge } from "@/huemul/components/huemul-answers-status-badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { FormSectionSummaryAnswers } from "@/components/sections/form-section-summary-answers";
import { computeSectionStats } from "@/components/workflow/workflow-section-stats";
import { resolveSectionCardState } from "@/components/workflow/workflow-section-card-state";
import {
  SUMMARY_ACTION_BUTTON_CLASS,
  SUMMARY_ACTION_ICONS,
  SUMMARY_ACTION_STYLES,
  SUMMARY_CARD_SHELL,
  SUMMARY_CIRCLE_STYLES,
  SUMMARY_STATUS_TEXT_STYLES,
} from "@/components/workflow/workflow-summary-styles";
import { cn } from "@/lib/utils";
import type { ContentSection } from "@/types/assets";

/** Subconjunto de ContentSection que la tarjeta lee — permite pasar también la ejecución de sección del asset. */
export type FormSectionSummarySource = Pick<
  ContentSection,
  | "form_fields"
  | "answers_status"
  | "missing_required"
  | "is_visible"
  | "can_answer"
  | "can_edit"
  | "section_name"
>;

export interface FormSectionSummaryCardProps {
  section: FormSectionSummarySource;
  /** Posición 1-based de la sección, para el círculo. */
  index: number;
  /** Permiso efectivo de responder la sección (canAnswerSpecificSection en workflow). */
  canAnswer: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Acción del botón del pie (Responder/Editar). Sin permiso para responder no hay botón: la sección solo se ve en el resumen. */
  onAction: () => void;
  /** Reemplaza el botón del pie (ej. "Dejar de editar" mientras se responde inline). */
  footerAction?: ReactNode;
  /** Botones extra en el header, junto al chevron (ej. historial). */
  headerActions?: ReactNode;
  /** Si viene, reemplaza la lista de respuestas del cuerpo (ej. formulario rellenable inline). */
  children?: ReactNode;
}

/**
 * Tarjeta de resumen de una sección form — única para el panel de workflow
 * (workflow-sections-summary.tsx) y el modo lector del asset (asset-form-section-reader.tsx):
 * estado visual y pie (siempre visibles, incluso colapsada) resueltos por resolveSectionCardState
 * — fuente única del estado de la sección.
 *
 * Dibuja su propio Collapsible en vez de HuemulNumberedStatusCard/HuemulSectionCard: la spec
 * pide un pie INSET (ml-[35px], sin fondo, borde superior fino) y un cuerpo sin borde superior,
 * y ambos componentes tienen esos slots full-bleed y los consumen otras superficies
 * (assets-types) que no deben cambiar.
 */
export function FormSectionSummaryCard({
  section,
  index,
  canAnswer,
  open,
  onOpenChange,
  onAction,
  footerAction,
  headerActions,
  children,
}: FormSectionSummaryCardProps) {
  const { t } = useTranslation(["workflow", "sections"]);
  const full = section as ContentSection;
  const { fields } = computeSectionStats(full);
  const state = resolveSectionCardState(full, canAnswer);
  const ActionIcon = SUMMARY_ACTION_ICONS[state.action.kind];
  // Sin permiso para responder no hay botón (solo se ve el resumen): el pie no se dibuja vacío.
  const footerContent =
    footerAction ??
    (state.action.kind === "view" ? null : (
      <HuemulButton
        variant="outline"
        size="sm"
        icon={ActionIcon}
        iconPosition="right"
        iconClassName="h-[13px] w-[13px]"
        label={t(state.action.labelKey)}
        onClick={onAction}
        className={cn(SUMMARY_ACTION_BUTTON_CLASS, SUMMARY_ACTION_STYLES[state.action.kind])}
      />
    ));

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className={cn(SUMMARY_CARD_SHELL, "flex flex-col gap-[12px] p-[14px_16px]")}>
        <div className="flex items-start gap-[11px]">
          <CollapsibleTrigger className="flex min-w-0 flex-1 items-start gap-[11px] text-left">
            <div
              className={cn(
                "flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold",
                SUMMARY_CIRCLE_STYLES[state.tone],
              )}
            >
              {index}
            </div>
            <div className="min-w-0 flex-1 space-y-[2px]">
              <div className="flex flex-wrap items-center gap-[8px]">
                <p
                  className={cn(
                    "text-[14px] font-semibold",
                    state.isInactive ? "text-[#64748b]" : "text-[#0f172a]",
                  )}
                >
                  {section.section_name ?? ""}
                </p>
                <HuemulAnswersStatusBadge
                  status={section.answers_status}
                  className="h-[22px] rounded-[11px] px-[9px] py-0 text-[11.5px] font-semibold"
                />
              </div>
              <p className={cn("text-[12px] font-medium", SUMMARY_STATUS_TEXT_STYLES[state.statusTone])}>
                {state.statusParts.map((part) => t(part.key, part.params)).join(" · ")}
              </p>
            </div>
          </CollapsibleTrigger>
          {headerActions}
          <CollapsibleTrigger
            className="group mt-[2px] flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[#94a3b8]"
            title={t(open ? "panel.collapseSection" : "panel.expandSection")}
            aria-label={t(open ? "panel.collapseSection" : "panel.expandSection")}
          >
            <ChevronDown className="h-[14px] w-[14px] transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          {children ?? <FormSectionSummaryAnswers fields={fields} emptyLabel={t("sections:form.fill.emptyForm")} />}
        </CollapsibleContent>

        {footerContent && (
          <div className="ml-[35px] flex justify-end border-t border-[#eef1f6] pt-[10px]">{footerContent}</div>
        )}
      </div>
    </Collapsible>
  );
}
