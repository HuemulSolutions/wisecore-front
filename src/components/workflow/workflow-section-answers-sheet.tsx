import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowRight, Copy, Eye } from "lucide-react";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulReviewStatusBadge } from "@/huemul/components/huemul-review-status-badge";
import { SectionFieldSeparator } from "@/components/sections/section-field-separator";
import { FormFieldAnswerValue } from "@/components/sections/form-field-answer-value";
import { QUESTION_TYPE, isFieldVisible } from "@/components/sections/question-type-meta";
import { computeSectionStats, serializeSectionAnswers } from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";
import type { ReviewStatus } from "@/types/section-execution";

export interface WorkflowSectionAnswersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sección a mostrar. Puede ser null mientras se cierra el sheet (evita parpadeo de contenido vacío). */
  section: ContentSection | null;
  /** Índice de paso de la sección, para el label "Paso N" y para saltar al wizard. */
  stepIndex: number | null;
  onGoToSection: (stepIndex: number) => void;
}

/**
 * Sheet de solo lectura con las respuestas de una sección del formulario de workflow —
 * se abre desde "Ver respuestas" en workflow-sections-summary.tsx. Incluye un botón para
 * copiar todas las respuestas y otro para saltar directo al wizard en esa sección.
 */
export function WorkflowSectionAnswersSheet({
  open,
  onOpenChange,
  section,
  stepIndex,
  onGoToSection,
}: WorkflowSectionAnswersSheetProps) {
  const { t } = useTranslation(["workflow", "sections", "assets"]);

  const { fields, questions, answeredCount } = section
    ? computeSectionStats(section)
    : { fields: [], questions: [], answeredCount: 0, missingRequired: 0 };

  const handleCopy = React.useCallback(async () => {
    if (!section) return;
    try {
      await navigator.clipboard.writeText(serializeSectionAnswers(section, t));
      toast.success(t("assets:section.contentCopied"));
    } catch {
      toast.error(t("assets:section.copyFailed"));
    }
  }, [section, t]);

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={section?.section_name ?? ""}
      description={
        stepIndex !== null
          ? `${t("wizard.summary.stepLabel", { number: stepIndex + 1 })} · ${t("wizard.summary.answeredCount", { answered: answeredCount, total: questions.length })}`
          : undefined
      }
      icon={Eye}
      side="right"
      maxWidth="sm:max-w-lg"
      headerExtra={
        <HuemulReviewStatusBadge status={section?.review_status as ReviewStatus | null} sectionType="form" />
      }
      extraActions={[
        {
          label: t("wizard.summary.copy"),
          icon: Copy,
          position: "header",
          onClick: handleCopy,
        },
      ]}
      showCancelButton={false}
      saveAction={
        stepIndex !== null
          ? {
              label: t("wizard.summary.goToSection"),
              icon: ArrowRight,
              onClick: () => onGoToSection(stepIndex),
            }
          : undefined
      }
    >
      {questions.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">{t("wizard.summary.noAnswers")}</p>
      ) : (
        <div className="space-y-4">
          {fields
            .filter(isFieldVisible)
            .map((field, fieldIndex) =>
              field.question_type === QUESTION_TYPE.label ? (
                <SectionFieldSeparator key={field.id || fieldIndex} name={field.field_name} />
              ) : (
                <div key={field.id || fieldIndex} className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">
                    {field.field_name}
                    {field.required && <span className="text-destructive"> *</span>}
                  </p>
                  <FormFieldAnswerValue field={field} />
                </div>
              ),
            )}
        </div>
      )}
    </HuemulSheet>
  );
}
