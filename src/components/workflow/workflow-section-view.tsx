import * as React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { WorkflowSectionPills } from "@/components/workflow/workflow-section-pills";
import { WorkflowSectionHeading } from "@/components/workflow/workflow-section-heading";
import { WorkflowSectionReadonlyFields } from "@/components/workflow/workflow-section-readonly-fields";
import { WorkflowReadOnlyBanner, type WorkflowReadOnlyBannerReason } from "@/components/workflow/workflow-read-only-banner";
import { AssetFormSection, type AssetFormSectionHandle } from "@/components/assets/content/asset-form-section";
import type { EditorMediaUploadTarget } from "@/contexts/media-reference-context";
import type { ContentSection } from "@/types/assets";
import type { FormFieldValue, FormValuesSectionPayload } from "@/types/sections/core";

export interface WorkflowSectionViewProps {
  section: ContentSection;
  sections: ContentSection[];
  /** Campos de TODAS las secciones del documento — para redactar la condición de depends_on. */
  allFields: FormFieldValue[];
  activeIndex: number;
  onSelectSection: (index: number) => void;
  sectionCanAnswer: (section: ContentSection) => boolean;
  onBackToSummary: () => void;
  /** isFormSaving del panel: gatea «◂ Resumen» y las píldoras (no gatea "Siguiente", que pasa por exit()). */
  navDisabled: boolean;
  organizationId?: string;
  documentId: string;
  mediaUploadTarget: EditorMediaUploadTarget | null;
  canInteract: boolean;
  onExitEditing: () => void;
  onUpdate: (payload?: FormValuesSectionPayload[]) => void;
  onSavingChange: (saving: boolean) => void;
  /** Aviso de solo lectura ya resuelto por el panel (null = sin aviso). Va entre el navegador de
   *  secciones y el nombre de la sección. */
  bannerMessage?: string | null;
  bannerReason?: WorkflowReadOnlyBannerReason;
}

/**
 * Chrome de la vista 2 (responder/ver una sección) del panel de detalle: fila «◂ Resumen» + píldoras, encabezado de sección y los campos. Los campos editables son AssetFormSection sin
 * modificar (ver ia context/question-type-input-guide.md — prohibido reescribir el runtime de
 * campos); en solo lectura o sección inactiva se pintan como texto plano
 * (WorkflowSectionReadonlyFields). Tokens del design system (bg-primary, border-border, …).
 */
export const WorkflowSectionView = React.forwardRef<AssetFormSectionHandle, WorkflowSectionViewProps>(
  function WorkflowSectionView(
    {
      section,
      sections,
      allFields,
      activeIndex,
      onSelectSection,
      sectionCanAnswer,
      onBackToSummary,
      navDisabled,
      organizationId,
      documentId,
      mediaUploadTarget,
      canInteract,
      onExitEditing,
      onUpdate,
      onSavingChange,
      bannerMessage,
      bannerReason = "permission",
    },
    ref,
  ) {
    const { t } = useTranslation("workflow");
    return (
      <div className="flex flex-col gap-4 px-[22px] pb-[22px] pt-[14px]">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <HuemulButton variant="outline" size="sm" disabled={navDisabled} onClick={onBackToSummary}>
            <ChevronLeft />
            <span>{t("summary.backLabel")}</span>
          </HuemulButton>
          <WorkflowSectionPills
            sections={sections}
            activeIndex={activeIndex}
            onSelect={onSelectSection}
            sectionCanAnswer={sectionCanAnswer}
            disabled={navDisabled}
          />
        </div>

        {bannerMessage && <WorkflowReadOnlyBanner message={bannerMessage} reason={bannerReason} />}

        <WorkflowSectionHeading section={section} allFields={allFields} canAnswer={canInteract} />

        {/* canInteract ya cruza permiso de documento/sección Y que la sección esté activa
            (canAnswerSpecificSection), así que una sección inactiva cae en la rama de lectura. */}
        {canInteract ? (
          <AssetFormSection
            key={section.id}
            ref={ref}
            sectionExecutionId={section.id}
            formFields={section.form_fields ?? []}
            organizationId={organizationId}
            documentId={documentId}
            mediaUploadTarget={mediaUploadTarget}
            canInteract={canInteract}
            isEditing={canInteract}
            onExitEditing={onExitEditing}
            onUpdate={onUpdate}
            onSavingChange={onSavingChange}
          />
        ) : (
          <WorkflowSectionReadonlyFields section={section} />
        )}
      </div>
    );
  },
);
