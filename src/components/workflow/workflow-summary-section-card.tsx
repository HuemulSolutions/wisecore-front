import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HuemulAnswersStatusBadge } from "@/huemul/components/huemul-answers-status-badge";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { WorkflowSummaryAnswers } from "@/components/workflow/workflow-summary-answers";
import { computeSectionStats } from "@/components/workflow/workflow-section-stats";
import { resolveSectionCardState } from "@/components/workflow/workflow-section-card-state";
import {
  SUMMARY_ACTION_ICONS,
  SUMMARY_ACTION_STYLES,
  SUMMARY_CARD_SHELL,
  SUMMARY_CIRCLE_STYLES,
  SUMMARY_FOOTER_TEXT_STYLES,
} from "@/components/workflow/workflow-summary-styles";
import { cn } from "@/lib/utils";
import type { ContentSection } from "@/types/assets";

export interface WorkflowSummarySectionCardProps {
  section: ContentSection;
  /** Posición 1-based en formSections, para el círculo. */
  index: number;
  /** canAnswerSpecificSection(section) del panel. */
  canAnswer: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Abre la vista 2 en esta sección (Responder/Editar/Ver). */
  onOpenSection: () => void;
}

/**
 * Una tarjeta del resumen (vista 1, ver workflow-sections-summary.tsx): estado visual y pie
 * (siempre visibles, incluso colapsada) resueltos por resolveSectionCardState — misma fuente
 * que pinta el punto de la píldora de la vista 2, para que nunca diverjan.
 *
 * Dibuja su propio Collapsible en vez de HuemulNumberedStatusCard/HuemulSectionCard: la spec
 * pide un pie INSET (ml-[35px], sin fondo, borde superior fino) y un cuerpo sin borde superior,
 * y ambos componentes tienen esos slots full-bleed y son consumidos tal cual por otra superficie
 * (asset-form-section-reader.tsx / assets-types) que no debe cambiar.
 */
export function WorkflowSummarySectionCard({
  section,
  index,
  canAnswer,
  open,
  onOpenChange,
  onOpenSection,
}: WorkflowSummarySectionCardProps) {
  const { t } = useTranslation(["workflow", "sections"]);
  const { questions } = computeSectionStats(section);
  const state = resolveSectionCardState(section, canAnswer);
  const ActionIcon = SUMMARY_ACTION_ICONS[state.action.kind];

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
              {state.showCheckIcon ? <Check className="h-[13px] w-[13px]" /> : index}
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
              <p className="text-[12px] text-[#64748b]">
                {t("sections:form.fill.answeredCount", {
                  answered: state.answeredCount,
                  total: state.totalQuestions,
                })}
              </p>
            </div>
          </CollapsibleTrigger>
          <CollapsibleTrigger
            className="group mt-[2px] flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[#94a3b8]"
            title={t(open ? "panel.collapseSection" : "panel.expandSection")}
            aria-label={t(open ? "panel.collapseSection" : "panel.expandSection")}
          >
            <ChevronDown className="h-[14px] w-[14px] transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <WorkflowSummaryAnswers questions={questions} emptyLabel={t("wizard.summary.noAnswers")} />
        </CollapsibleContent>

        <div className="ml-[35px] flex flex-wrap items-center justify-between gap-[10px] border-t border-[#eef1f6] pt-[10px]">
          <p className={cn("text-[12px] font-medium", SUMMARY_FOOTER_TEXT_STYLES[state.footerTone])}>
            {t(state.footerTextKey, state.footerTextParams)}
          </p>
          <HuemulButton
            variant="outline"
            size="sm"
            icon={ActionIcon}
            iconPosition="right"
            iconClassName="h-[13px] w-[13px]"
            label={t(state.action.labelKey)}
            onClick={onOpenSection}
            className={cn(
              "h-[30px] rounded-[7px] px-[12px] text-[12.5px] font-semibold",
              SUMMARY_ACTION_STYLES[state.action.kind],
            )}
          />
        </div>
      </div>
    </Collapsible>
  );
}
