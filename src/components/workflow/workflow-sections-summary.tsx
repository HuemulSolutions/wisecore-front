import * as React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulReviewStatusBadge } from "@/huemul/components/huemul-review-status-badge";
import { HuemulNumberedStatusCard } from "@/huemul/components/huemul-numbered-status-card";
import { FormAnswersList } from "@/components/sections/form-answers-list";
import { computeSectionStats, isSectionAnswerable } from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";
import type { ReviewStatus } from "@/types/section-execution";

export interface WorkflowSectionsSummaryProps {
  /** Secciones form del documento, en el orden del wizard (formSections). */
  sections: ContentSection[];
  /** Entrar al wizard en ese índice de paso. */
  onGoToSection: (stepIndex: number) => void;
  /** Permiso de edición para ESA sección puntual (canAnswerSpecificSection en
   *  workflow-detail-panel.tsx): cruza el permiso del documento completo, el permiso de esa
   *  sección por ciclo de vida (section_lifecycle_access) y si la sección está activa. Si da
   *  false para una sección, se oculta "Ir a la sección" solo en su tarjeta — el único modo de
   *  ver sus respuestas queda ser expandirla acá mismo. */
  canGoToSection: (section: ContentSection) => boolean;
}

/**
 * Pantalla de resumen mostrada antes de entrar al wizard de respuesta (ver
 * workflow-detail-panel.tsx): una tarjeta colapsable por sección form del documento, con su
 * estado y progreso. Al desplegarla se ven las respuestas inline (misma lista que el modo
 * lector del asset, ver asset-form-section-reader.tsx). "Ir a la sección" entra al wizard en
 * ese paso sin afectar el estado de expansión; solo se muestra si `canGoToSection` es true.
 */
export function WorkflowSectionsSummary({ sections, onGoToSection, canGoToSection }: WorkflowSectionsSummaryProps) {
  const { t } = useTranslation(["workflow", "sections"]);
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => new Set());

  const setSectionOpen = React.useCallback((id: string, open: boolean) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section, index) => {
        const { fields, questions, answeredCount } = computeSectionStats(section);
        const isInactive = !isSectionAnswerable(section);
        return (
          <HuemulNumberedStatusCard
            key={section.id}
            collapsible
            open={openIds.has(section.id)}
            onOpenChange={(open) => setSectionOpen(section.id, open)}
            number={index + 1}
            title={section.section_name ?? ""}
            tone={section.review_status === "finished" ? "success" : "warning"}
            className={isInactive ? "opacity-70" : undefined}
            headerExtra={
              <>
                <HuemulReviewStatusBadge status={section.review_status as ReviewStatus | null} sectionType="form" />
                {isInactive && (
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    {t("sections:form.fill.sectionInactive")}
                  </span>
                )}
              </>
            }
            subtitle={t("sections:form.fill.answeredCount", { answered: answeredCount, total: questions.length })}
            actions={
              canGoToSection(section) ? (
                <HuemulButton
                  size="xs"
                  icon={ArrowRight}
                  iconPosition="right"
                  label={t("wizard.summary.goToSection")}
                  onClick={() => onGoToSection(index)}
                />
              ) : undefined
            }
          >
            <FormAnswersList fields={fields} emptyLabel={t("wizard.summary.noAnswers")} />
          </HuemulNumberedStatusCard>
        );
      })}
    </div>
  );
}
