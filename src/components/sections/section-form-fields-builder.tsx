import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuestionTypes } from "@/hooks/useQuestionTypes";
import { useCustomFieldMutations } from "@/hooks/useCustomFields";
import { getCustomFields } from "@/services/custom-fields";
import { CreateEditCustomFieldSheet } from "@/components/custom-fields/custom-fields-create-edit-sheet";
import type { SectionFormField } from "@/types/sections/core";
import type { CustomField, CustomFieldDataType } from "@/types/custom-fields/core";
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul/field";
import { SectionFormFieldCard } from "./section-form-field-card";
import {
  CUSTOM_FIELD_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  QUESTION_TYPE,
  customFieldDataTypeLabel,
  readFieldOptions,
  withFieldKey,
  type FormFieldDraft,
} from "./question-type-meta";

interface SectionFormFieldsBuilderProps {
  value: FormFieldDraft[];
  onChange: (next: FormFieldDraft[]) => void;
  /** Preguntas de secciones con order menor a la actual, disponibles para depends_on cross-sección. */
  earlierSectionsFields?: SectionFormField[];
  isPending?: boolean;
}

export function SectionFormFieldsBuilder({
  value,
  onChange,
  earlierSectionsFields = [],
  isPending,
}: SectionFormFieldsBuilderProps) {
  const { t } = useTranslation(["sections", "custom-fields"]);

  // Catálogo de question types
  const { data: questionTypesResp } = useQuestionTypes();
  const questionTypes = useMemo(() => questionTypesResp?.data ?? [], [questionTypesResp]);
  const questionTypeDataMap = useMemo(() => {
    const m = new Map<string, CustomFieldDataType | null>();
    questionTypes.forEach((qt) => m.set(qt.question_type, qt.data_type as CustomFieldDataType | null));
    return m;
  }, [questionTypes]);

  // Custom fields de la organización: siempre el catálogo completo (búsqueda server-side),
  // tanto en templates como en assets. Cachea data_type por id a medida que se buscan
  // páginas, para poder auto-derivarlo al elegir un campo sin cargar la lista completa.
  const customFieldDataTypeCacheRef = useRef(new Map<string, CustomFieldDataType>());
  const fetchCustomFieldOptions = useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getCustomFields({ search: search || undefined, page, page_size: pageSize });
      res.data.forEach((cf) => customFieldDataTypeCacheRef.current.set(cf.id, cf.data_type));
      return {
        options: res.data.map((cf) => ({
          value: cf.id,
          label: cf.name,
          description: customFieldDataTypeLabel(cf.data_type, t),
        })),
        hasMore: res.has_next,
      };
    },
    [t],
  );

  // Diálogo de creación de custom field, compartido por todas las preguntas del builder.
  const [createCustomFieldIndex, setCreateCustomFieldIndex] = useState<number | null>(null);
  const customFieldMutations = useCustomFieldMutations();

  // Sensores dnd-kit (mismo patrón que templates-sections-list)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // ── Handlers ────────────────────────────────────────────────────────────
  const addField = () => {
    onChange([
      ...value,
      withFieldKey({
        field_id: "",
        field_name: "",
        data_type: "string",
        question_type: "",
        required: false,
        order: value.length + 1,
        custom_field_id: null,
        default_value: null,
        min_value: null,
        max_value: null,
      }),
    ]);
  };

  const updateField = (index: number, patch: Partial<SectionFormField>) => {
    onChange(value.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const duplicateField = (index: number) => {
    const copy = withFieldKey({ ...value[index], field_id: "" });
    const next = [...value];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  // Valores iniciales de min/max/default_value (config JSONB) al elegir un tipo.
  const seedForType = (
    questionType: string,
    derived: SectionFormField["data_type"],
    prev: FormFieldDraft,
  ): Pick<SectionFormField, "min_value" | "max_value" | "default_value"> => {
    switch (questionType) {
      case QUESTION_TYPE.multipleChoice:
      case QUESTION_TYPE.dropdown:
      case QUESTION_TYPE.dropdownMultiple: {
        const prevOptions = readFieldOptions(prev);
        return {
          min_value: null,
          max_value: null,
          default_value: prevOptions.length
            ? prevOptions
            : [1, 2, 3].map((n) => ({ id: String(n), label: t("form.formFields.option", { n }) })),
        };
      }
      case QUESTION_TYPE.linearScale:
        return { min_value: 1, max_value: 5, default_value: { min_label: "", max_label: "" } };
      case QUESTION_TYPE.rating:
        return { min_value: null, max_value: 5, default_value: null };
      case QUESTION_TYPE.fileUpload:
        return { min_value: null, max_value: null, default_value: { allowed_types: [], max_size_mb: 10 } };
      default: {
        const isNumeric = NUMERIC_DATA_TYPES.includes(derived as string);
        return {
          min_value: isNumeric ? prev.min_value ?? null : null,
          max_value: isNumeric ? prev.max_value ?? null : null,
          default_value: null,
        };
      }
    }
  };

  // Cambia question_type y auto-deriva data_type. Para custom_field el data_type
  // se resuelve al elegir el custom field.
  const handleQuestionTypeChange = (index: number, questionType: string) => {
    onChange(
      value.map((f, i) => {
        if (i !== index) return f;
        if (questionType === CUSTOM_FIELD_QUESTION_TYPE) {
          return { ...f, question_type: questionType, custom_field_id: null, min_value: null, max_value: null, default_value: null };
        }
        const derived = (questionTypeDataMap.get(questionType) ?? f.data_type) as SectionFormField["data_type"];
        return {
          ...f,
          question_type: questionType,
          data_type: derived,
          custom_field_id: null,
          ...seedForType(questionType, derived, f),
        };
      }),
    );
  };

  const applyCustomField = (index: number, customFieldId: string, dataType?: CustomFieldDataType) => {
    onChange(
      value.map((f, i) =>
        i === index ? { ...f, custom_field_id: customFieldId || null, data_type: dataType ?? f.data_type } : f,
      ),
    );
  };

  const handleCustomFieldChange = (index: number, customFieldId: string) => {
    applyCustomField(index, customFieldId, customFieldDataTypeCacheRef.current.get(customFieldId));
  };

  const handleCustomFieldCreated = (index: number, created: CustomField) => {
    customFieldDataTypeCacheRef.current.set(created.id, created.data_type);
    applyCustomField(index, created.id, created.data_type);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((f) => f.__key === active.id);
    const newIndex = value.findIndex((f) => f.__key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-gray-700">
            {t("form.formFields.builderLabel")} <span className="text-red-500">*</span>
          </Label>
          {value.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {t("form.formFields.questionCount", { count: value.length })}
            </Badge>
          )}
        </div>
        <HuemulButton
          type="button"
          size="sm"
          variant="outline"
          onClick={addField}
          disabled={isPending}
          className="h-7 text-xs border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white"
          icon={Plus}
          label={t("form.formFields.addQuestion")}
        />
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-gray-500 italic">{t("form.formFields.emptyState")}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value.map((f) => f.__key)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {value.map((field, index) => {
                const isDuplicate = value.some(
                  (f, i) => i !== index && f.field_id.trim() && f.field_id.trim() === field.field_id.trim(),
                );
                // Etiqueta es puramente visual — no tiene valor sobre el cual condicionar, se excluye
                // como target de depends_on.
                const availableDependencyFields = [
                  ...value.slice(0, index),
                  ...earlierSectionsFields,
                ].filter((f) => f.question_type !== QUESTION_TYPE.label);
                return (
                  <SectionFormFieldCard
                    key={field.__key}
                    field={field}
                    index={index}
                    isDuplicate={isDuplicate}
                    questionTypes={questionTypes}
                    fetchCustomFieldOptions={fetchCustomFieldOptions}
                    availableDependencyFields={availableDependencyFields}
                    isPending={isPending}
                    onUpdate={(patch) => updateField(index, patch)}
                    onQuestionTypeChange={(qt) => handleQuestionTypeChange(index, qt)}
                    onCustomFieldChange={(cfId) => handleCustomFieldChange(index, cfId)}
                    onCreateCustomField={() => setCreateCustomFieldIndex(index)}
                    onDuplicate={() => duplicateField(index)}
                    onRemove={() => removeField(index)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {value.length > 0 && (
        <HuemulButton
          type="button"
          size="sm"
          variant="outline"
          onClick={addField}
          disabled={isPending}
          className="h-7 text-xs border-[#4464f7] text-[#4464f7] hover:bg-[#4464f7] hover:text-white"
          icon={Plus}
          label={t("form.formFields.addQuestion")}
        />
      )}

      <CreateEditCustomFieldSheet
        open={createCustomFieldIndex !== null}
        onOpenChange={(open) => {
          if (!open) setCreateCustomFieldIndex(null);
        }}
        customField={null}
        onSuccess={(created) => {
          if (created && createCustomFieldIndex !== null) {
            handleCustomFieldCreated(createCustomFieldIndex, created);
          }
          setCreateCustomFieldIndex(null);
        }}
        customFieldMutations={customFieldMutations}
        // TODO(rbac-audit): este builder no tiene su propia auditoría RBAC
        // todavía (vive en el flujo de secciones de template/asset type).
        // Solo crea campos nuevos desde acá (customField siempre null), así
        // que se fija canCreate=true para no romper el flujo existente con
        // el default seguro (false) de CreateEditCustomFieldSheet.
        canCreate={true}
        canUpdate={false}
        canDelete={false}
      />
    </div>
  );
}
