import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulAnswersStatusBadge } from "@/huemul/components/huemul-answers-status-badge";
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text";
import { describeSectionDependency } from "@/components/workflow/describe-section-dependency";
import { computeSectionStats, isSectionAnswerable } from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";
import type { FormFieldValue } from "@/types/sections/core";

export interface WorkflowSectionHeadingProps {
  section: ContentSection;
  /** Campos de TODAS las secciones del documento (target de depends_on). */
  allFields: FormFieldValue[];
  /** canAnswerSpecificSection(section) del panel. */
  canAnswer: boolean;
  /** Vuelve al resumen (vista 1) — chevron a la izquierda del nombre. */
  onBack: () => void;
  /** Gate de isFormSaving del panel. */
  backDisabled?: boolean;
}

/**
 * Encabezado del cuerpo de la vista 2: chevron de volver al resumen + nombre + badge de estado,
 * línea de meta (contadores) y, si la sección está inactiva por su depends_on, el aviso con la
 * condición redactada.
 */
export function WorkflowSectionHeading({ section, allFields, canAnswer, onBack, backDisabled }: WorkflowSectionHeadingProps) {
  const { t } = useTranslation(["workflow", "sections"]);
  const { answeredCount, questions, missingRequired } = computeSectionStats(section);
  const isActive = isSectionAnswerable(section);
  const isEditable = isActive && canAnswer;

  const dependency = !isActive ? describeSectionDependency(section, allFields, t) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5">
        <HuemulButton
          variant="ghost"
          size="xs"
          icon={ChevronLeft}
          tooltip={t("workflow:summary.backLabel")}
          aria-label={t("workflow:summary.backLabel")}
          disabled={backDisabled}
          onClick={onBack}
        />
        <HuemulTruncatedText
          text={section.section_name ?? ""}
          lines={1}
          className="min-w-0 flex-1 text-base font-semibold text-foreground"
        />
        <HuemulAnswersStatusBadge status={section.answers_status} />
      </div>
      <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
        <span>
          {isActive
            ? t("sections:form.fill.answeredCount", { answered: answeredCount, total: questions.length })
            : t("workflow:section.questionsCount", { count: questions.length })}
        </span>
        {!canAnswer && isActive && (
          <>
            <span aria-hidden>·</span>
            <span>{t("workflow:section.readOnlyStep")}</span>
          </>
        )}
        {isEditable && missingRequired > 0 && (
          <>
            <span aria-hidden>·</span>
            <span className="font-semibold text-destructive">
              {t("workflow:wizard.summary.missingRequired", { count: missingRequired })}
            </span>
          </>
        )}
      </p>
      {dependency && (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs leading-normal text-muted-foreground">
          {t("workflow:section.inactiveNotice", { condition: dependency })}
        </p>
      )}
    </div>
  );
}
