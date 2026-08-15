import * as React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Eye } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulReviewStatusBadge } from "@/huemul/components/huemul-review-status-badge";
import { HuemulNumberedStatusCard } from "@/huemul/components/huemul-numbered-status-card";
import { WorkflowSectionAnswersSheet } from "@/components/workflow/workflow-section-answers-sheet";
import type { ContentSection } from "@/types/assets";
import type { ReviewStatus } from "@/types/section-execution";

export interface WorkflowSectionsSummaryProps {
  /** Secciones form del documento, en el orden del wizard (formSections). */
  sections: ContentSection[];
  /** Entrar al wizard en ese índice de paso. */
  onGoToSection: (stepIndex: number) => void;
}

/**
 * Pantalla de resumen mostrada antes de entrar al wizard de respuesta (ver
 * workflow-detail-panel.tsx): una tarjeta por sección form del documento, con su estado,
 * progreso y accesos directos ("Ver respuestas" abre un sheet de solo lectura; "Ir a la
 * sección" entra al wizard en ese paso).
 */
export function WorkflowSectionsSummary({ sections, onGoToSection }: WorkflowSectionsSummaryProps) {
  const { t } = useTranslation("workflow");
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const openSection = openIndex !== null ? sections[openIndex] ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {sections.map((section, index) => (
          <HuemulNumberedStatusCard
            key={section.id}
            number={index + 1}
            title={section.section_name ?? ""}
            tone={section.review_status === "finished" ? "success" : "warning"}
            headerExtra={
              <HuemulReviewStatusBadge status={section.review_status as ReviewStatus | null} sectionType="form" />
            }
            actions={
              <>
                <HuemulButton
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  label={t("wizard.summary.viewAnswers")}
                  onClick={() => setOpenIndex(index)}
                />
                <HuemulButton
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  label={t("wizard.summary.goToSection")}
                  onClick={() => onGoToSection(index)}
                />
              </>
            }
          />
        ))}
      </div>

      <WorkflowSectionAnswersSheet
        open={openIndex !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
        section={openSection}
        stepIndex={openIndex}
        onGoToSection={onGoToSection}
      />
    </div>
  );
}
