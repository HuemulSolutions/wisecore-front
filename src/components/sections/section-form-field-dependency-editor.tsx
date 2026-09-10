import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FieldDependencyCondition, SectionFormField } from "@/types/sections/core";
import { FormFieldConditionsEditor } from "./form-field-conditions-editor";
import { validateFieldDependencyConditions } from "./validate-form-field-dependencies";

interface SectionFormFieldDependencyEditorProps {
  ownFieldId: string;
  // Id para el <Switch>/<Label> de show_when_inactive; default = ownFieldId. Necesario
  // cuando ownFieldId es "" (dependencia a nivel de SECCIÓN, sin selfReference posible).
  instanceId?: string;
  conditions: FieldDependencyCondition[];
  showWhenInactive: boolean;
  availableFields: SectionFormField[];
  onChange: (conditions: FieldDependencyCondition[], showWhenInactive: boolean) => void;
  disabled?: boolean;
  // Overrides de texto para reusar este editor fuera del contexto de pregunta (ej.
  // dependencia de sección, ver section-dependency-editor.tsx).
  emptyFieldsMessage?: string;
  showWhenInactiveLabel?: string;
  showWhenInactiveHint?: string;
  // Oculta el switch de show_when_inactive y su hint. Necesario para reusar este
  // editor donde ese concepto no existe (ej. depends_on de LifecycleStep: un step
  // inaplicable desaparece de la secuencia, no hay variante "visible pero
  // deshabilitado" — ver assets-types-lifecycle-step-conditions.tsx).
  hideShowWhenInactive?: boolean;
  // Aviso opcional por campo target, mostrado como description/warning en vez del
  // tipo de pregunta en el picker de field_id (ej. "Falta en: Plantilla DAP" cuando
  // el campo no existe en todas las plantillas vinculadas al document_type — ver
  // useDocumentTypeDependencyFields).
  fieldWarningFor?: (field: SectionFormField) => string | undefined;
}

// Wrapper de depends_on sobre el bloque de condiciones compartido (ver
// form-field-conditions-editor.tsx): agrega la validación de duplicados propia de
// depends_on (no permitida acá, a diferencia del `if` de calculation_config) y el switch
// de show_when_inactive. Props sin cambios respecto de la versión pre-extracción — no
// tocar la firma sin revisar los 4 consumidores.
export function SectionFormFieldDependencyEditor({
  ownFieldId,
  instanceId,
  conditions,
  showWhenInactive,
  availableFields,
  onChange,
  disabled,
  emptyFieldsMessage,
  showWhenInactiveLabel,
  showWhenInactiveHint,
  hideShowWhenInactive,
  fieldWarningFor,
}: SectionFormFieldDependencyEditorProps) {
  const { t } = useTranslation("sections");
  const switchId = instanceId ?? ownFieldId;

  const conditionErrors = validateFieldDependencyConditions(ownFieldId, conditions, availableFields);

  return (
    <div className="space-y-3">
      <FormFieldConditionsEditor
        conditions={conditions}
        availableFields={availableFields}
        onChange={(next) => onChange(next, next.length > 0 ? showWhenInactive : false)}
        disabled={disabled}
        emptyFieldsMessage={emptyFieldsMessage}
        fieldWarningFor={fieldWarningFor}
        errors={conditionErrors}
      />

      {availableFields.length > 0 && conditions.length > 0 && !hideShowWhenInactive && (
        <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
          <Switch
            id={`show-when-inactive-${switchId}`}
            checked={showWhenInactive}
            onCheckedChange={(checked) => onChange(conditions, !!checked)}
            disabled={disabled}
          />
          <Label htmlFor={`show-when-inactive-${switchId}`} className="text-xs text-gray-600">
            {showWhenInactiveLabel ?? t("form.formFields.dependency.showWhenInactive")}
          </Label>
        </div>
      )}
      {availableFields.length > 0 && conditions.length > 0 && !hideShowWhenInactive && (
        <p className="text-xs text-gray-400">
          {showWhenInactiveHint ?? t("form.formFields.dependency.showWhenInactiveHint")}
        </p>
      )}
    </div>
  );
}
