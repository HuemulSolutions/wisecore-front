import { TemplateCustomFields } from "../templates-custom-fields/templates-custom-fields";
import { TemplateContextTab } from "./templates-context-tab";
import { TemplateDependenciesTab } from "./templates-dependencies-tab";
import { TemplateMediaTab } from "./templates-media-tab";
import { TemplateDocxList } from "./templates-docx-list";
import type { TemplateSettingsGroupDetailProps } from "@/types/templates";
export type { TemplateSettingsGroupDetailProps } from "@/types/templates";

// Nivel 2 de la pestaña "Configuración": el componente real del grupo
// elegido, con el chevron de "Volver" inyectado a la izquierda de su propio
// título (mismo header row, ver `onBack` en cada uno) en vez de un link
// separado arriba. Campos personalizados, Media y Plantillas DOCX ya traen
// su propio header/tabla/galería/grid (con edición inline, preview y
// reemplazo de archivo) — se muestran tal cual. Contexto y Dependencias
// adoptan el estilo de fila del nuevo diseño (ver esos dos archivos).
export function TemplateSettingsGroupDetail({
  templateId,
  organizationId,
  section,
  onBack,
  canCreateCustomField,
  canUpdateCustomField,
  canDeleteCustomField,
  canManageTemplateContext,
  canManageTemplateDependencies,
  canPickAssetsForDependencies,
  canCreateMedia,
  canUpdateMedia,
  canDeleteMedia,
  canCreateDocx,
  canUpdateDocx,
  canDeleteDocx,
}: TemplateSettingsGroupDetailProps) {
  return (
    <div className="h-full min-h-0 overflow-auto">
      {section === "custom-fields" && (
        <TemplateCustomFields
          templateId={templateId}
          canCreate={canCreateCustomField}
          canUpdate={canUpdateCustomField}
          canDelete={canDeleteCustomField}
          onBack={onBack}
        />
      )}
      {section === "context" && (
        <TemplateContextTab
          templateId={templateId}
          organizationId={organizationId}
          canManage={canManageTemplateContext}
          onBack={onBack}
        />
      )}
      {section === "dependencies" && (
        <TemplateDependenciesTab
          templateId={templateId}
          organizationId={organizationId}
          canManage={canManageTemplateDependencies}
          canPickAssets={canPickAssetsForDependencies}
          onBack={onBack}
        />
      )}
      {section === "media" && (
        <TemplateMediaTab
          templateId={templateId}
          organizationId={organizationId}
          canCreate={canCreateMedia}
          canUpdate={canUpdateMedia}
          canDelete={canDeleteMedia}
          onBack={onBack}
        />
      )}
      {section === "docx-templates" && (
        <TemplateDocxList
          templateId={templateId}
          organizationId={organizationId}
          canCreate={canCreateDocx}
          canUpdate={canUpdateDocx}
          canDelete={canDeleteDocx}
          onBack={onBack}
        />
      )}
    </div>
  );
}
