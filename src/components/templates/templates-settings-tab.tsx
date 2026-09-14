import { useEffect, useState } from "react";
import { TemplateSettingsGroupsList } from "./templates-settings-groups-list";
import { TemplateSettingsGroupDetail } from "./templates-settings-group-detail";
import type { TemplateSettingsTabProps, TemplateSettingsSection } from '@/types/templates';
export type { TemplateSettingsTabProps } from '@/types/templates';

// Pestaña "Configuración": nivel 1 (lista de 5 grupos con contador real) y
// nivel 2 (detalle de un grupo, con "Volver" a la lista) — ver
// ia context/list-detail-panel-guide.md. `activeSection` vive acá porque
// debe resetearse a null cuando cambia de plantilla/pestaña, igual que el
// resto del estado de TemplateContent.
export function TemplateSettingsTab({
  templateId,
  organizationId,
  canListCustomFields,
  canCreateCustomField,
  canUpdateCustomField,
  canDeleteCustomField,
  canListTemplateContext,
  canManageTemplateContext,
  canListTemplateDependencies,
  canManageTemplateDependencies,
  canPickAssetsForDependencies,
  canListMedia,
  canCreateMedia,
  canUpdateMedia,
  canDeleteMedia,
  canListDocx,
  canCreateDocx,
  canUpdateDocx,
  canDeleteDocx,
  onCountChange,
}: TemplateSettingsTabProps) {
  const [activeSection, setActiveSection] = useState<TemplateSettingsSection | null>(null);

  // Al cambiar de plantilla se vuelve a la lista de grupos — este tab no se
  // desmonta entre plantillas, solo cambian sus props (ver templates-content.tsx).
  useEffect(() => { setActiveSection(null); }, [templateId]);

  const groupFlags = {
    canListCustomFields,
    canCreateCustomField,
    canUpdateCustomField,
    canDeleteCustomField,
    canListTemplateContext,
    canManageTemplateContext,
    canListTemplateDependencies,
    canManageTemplateDependencies,
    canPickAssetsForDependencies,
    canListMedia,
    canCreateMedia,
    canUpdateMedia,
    canDeleteMedia,
    canListDocx,
    canCreateDocx,
    canUpdateDocx,
    canDeleteDocx,
  };

  if (activeSection) {
    return (
      <TemplateSettingsGroupDetail
        templateId={templateId}
        organizationId={organizationId}
        section={activeSection}
        onBack={() => setActiveSection(null)}
        {...groupFlags}
      />
    );
  }

  return (
    <TemplateSettingsGroupsList
      templateId={templateId}
      organizationId={organizationId}
      onSelect={setActiveSection}
      onCountsChange={onCountChange}
      {...groupFlags}
    />
  );
}
