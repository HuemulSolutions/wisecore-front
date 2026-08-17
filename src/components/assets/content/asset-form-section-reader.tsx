import * as React from "react";
import { useTranslation } from "react-i18next";
import { HuemulNumberedStatusCard } from "@/huemul/components/huemul-numbered-status-card";
import { HuemulReviewStatusBadge } from "@/huemul/components/huemul-review-status-badge";
import { FormAnswersList } from "@/components/sections/form-answers-list";
import { computeSectionStats } from "@/components/workflow/workflow-section-stats";
import type { ContentSection } from "@/types/assets";
import type { ReviewStatus } from "@/types/section-execution";

interface AssetFormSectionReaderProps {
  section: Pick<ContentSection, "form_fields" | "review_status">;
  sectionName?: string;
  /** Posición 0-based de la sección en el documento (mismo índice que el tab de contenido). */
  sectionIndex: number;
}

/**
 * Vista de solo lectura de una sección form en el tab de contenido del asset — misma tarjeta
 * numerada + colapsable usada en el resumen de workflow (workflow-sections-summary.tsx), pero
 * expandida inline en vez de abrir un sheet. Reemplaza al stack plano de AssetFormSection con
 * canInteract={false} cuando la sección está fuera de modo editor (ver assets-section.tsx).
 */
export function AssetFormSectionReader({ section, sectionName, sectionIndex }: AssetFormSectionReaderProps) {
  const { t } = useTranslation("sections");
  // Vista de solo lectura: el contenido arranca visible; el chevron sigue permitiendo colapsar.
  const [open, setOpen] = React.useState(true);

  const { fields, questions, answeredCount } = computeSectionStats(section as ContentSection);

  return (
    <div className="not-prose py-3 pr-2 w-full">
      <HuemulNumberedStatusCard
        collapsible
        open={open}
        onOpenChange={setOpen}
        number={sectionIndex + 1}
        title={sectionName ?? ""}
        tone={section.review_status === "finished" ? "success" : "warning"}
        headerExtra={<HuemulReviewStatusBadge status={section.review_status as ReviewStatus | null} sectionType="form" />}
        subtitle={t("form.fill.answeredCount", { answered: answeredCount, total: questions.length })}
      >
        <FormAnswersList fields={fields} emptyLabel={t("form.fill.emptyForm")} />
      </HuemulNumberedStatusCard>
    </div>
  );
}
