import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SectionPropagationFieldsProps } from "@/types/sections/blocks";
export type { SectionPropagationFieldsProps } from "@/types/sections/blocks";

/**
 * Checkboxes de propagación — reemplaza los tres PropagateCallout (switch +
 * texto largo) por un checkbox simple, uno por flag realmente aplicable a
 * esta combinación de superficie/modo (ver ia context/sheet-footer-batch-save-guide.md
 * para el criterio de "campos con semántica de reemplazo total").
 */
export function SectionPropagationFields({
  showToDocuments,
  propagateToDocuments,
  onPropagateToDocumentsChange,
  showToSections,
  propagateToSections,
  onPropagateToSectionsChange,
  showToTemplate,
  propagateToTemplate,
  onPropagateToTemplateChange,
  disabled,
}: SectionPropagationFieldsProps) {
  const { t } = useTranslation("sections");

  if (!showToDocuments && !showToSections && !showToTemplate) return null;

  return (
    <div className="flex flex-col gap-2">
      {showToDocuments && (
        <PropagateCheckbox
          id="propagate-to-documents"
          checked={propagateToDocuments}
          onCheckedChange={onPropagateToDocumentsChange}
          disabled={disabled}
          label={t("form.propagate.createToDocuments")}
        />
      )}
      {showToSections && (
        <PropagateCheckbox
          id="propagate-to-sections"
          checked={propagateToSections}
          onCheckedChange={onPropagateToSectionsChange}
          disabled={disabled}
          label={t("form.propagate.editToDocuments")}
        />
      )}
      {showToTemplate && (
        <PropagateCheckbox
          id="propagate-to-template"
          checked={propagateToTemplate}
          onCheckedChange={onPropagateToTemplateChange}
          disabled={disabled}
          label={t("form.propagate.editToTemplate")}
        />
      )}
    </div>
  );
}

function PropagateCheckbox({
  id,
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value as boolean)}
        disabled={disabled}
      />
      <Label htmlFor={id} className="text-[13px] font-normal text-[#334155] hover:cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
