import { useTranslation } from "react-i18next";
import { HuemulTintedFieldset } from "@/huemul/components/huemul-tinted-fieldset";
import SectionPlateEditor from "@/components/plate-editor/section-plate-editor";
import { SECTION_TYPE_META } from "./section-type-meta";
import type { SectionManualBlockProps } from "@/types/sections/blocks";
export type { SectionManualBlockProps } from "@/types/sections/blocks";

const MANUAL_META = SECTION_TYPE_META.manual;

/**
 * Bloque de configuración del tipo "Manual" — el mismo editor Plate rico que
 * el resto de la app (no un textarea con toolbar falsa), dentro de la caja
 * tintada del tipo.
 */
export function SectionManualBlock({
  editorKey,
  manualEditorRef,
  manualInput,
  sectionId,
  organizationId,
  documentId,
  mediaUploadTarget,
  onChange,
}: SectionManualBlockProps) {
  const { t } = useTranslation("sections");

  return (
    <HuemulTintedFieldset
      title={t("form.blocks.manualTitle")}
      accent={MANUAL_META.color}
      borderColor="#cdeed8"
      background="#fbfdfb"
    >
      <div className="rounded-lg border border-[#e2e8f0] bg-white">
        <SectionPlateEditor
          key={`manual-${editorKey}`}
          ref={manualEditorRef}
          sectionId={sectionId}
          content={manualInput}
          isEditing={true}
          hideActions={true}
          enableComments={false}
          enableCreateSection={false}
          organizationId={organizationId}
          documentId={documentId}
          mediaUploadTarget={mediaUploadTarget}
          onValueChange={onChange}
        />
      </div>
      <p className="text-xs text-[#64748b]">{t("form.manualInput.description")}</p>
    </HuemulTintedFieldset>
  );
}
