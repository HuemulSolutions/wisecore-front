import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { FieldDependencyCondition, SectionFormField } from "@/types/sections/core";
import { SectionFormFieldDependencyEditor } from "./section-form-field-dependency-editor";

interface SectionDependencyEditorProps {
  // Id de la sección (o "new" en modo create) — solo para el id del <Switch>/<Label>.
  sectionKey: string;
  conditions: FieldDependencyCondition[];
  showWhenInactive: boolean;
  availableFields: SectionFormField[];
  onChange: (conditions: FieldDependencyCondition[], showWhenInactive: boolean) => void;
  disabled?: boolean;
}

// Dependencia condicional a nivel de SECCIÓN (cualquier tipo: ai/manual/reference/form).
// Reusa el mismo editor de condiciones que las preguntas (ownFieldId="" desactiva la
// regla selfReference, que no aplica acá), con textos propios — ver
// "ia context/dependencias-condicionales-formularios-guide.md" §3.2.
export function SectionDependencyEditor({
  sectionKey,
  conditions,
  showWhenInactive,
  availableFields,
  onChange,
  disabled,
}: SectionDependencyEditorProps) {
  const { t } = useTranslation("sections");
  const [open, setOpen] = useState(conditions.length > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          {t("form.sectionDependency.title")}
          {conditions.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {conditions.length}
            </Badge>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2">
        <p className="text-xs text-gray-400">{t("form.sectionDependency.hint")}</p>
        <SectionFormFieldDependencyEditor
          ownFieldId=""
          instanceId={`section-${sectionKey}`}
          conditions={conditions}
          showWhenInactive={showWhenInactive}
          availableFields={availableFields}
          onChange={onChange}
          disabled={disabled}
          emptyFieldsMessage={t("form.sectionDependency.noEarlierFields")}
          showWhenInactiveLabel={t("form.sectionDependency.showWhenInactive")}
          showWhenInactiveHint={t("form.sectionDependency.showWhenInactiveHint")}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
