import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { toneDot } from "@/lib/lifecycle-colors";
import { resolveSectionCardState, WORKFLOW_SECTION_TONE_HUE } from "@/components/workflow/workflow-section-card-state";
import type { ContentSection } from "@/types/assets";

export interface WorkflowSectionPillsProps {
  sections: ContentSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** canAnswerSpecificSection(section) del panel. */
  sectionCanAnswer: (section: ContentSection) => boolean;
  /** Gate de isFormSaving — mismo criterio que «◂ Resumen»/«◂ Anterior». */
  disabled?: boolean;
}

/**
 * Índice de secciones de la vista 2: una píldora por sección, con el mismo color de punto que
 * el círculo de su tarjeta en el resumen (resolveSectionCardState es la fuente única de ambos).
 * Sin consumidores con una sola sección: no vale la pena la franja.
 */
export function WorkflowSectionPills({ sections, activeIndex, onSelect, sectionCanAnswer, disabled }: WorkflowSectionPillsProps) {
  const { t } = useTranslation("workflow");
  if (sections.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label={t("section.indexLabel")}
      className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
    >
      {sections.map((section, index) => {
        const isActive = index === activeIndex;
        const tone = resolveSectionCardState(section, sectionCanAnswer(section)).tone;
        // Sobre el chip activo (azul sólido) un punto de estado azul no se vería: va en blanco.
        const dotClass = isActive ? "bg-primary-foreground" : toneDot(WORKFLOW_SECTION_TONE_HUE[tone]);
        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "step" : undefined}
            disabled={disabled}
            title={!isActive ? (section.section_name ?? undefined) : undefined}
            onClick={() => onSelect(index)}
            className={cn(
              "flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              isActive
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-card text-muted-foreground hover:bg-accent/40 hover:text-foreground",
            )}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
            {isActive ? (
              <span className="max-w-[14rem] truncate">
                {index + 1} · {section.section_name ?? ""}
              </span>
            ) : (
              <span>{index + 1}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
