import * as React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Eye } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulReviewStatusBadge } from "@/huemul/components/huemul-review-status-badge";
import { Card } from "@/components/ui/card";
import { WorkflowProgressBar } from "@/components/workflow/workflow-progress-bar";
import { WorkflowSectionAnswersSheet } from "@/components/workflow/workflow-section-answers-sheet";
import { computeSectionStats } from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";
import type { ReviewStatus } from "@/types/section-execution";

export interface WorkflowSectionsSummaryProps {
  /** Secciones form del documento, en el orden del wizard (formSections). */
  sections: ContentSection[];
  /** Entrar al wizard en ese índice de paso. */
  onGoToSection: (stepIndex: number) => void;
}

// Paleta por estado — misma señal que HuemulReviewStatusBadge (review_status === 'finished'),
// para que la tarjeta nunca contradiga al badge. Sin componente dedicado: es la única tarjeta
// del repo que combina acento lateral + círculo numerado; si aparece un segundo consumidor,
// promover a src/huemul/components/.
const STATUS_STYLES = {
  answered: { accentClass: "bg-emerald-500", circleClass: "bg-emerald-100 text-emerald-700" },
  pending: { accentClass: "bg-amber-400", circleClass: "bg-amber-100 text-amber-700" },
} as const;

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
        {sections.map((section, index) => {
          const { questions, answeredCount } = computeSectionStats(section);
          const answered = section.review_status === "finished";
          const styles = STATUS_STYLES[answered ? "answered" : "pending"];
          const pct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

          return (
            <Card key={section.id} className="relative flex-row items-start gap-3 overflow-hidden p-4">
              <div className={`absolute inset-y-0 left-0 w-1 ${styles.accentClass}`} />
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${styles.circleClass}`}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground">{section.section_name}</p>
                  <HuemulReviewStatusBadge status={section.review_status as ReviewStatus | null} sectionType="form" />
                </div>
                <WorkflowProgressBar percentage={pct} trackClassName="w-24" showLabel={false} />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
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
              </div>
            </Card>
          );
        })}
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
