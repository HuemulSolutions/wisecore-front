import * as React from "react";
import { useTranslation } from "react-i18next";
import { History } from "lucide-react";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulReviewStatusBadge } from "@/huemul/components/huemul-review-status-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { SectionFieldSeparator } from "@/components/sections/section-field-separator";
import { FormFieldAnswerValue } from "@/components/sections/form-field-answer-value";
import { QUESTION_TYPE, hasAnswer, isFieldAnswerable, isFieldVisible } from "@/components/sections/question-type-meta";
import type { ContentSection } from "@/types/assets";
import type { ReviewStatus } from "@/types/section-execution";

export interface WorkflowPreviousAnswersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Secciones form ya completadas, en el orden del wizard (formSections.slice(0, step)). Memoizar en el padre. */
  sections: ContentSection[];
  /** Navegación directa hacia un paso anterior. Si se omite, no se muestra el botón. */
  onGoToStep?: (stepIndex: number) => void;
}

/**
 * Panel de solo lectura para consultar, sin salir del asistente, lo que se respondió en
 * pasos anteriores del wizard de workflow (ver workflow-detail-panel.tsx). No incluye el
 * paso actual: el autoguardado de AssetFormSection flushea recién al desmontarse, así que
 * mientras el usuario sigue en un paso su valor más reciente puede no estar en el caché.
 */
export function WorkflowPreviousAnswersSheet({
  open,
  onOpenChange,
  sections,
  onGoToStep,
}: WorkflowPreviousAnswersSheetProps) {
  const { t } = useTranslation("workflow");

  const [openItems, setOpenItems] = React.useState<string[]>([]);
  // Solo resetea lo abierto al pasar de cerrado a abierto — un autoguardado que parchea el
  // caché mientras el sheet está abierto no debe pisar lo que el usuario ya expandió/colapsó.
  const prevOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setOpenItems(sections.length > 0 ? [sections[sections.length - 1].id] : []);
    }
    prevOpenRef.current = open;
  }, [open, sections]);

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("wizard.answers.title")}
      description={t("wizard.answers.description")}
      icon={History}
      side="right"
      maxWidth="sm:max-w-lg"
      showFooter={false}
    >
      {sections.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">{t("wizard.answers.empty")}</p>
      ) : (
        <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
          {sections.map((section, index) => {
            const fields = [...(section.form_fields ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const questions = fields.filter((f) => f.question_type !== QUESTION_TYPE.label);
            const answeredCount = questions.filter((f) => hasAnswer(f.value)).length;
            const missingRequired = questions.filter(
              (f) => isFieldAnswerable(f) && f.required && !hasAnswer(f.value),
            ).length;

            return (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1 pr-2 text-left">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {t("wizard.answers.stepLabel", { number: index + 1 })}
                      <HuemulReviewStatusBadge
                        status={section.review_status as ReviewStatus | null}
                        sectionType="form"
                      />
                    </span>
                    <span className="truncate text-sm font-medium">{section.section_name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {t("wizard.answers.answeredCount", { answered: answeredCount, total: questions.length })}
                      {missingRequired > 0 && (
                        <Badge variant="secondary" className="bg-amber-100 font-normal text-amber-700">
                          {t("wizard.answers.missingRequired", { count: missingRequired })}
                        </Badge>
                      )}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {fields
                    .filter(isFieldVisible)
                    .map((field, fieldIndex) =>
                      field.question_type === QUESTION_TYPE.label ? (
                        <SectionFieldSeparator key={field.id || fieldIndex} name={field.field_name} />
                      ) : (
                        <div key={field.id || fieldIndex} className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{field.field_name}</p>
                          <FormFieldAnswerValue field={field} />
                        </div>
                      ),
                    )}
                  {onGoToStep && (
                    <HuemulButton
                      variant="outline"
                      size="sm"
                      label={t("wizard.answers.goToStep")}
                      onClick={() => {
                        onGoToStep(index);
                        onOpenChange(false);
                      }}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </HuemulSheet>
  );
}
