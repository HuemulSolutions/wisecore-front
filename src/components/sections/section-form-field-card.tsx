import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown } from "lucide-react";
import { HuemulField } from "@/huemul/components/huemul-field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldDependencyCondition, SectionFormField } from "@/types/sections/core";
import type { QuestionType } from "@/types/question-types";
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul/field";
import { SectionQuestionTypeFields } from "./section-question-type-fields";
import { SectionFormFieldDependencyEditor } from "./section-form-field-dependency-editor";
import { SectionQuestionPreviewPanel } from "./section-question-preview-panel";
import { buildGroupedQuestionTypeOptions, questionTypeDescription } from "./section-question-type-groups";
import {
  QUESTION_TYPE,
  isCalculatedField,
  questionTypeLabel,
  slugifyFieldId,
  type FormFieldDraft,
} from "./question-type-meta";

const ALWAYS_VALUE = "__always__";
const CUSTOM_VALUE = "__custom__";

interface SectionFormFieldCardProps {
  field: FormFieldDraft;
  index: number;
  isDuplicate: boolean;
  questionTypes: QuestionType[];
  fetchCustomFieldOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>;
  availableDependencyFields: SectionFormField[];
  isPending?: boolean;
  initiallyExpanded?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdate: (patch: Partial<SectionFormField>) => void;
  onQuestionTypeChange: (questionType: string) => void;
  onCustomFieldChange: (customFieldId: string) => void;
  /** Ausente sin `custom_fields:c`: el botón de crear no se renderiza. */
  onCreateCustomField?: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function SectionFormFieldCard({
  field,
  index,
  isDuplicate,
  questionTypes,
  fetchCustomFieldOptions,
  availableDependencyFields,
  isPending,
  initiallyExpanded,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onQuestionTypeChange,
  onCustomFieldChange,
  onCreateCustomField,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SectionFormFieldCardProps) {
  const { t } = useTranslation("sections");
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded ?? !field.field_name);
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

  const groupedQuestionTypeOptions = buildGroupedQuestionTypeOptions(questionTypes, t);
  const typeDescription = questionTypeDescription(field.question_type, t);
  const hideRequired = field.question_type === QUESTION_TYPE.label || isCalculatedField(field);

  // "Cuándo se muestra": azúcar sobre depends_on para el caso simple (una sola condición
  // is_not_empty sobre una pregunta anterior). Si la condición real es más compleja, se
  // muestra como "Personalizada" y se edita desde el link de abajo — no se pisa el valor real.
  const singleCondition = field.depends_on?.length === 1 ? field.depends_on[0] : undefined;
  const isSimpleCondition = !!singleCondition && singleCondition.operator === "is_not_empty";
  const whenShownValue = !field.depends_on || field.depends_on.length === 0
    ? ALWAYS_VALUE
    : isSimpleCondition
      ? singleCondition!.field_id
      : CUSTOM_VALUE;

  const handleWhenShownChange = (value: string) => {
    if (!value || value === CUSTOM_VALUE) return;
    if (value === ALWAYS_VALUE) {
      onUpdate({ depends_on: null, show_when_inactive: false });
      return;
    }
    const condition: FieldDependencyCondition = { field_id: value, operator: "is_not_empty" };
    onUpdate({ depends_on: [condition], show_when_inactive: false });
  };

  const namedEarlierFields = availableDependencyFields.filter((f) => f.field_name);

  // Children explícitos en <SelectValue>: Radix solo porta el label de un <SelectItem> al
  // trigger si ese item llegó a montarse (el Select estuvo abierto) — un value asignado
  // programáticamente (ej. al cambiar el operador desde el editor de condición avanzada,
  // sin abrir ESTE select) queda con el trigger en blanco si no se le pasa el texto a mano.
  const whenShownLabel =
    whenShownValue === ALWAYS_VALUE
      ? t("form.formFields.builder.always")
      : whenShownValue === CUSTOM_VALUE
        ? t("form.formFields.builder.customCondition")
        : t("form.formFields.builder.onlyIfAnswered", {
            name: namedEarlierFields.find((f) => f.field_id === whenShownValue)?.field_name ?? "",
          });

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: isExpanded ? "#2563eb" : "#e2e8f0" }}
      className="rounded-[9px] border bg-white"
    >
      {/* Cabecera plegable */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((v) => !v);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left"
        style={isExpanded ? { boxShadow: "0 0 0 3px rgba(37,99,235,0.1)" } : undefined}
      >
        {!isPending && (
          <div
            className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            title={t("sortableSection.dragToReorder")}
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <span
          className="flex size-5.5 shrink-0 items-center justify-center rounded-full text-xs font-medium"
          style={isExpanded ? { color: "#1d4ed8", backgroundColor: "#eff4ff" } : { color: "#475569", backgroundColor: "#f1f4f7" }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[13px] font-semibold ${field.field_name ? "text-gray-900" : ""}`} style={!field.field_name ? { color: "#94a3b8" } : undefined}>
            {field.field_name || t("form.formFields.builder.untitledQuestion")}
          </p>
          <p className="truncate text-xs" style={{ color: "#64748b" }}>
            {isExpanded ? (
              t("form.formFields.builder.collapsedHint")
            ) : (
              [
                typeDescription,
                field.required && t("form.formFields.required"),
                singleCondition && namedEarlierFields.find((f) => f.field_id === singleCondition.field_id) &&
                  t("form.formFields.builder.onlyIfAnswered", {
                    name: namedEarlierFields.find((f) => f.field_id === singleCondition.field_id)!.field_name,
                  }),
              ].filter(Boolean).join(" · ")
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {field.required && (
            <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ color: "#1d4ed8", backgroundColor: "#eff4ff" }}>
              {t("form.formFields.required")}
            </span>
          )}
          {field.question_type && (
            <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ color: "#475569", backgroundColor: "#f1f4f7" }}>
              {questionTypeLabel(field.question_type, t)}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Cuerpo expandido */}
      {isExpanded && (
        <div
          className="flex flex-col gap-4.5 p-3.5"
          style={{ borderTop: "1px solid #eef1f5" }}
        >
          {/* Configuración, agrupada en bloques */}
          <div className="flex flex-col gap-3.5">
            {/* Bloque: pregunta y tipo */}
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

            <div className="flex flex-col gap-1">
              <HuemulField
                type="select"
                label={t("form.formFields.questionType")}
                required
                value={field.question_type ?? ""}
                onChange={(val) => onQuestionTypeChange(val as string)}
                groupedOptions={groupedQuestionTypeOptions}
                placeholder={t("form.formFields.questionTypePlaceholder")}
                disabled={isPending}
              />
              {typeDescription && <p className="text-xs" style={{ color: "#64748b" }}>{typeDescription}</p>}
            </div>

            {field.question_type && (
              <SectionQuestionTypeFields
                field={field}
                availableDependencyFields={availableDependencyFields}
                fetchCustomFieldOptions={fetchCustomFieldOptions}
                isPending={isPending}
                onUpdate={onUpdate}
                onCustomFieldChange={onCustomFieldChange}
                onCreateCustomField={onCreateCustomField}
              />
            )}

            {/* Bloque: condición y visibilidad */}
            <div className="flex flex-col gap-3 border-t pt-3.5" style={{ borderColor: "#eef1f5" }}>
              <span
                className="text-[11px] font-semibold uppercase"
                style={{ color: "#94a3b8", letterSpacing: "0.06em" }}
              >
                {t("form.formFields.builder.sectionCondition")}
              </span>

              {/* Cuándo se muestra + Obligatoria */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <Label className="mb-1 block text-xs font-medium text-gray-700">
                    {t("form.formFields.builder.whenShown")}
                  </Label>
                  <Select value={whenShownValue} onValueChange={handleWhenShownChange} disabled={isPending}>
                    <SelectTrigger className="h-8.5 w-full bg-white text-xs">
                      <SelectValue>{whenShownLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALWAYS_VALUE}>{t("form.formFields.builder.always")}</SelectItem>
                      {namedEarlierFields.map((f) => (
                        <SelectItem key={f.field_id} value={f.field_id}>
                          {t("form.formFields.builder.onlyIfAnswered", { name: f.field_name })}
                        </SelectItem>
                      ))}
                      {whenShownValue === CUSTOM_VALUE && (
                        <SelectItem value={CUSTOM_VALUE} disabled>
                          {t("form.formFields.builder.customCondition")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {!hideRequired && (
                  <label
                    htmlFor={`required-${field.__key}`}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium"
                    style={
                      field.required
                        ? { color: "#1d4ed8", backgroundColor: "#eff4ff", borderColor: "#dbe6ff" }
                        : { color: "#64748b", backgroundColor: "#fff", borderColor: "#e2e8f0" }
                    }
                  >
                    <Checkbox
                      id={`required-${field.__key}`}
                      checked={field.required ?? false}
                      onCheckedChange={(checked) => onUpdate({ required: !!checked })}
                      disabled={isPending}
                      className="size-3.5"
                    />
                    {t("form.formFields.required")}
                  </label>
                )}
              </div>

              {availableDependencyFields.length > 0 && (
                <Collapsible open={dependencyOpen} onOpenChange={setDependencyOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: "#2563eb" }}
                    >
                      {t("form.formFields.builder.advancedConditionLink")}
                      {(field.depends_on?.length ?? 0) > 0 && (
                        <Badge variant="secondary">{field.depends_on!.length}</Badge>
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
            </div>

            {/* Bloque: avanzado (field_id) */}
            <div className="border-t pt-3.5" style={{ borderColor: "#eef1f5" }}>
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
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3 border-t pt-3.5 text-xs" style={{ borderColor: "#eef1f5" }}>
              <button type="button" onClick={onDuplicate} disabled={isPending} className="font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50">
                {t("form.formFields.duplicate")}
              </button>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isPending || !canMoveUp}
                className="font-medium hover:text-gray-900"
                style={{ color: canMoveUp ? "#4b5563" : "#cbd5e1" }}
              >
                {t("form.formFields.builder.moveUp")}
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isPending || !canMoveDown}
                className="font-medium hover:text-gray-900"
                style={{ color: canMoveDown ? "#4b5563" : "#cbd5e1" }}
              >
                {t("form.formFields.builder.moveDown")}
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={isPending}
                className="ml-auto font-medium disabled:opacity-50"
                style={{ color: "#b91c1c" }}
              >
                {t("form.formFields.delete")}
              </button>
            </div>
          </div>

          {/* Franja de vista previa, ancho completo debajo de la configuración */}
          <SectionQuestionPreviewPanel field={field} availableDependencyFields={availableDependencyFields} />
        </div>
      )}
    </div>
  );
}
