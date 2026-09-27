import { useTranslation } from "react-i18next";
import { WorkflowSummarySectionCard } from "@/components/workflow/workflow-summary-section-card";
import type { ContentSection } from "@/types/assets";

export interface WorkflowSectionsSummaryProps {
  /** Secciones form del documento, en el orden de la vista 2 (formSections). */
  sections: ContentSection[];
  /** data.content.length — para la línea final "se muestran X de Y secciones". */
  totalSections: number;
  /** canAnswerSpecificSection(section) del panel, para cada tarjeta. */
  sectionCanAnswer: (section: ContentSection) => boolean;
  /** Entra a la vista 2 en ese índice (Responder/Editar/Ver). */
  onOpenSection: (index: number) => void;
  /** Ids de sección expandidas — vive en el panel para sobrevivir el ir-y-volver a la vista 2
   *  (este componente se desmonta al cambiar de vista). Vacío = todas colapsadas (default). */
  expandedSectionIds: Set<string>;
  onToggleSection: (sectionId: string, open: boolean) => void;
  onCollapseAll: () => void;
  onExpandAll: (sectionIds: string[]) => void;
}

/**
 * Vista 1 (resumen) del panel de detalle de workflow: una tarjeta colapsable por sección form
 * del documento, con su estado y sus respuestas — ver workflow-summary-section-card.tsx. El
 * pie de cada tarjeta (estado + acción) queda visible aunque esté colapsada.
 */
export function WorkflowSectionsSummary({
  sections,
  totalSections,
  sectionCanAnswer,
  onOpenSection,
  expandedSectionIds,
  onToggleSection,
  onCollapseAll,
  onExpandAll,
}: WorkflowSectionsSummaryProps) {
  const { t } = useTranslation(["workflow", "assets"]);
  const hasOpenCard = sections.some((s) => expandedSectionIds.has(s.id));

  return (
    <div className="flex flex-col gap-[10px] p-[14px_16px_18px]">
      <div className="flex items-center justify-between px-[4px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
          {t("panel.sectionsHeading")}
        </p>
        <button
          type="button"
          className="text-[12px] font-medium text-[#1d4ed8] hover:underline"
          onClick={() => (hasOpenCard ? onCollapseAll() : onExpandAll(sections.map((s) => s.id)))}
        >
          {hasOpenCard ? t("assets:content.collapseAllSections") : t("assets:content.expandAllSections")}
        </button>
      </div>

      {sections.map((section, index) => (
        <WorkflowSummarySectionCard
          key={section.id}
          section={section}
          index={index + 1}
          canAnswer={sectionCanAnswer(section)}
          open={expandedSectionIds.has(section.id)}
          onOpenChange={(open) => onToggleSection(section.id, open)}
          onOpenSection={() => onOpenSection(index)}
        />
      ))}

      {totalSections > sections.length && (
        <p className="px-[4px] pt-0 text-[12px] text-[#64748b]">
          {t("panel.otherSectionsNotice", { shown: sections.length, total: totalSections })}
        </p>
      )}
    </div>
  );
}
