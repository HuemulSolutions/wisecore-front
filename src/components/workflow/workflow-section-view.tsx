import * as React from "react";
import { WorkflowSectionHeading } from "@/components/workflow/workflow-section-heading";
import { WorkflowSectionReadonlyFields } from "@/components/workflow/workflow-section-readonly-fields";
import { WorkflowReadOnlyBanner, type WorkflowReadOnlyBannerReason } from "@/components/workflow/workflow-read-only-banner";
import { AssetFormSection, type AssetFormSectionHandle } from "@/components/assets/content/asset-form-section";
import type { EditorMediaUploadTarget } from "@/contexts/media-reference-context";
import type { ContentSection } from "@/types/assets";
import type { FormFieldValue, FormValuesSectionPayload } from "@/types/sections/core";

export interface WorkflowSectionViewProps {
  section: ContentSection;
  /** Campos de TODAS las secciones del documento — para redactar la condición de depends_on. */
  allFields: FormFieldValue[];
  onBackToSummary: () => void;
  /** isFormSaving del panel: gatea el chevron de volver al resumen (no gatea "Siguiente", que pasa por exit()). */
  navDisabled: boolean;
  organizationId?: string;
  documentId: string;
  mediaUploadTarget: EditorMediaUploadTarget | null;
  canInteract: boolean;
  onExitEditing: () => void;
  onUpdate: (payload?: FormValuesSectionPayload[]) => void;
  onSavingChange: (saving: boolean) => void;
  /** Aviso de solo lectura ya resuelto por el panel (null = sin aviso). Va debajo del encabezado
   *  de la sección. */
  bannerMessage?: string | null;
  bannerReason?: WorkflowReadOnlyBannerReason;
}

/**
 * Chrome de la vista 2 (responder/ver una sección) del panel de detalle: encabezado de sección (con el chevron de volver al resumen) y los campos. Los campos editables son AssetFormSection sin
 * modificar (ver ia context/question-type-input-guide.md — prohibido reescribir el runtime de
 * campos); en solo lectura o sección inactiva se pintan como texto plano
 * (WorkflowSectionReadonlyFields). Tokens del design system (bg-primary, border-border, …).
 */
export const WorkflowSectionView = React.forwardRef<AssetFormSectionHandle, WorkflowSectionViewProps>(
  function WorkflowSectionView(
    {
      section,
      allFields,
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
    return (
      <div className="flex flex-col gap-4 px-[22px] pb-[22px] pt-[14px]">
        <WorkflowSectionHeading
          section={section}
          allFields={allFields}
          canAnswer={canInteract}
          onBack={onBackToSummary}
          backDisabled={navDisabled}
        />

        {bannerMessage && <WorkflowReadOnlyBanner message={bannerMessage} reason={bannerReason} />}

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
