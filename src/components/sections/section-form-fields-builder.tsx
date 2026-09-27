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
import { useQuestionTypes } from "@/hooks/useQuestionTypes";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useCustomFieldMutations } from "@/hooks/useCustomFields";
import { getCustomFields } from "@/services/custom-fields";
import { CreateEditCustomFieldSheet } from "@/components/custom-fields/custom-fields-create-edit-sheet";
import type { SectionFormField } from "@/types/sections/core";
import type { CustomField, CustomFieldDataType } from "@/types/custom-fields/core";
import type { FetchOptionsParams, FetchOptionsResult } from "@/types/huemul/field";
import { SectionFormFieldCard } from "./section-form-field-card";
import {
  CONDITIONAL_QUESTION_TYPE,
  CUSTOM_FIELD_QUESTION_TYPE,
  FORMULA_QUESTION_TYPE,
  NUMERIC_DATA_TYPES,
  QUESTION_TYPE,
  customFieldDataTypeLabel,
  isCalculatedField,
  readFieldOptions,
  slugifyFieldId,
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
  // El builder se monta desde /templates, /asset-types y /asset, y el recurso
  // que crea es siempre el mismo — se resuelve acá en vez de propagar una prop
  // por tres cadenas distintas de sheets.
  const { hasPermission } = useUserPermissions();
  const canCreateCustomField = hasPermission("custom_fields:c");

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

  // La última pregunta agregada (por click o por el bloque básico) arranca expandida,
  // aun si ya trae field_name (SectionFormFieldCard solo abre sola las que no tienen
  // nombre) — se guarda su __key transitoria para forzar el estado inicial de esa tarjeta.
  const [forceOpenKey, setForceOpenKey] = useState<string | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────
  const addField = () => {
    const field = withFieldKey({
      field_id: "",
      field_name: "",
      data_type: "string",
      question_type: QUESTION_TYPE.shortAnswer,
      required: false,
      order: value.length + 1,
      custom_field_id: null,
      default_value: null,
      min_value: null,
      max_value: null,
      calculation_config: null,
    });
    setForceOpenKey(field.__key);
    onChange([...value, field]);
  };

  // Bloque de datos básicos: 3 preguntas típicas ya configuradas, para no empezar de
  // cero. Deja abierta la primera (Área responsable).
  const addBasicBlock = () => {
    const area = withFieldKey({
      field_id: slugifyFieldId(t("form.formFields.builder.basicBlockArea")),
      field_name: t("form.formFields.builder.basicBlockArea"),
      data_type: "string",
      question_type: QUESTION_TYPE.dropdown,
      required: true,
      order: value.length + 1,
      custom_field_id: null,
      default_value: [
        { id: "tecnologia", label: t("form.formFields.builder.basicBlockAreaTech") },
        { id: "finanzas", label: t("form.formFields.builder.basicBlockAreaFinance") },
        { id: "operaciones", label: t("form.formFields.builder.basicBlockAreaOps") },
      ],
      min_value: null,
      max_value: null,
      calculation_config: null,
    });
    const owner = withFieldKey({
      field_id: slugifyFieldId(t("form.formFields.builder.basicBlockOwner")),
      field_name: t("form.formFields.builder.basicBlockOwner"),
      data_type: "string",
      question_type: QUESTION_TYPE.shortAnswer,
      required: true,
      order: value.length + 2,
      custom_field_id: null,
      default_value: null,
      min_value: null,
      max_value: null,
      calculation_config: null,
    });
    const dueDate = withFieldKey({
      field_id: slugifyFieldId(t("form.formFields.builder.basicBlockDueDate")),
      field_name: t("form.formFields.builder.basicBlockDueDate"),
      data_type: "date",
      question_type: QUESTION_TYPE.date,
      required: false,
      order: value.length + 3,
      custom_field_id: null,
      default_value: null,
      min_value: null,
      max_value: null,
      calculation_config: null,
    });
    setForceOpenKey(area.__key);
    onChange([...value, area, owner, dueDate]);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    onChange(arrayMove(value, index, target));
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
        return { min_value: null, max_value: 1, default_value: { allowed_types: [], max_size_mb: 10 } };
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
  // se resuelve al elegir el custom field. Para los campos calculados, calculation_config
  // se siembra vacío (el usuario lo arma en SectionCalculatedFieldEditor) — y, crítico, se
  // limpia a null en cualquier otro tipo: el backend rechaza con 400 un calculation_config
  // en un campo que no es calculado (ver ia context/campos-calculados-en-formularios-guide.md).
  const handleQuestionTypeChange = (index: number, questionType: string) => {
    onChange(
      value.map((f, i) => {
        if (i !== index) return f;

        if (questionType === CUSTOM_FIELD_QUESTION_TYPE) {
          return {
            ...f, question_type: questionType, custom_field_id: null,
            min_value: null, max_value: null, default_value: null, calculation_config: null,
          };
        }

        if (questionType === FORMULA_QUESTION_TYPE) {
          // data_type fijo decimal — el backend rechaza cualquier otro para este tipo.
          return {
            ...f, question_type: questionType, data_type: "decimal", custom_field_id: null,
            required: false, min_value: null, max_value: null, default_value: null,
            calculation_config: { mode: "formula", terms: [], constant: 0, round_decimals: 2 },
          };
        }

        if (questionType === CONDITIONAL_QUESTION_TYPE) {
          // El catálogo devuelve data_type null para este slug: lo declara quien crea el
          // campo (mismo criterio que custom_field) — se preserva si ya venía de otro
          // campo calculado, si no se parte de "string".
          return {
            ...f, question_type: questionType,
            data_type: isCalculatedField(f) ? f.data_type : "string",
            custom_field_id: null, required: false, min_value: null, max_value: null, default_value: null,
            calculation_config: {
              mode: "conditional",
              root: { if: [], then: { type: "value", value: null }, else: { type: "value", value: null } },
            },
          };
        }

        const derived = (questionTypeDataMap.get(questionType) ?? f.data_type) as SectionFormField["data_type"];
        return {
          ...f,
          question_type: questionType,
          data_type: derived,
          custom_field_id: null,
          calculation_config: null,
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

  const requiredCount = value.filter((f) => f.required).length;
  const countLabel = value.length === 0
    ? t("form.formFields.builder.noQuestionsYet")
    : [
        t(value.length === 1 ? "form.formFields.builder.questionsCountOne" : "form.formFields.builder.questionsCountOther", { count: value.length }),
        t(requiredCount === 1 ? "form.formFields.builder.requiredCountOne" : "form.formFields.builder.requiredCountOther", { count: requiredCount }),
      ].join(" · ");

  return (
    <div className="flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-130 text-xs" style={{ color: "#64748b" }}>
          {t("form.formFields.builder.subtitle")}
        </p>
        <p className="shrink-0 whitespace-nowrap text-xs" style={{ color: "#64748b" }}>
          {countLabel}
        </p>
      </div>

      {value.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed bg-white p-5.5 text-center"
          style={{ borderColor: "#d7dde5" }}
        >
          <p className="text-[13px] font-semibold" style={{ color: "#475569" }}>
            {t("form.formFields.builder.emptyTitle")}
          </p>
          <p className="max-w-105 text-xs" style={{ color: "#64748b" }}>
            {t("form.formFields.builder.emptySubtitle")}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <HuemulButton
              type="button"
              size="sm"
              onClick={addField}
              disabled={isPending}
              className="h-8 text-xs"
            >
              {t("form.formFields.builder.emptyAddFirst")}
            </HuemulButton>
            <HuemulButton
              type="button"
              size="sm"
              variant="outline"
              onClick={addBasicBlock}
              disabled={isPending}
              className="h-8 text-xs"
              style={{ borderColor: "#d7dde5" }}
            >
              {t("form.formFields.builder.emptyUseBasicBlock")}
            </HuemulButton>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value.map((f) => f.__key)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
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
                    initiallyExpanded={field.__key === forceOpenKey || !field.field_name}
                    canMoveUp={index > 0}
                    canMoveDown={index < value.length - 1}
                    onUpdate={(patch) => updateField(index, patch)}
                    onQuestionTypeChange={(qt) => handleQuestionTypeChange(index, qt)}
                    onCustomFieldChange={(cfId) => handleCustomFieldChange(index, cfId)}
                    onCreateCustomField={
                      canCreateCustomField ? () => setCreateCustomFieldIndex(index) : undefined
                    }
                    onDuplicate={() => duplicateField(index)}
                    onRemove={() => removeField(index)}
                    onMoveUp={() => moveField(index, -1)}
                    onMoveDown={() => moveField(index, 1)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {value.length > 0 && (
        <button
          type="button"
          onClick={addField}
          disabled={isPending}
          className="flex h-9 items-center justify-center gap-1.5 rounded-[9px] border border-dashed bg-white text-xs font-medium transition-colors disabled:opacity-50"
          style={{ borderColor: "#cbd5e1", color: "#64748b" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; }}
        >
          <Plus className="size-3.5" />
          {t("form.formFields.builder.footerAdd")}
        </button>
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
        // Solo se crean campos nuevos desde acá (`customField` siempre null).
        canCreate={canCreateCustomField}
        canUpdate={false}
        canDelete={false}
      />
    </div>
  );
}
