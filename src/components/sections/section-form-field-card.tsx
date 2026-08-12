import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulField } from "@/huemul/components/huemul-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FieldDependencyCondition, SectionFormField } from "@/types/sections/core";
import type { QuestionType } from "@/types/question-types";
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul/field";
import { SectionQuestionTypeFields } from "./section-question-type-fields";
import { SectionFormFieldDependencyEditor } from "./section-form-field-dependency-editor";
import {
  QUESTION_TYPE,
  questionTypeIcon,
  questionTypeLabel,
  slugifyFieldId,
  type FormFieldDraft,
} from "./question-type-meta";

interface SectionFormFieldCardProps {
  field: FormFieldDraft;
  index: number;
  isDuplicate: boolean;
  questionTypes: QuestionType[];
  fetchCustomFieldOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  availableDependencyFields: SectionFormField[];
  isPending?: boolean;
  onUpdate: (patch: Partial<SectionFormField>) => void;
  onQuestionTypeChange: (questionType: string) => void;
  onCustomFieldChange: (customFieldId: string) => void;
  /** Ausente sin `custom_fields:c`: el botón de crear no se renderiza. */
  onCreateCustomField?: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function SectionFormFieldCard({
  field,
  index,
  isDuplicate,
  questionTypes,
  fetchCustomFieldOptions,
  availableDependencyFields,
  isPending,
  onUpdate,
  onQuestionTypeChange,
  onCustomFieldChange,
  onCreateCustomField,
  onDuplicate,
  onRemove,
}: SectionFormFieldCardProps) {
  const { t } = useTranslation("sections");
  const [isExpanded, setIsExpanded] = useState(!field.field_name);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dependencyOpen, setDependencyOpen] = useState(false);
  const [idCustomized, setIdCustomized] = useState(
    () => field.field_id !== "" && field.field_id !== slugifyFieldId(field.field_name),
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.__key,
    disabled: isPending,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  };

  const TypeIcon = questionTypeIcon(field.question_type);

  const questionTypeOptions = questionTypes.map((qt) => ({
    value: qt.question_type,
    label: questionTypeLabel(qt.question_type, t),
    icon: questionTypeIcon(qt.question_type),
  }));

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        {!isPending && (
          <div
            className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            title={t("sortableSection.dragToReorder")}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <span className="text-xs font-medium text-gray-500 shrink-0">{index + 1}</span>
        <span className={`flex-1 min-w-0 truncate text-sm ${field.field_name ? "text-gray-900" : "text-gray-400 italic"}`}>
          {field.field_name || t("form.formFields.statement")}
          {field.required && <span className="text-red-500"> *</span>}
        </span>
        <Badge variant="secondary" className="gap-1 shrink-0 font-normal">
          <TypeIcon className="size-3" />
          <span className="hidden sm:inline">
            {field.question_type ? questionTypeLabel(field.question_type, t) : t("form.formFields.questionType")}
          </span>
        </Badge>
        <HuemulButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((v) => !v)}
          icon={isExpanded ? ChevronUp : Pencil}
          className="h-7 w-7 shrink-0 text-gray-500"
        />
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="space-y-3 p-3">
          {/* Enunciado + Tipo de pregunta */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <HuemulField
              type="text"
              label={t("form.formFields.statement")}
              required
              value={field.field_name}
              onChange={(val) => {
              const name = val as string;
              const patch: Partial<SectionFormField> = { field_name: name };
              if (!idCustomized) patch.field_id = slugifyFieldId(name);
              onUpdate(patch);
            }}
              placeholder={t("form.formFields.statement")}
              disabled={isPending}
            />
            <HuemulField
              type="select"
              label={t("form.formFields.questionType")}
              required
              value={field.question_type ?? ""}
              onChange={(val) => onQuestionTypeChange(val as string)}
              options={questionTypeOptions}
              placeholder={t("form.formFields.questionTypePlaceholder")}
              disabled={isPending}
            />
          </div>

          {/* Configuración + vista previa por tipo de pregunta */}
          {field.question_type && (
            <SectionQuestionTypeFields
              field={field}
              fetchCustomFieldOptions={fetchCustomFieldOptions}
              isPending={isPending}
              onUpdate={onUpdate}
              onCustomFieldChange={onCustomFieldChange}
              onCreateCustomField={onCreateCustomField}
            />
          )}

          {/* Avanzado: field_id */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                {t("form.formFields.advanced")}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">{t("form.formFields.fieldId")} *</Label>
                <Input
                  value={field.field_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setIdCustomized(false);
                      onUpdate({ field_id: slugifyFieldId(field.field_name) });
                    } else {
                      setIdCustomized(true);
                      onUpdate({ field_id: val });
                    }
                  }}
                  placeholder={t("form.formFields.fieldIdPlaceholder")}
                  className={`h-8 text-xs ${isDuplicate ? "border-red-400" : ""}`}
                  disabled={isPending}
                />
                {isDuplicate && (
                  <p className="text-xs text-red-500">{t("form.formFields.duplicateFieldId")}</p>
                )}
                {!idCustomized && (
                  <p className="text-xs text-gray-400">{t("form.formFields.fieldIdAuto")}</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Dependencia condicional */}
          {availableDependencyFields.length > 0 && (
            <Collapsible open={dependencyOpen} onOpenChange={setDependencyOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dependencyOpen ? "rotate-180" : ""}`} />
                  {t("form.formFields.dependency.title")}
                  {(field.depends_on?.length ?? 0) > 0 && (
                    <Badge variant="secondary" className="font-normal">
                      {field.depends_on!.length}
                    </Badge>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <SectionFormFieldDependencyEditor
                  ownFieldId={field.field_id}
                  conditions={field.depends_on ?? []}
                  showWhenInactive={field.show_when_inactive ?? false}
                  availableFields={availableDependencyFields}
                  onChange={(conditions: FieldDependencyCondition[], showWhenInactive: boolean) =>
                    onUpdate({ depends_on: conditions, show_when_inactive: showWhenInactive })
                  }
                  disabled={isPending}
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
            <HuemulButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              disabled={isPending}
              icon={Copy}
              tooltip={t("form.formFields.duplicate")}
              className="h-7 w-7 text-gray-500 hover:text-gray-700"
            />
            <HuemulButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isPending}
              icon={Trash2}
              tooltip={t("form.formFields.delete")}
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
            />
            {field.question_type !== QUESTION_TYPE.label && (
              <div className="ml-2 flex items-center gap-2">
                <Label htmlFor={`required-${field.__key}`} className="text-xs text-gray-600">
                  {t("form.formFields.required")}
                </Label>
                <Switch
                  id={`required-${field.__key}`}
                  checked={field.required ?? false}
                  onCheckedChange={(checked) => onUpdate({ required: !!checked })}
                  disabled={isPending}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
