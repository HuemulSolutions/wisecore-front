import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AssetCreateWizard } from "@/components/assets/content/assets-create-wizard";
import type { CreateOptionActions } from "@/components/assets/content/create-options";
import { useOrganization } from "@/contexts/organization-context";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useNavKnowledgeActions } from "@/contexts/nav-knowledge-context";
import type { AssetEmptyContentProps } from '@/types/assets';
export type { AssetEmptyContentProps } from '@/types/assets';

/**
 * Estado «sin asset seleccionado»: asistente para elegir cómo crear uno. Se renderiza en lugar de
 * `AssetContent` (que trae el header del asset y el panel de Detalle), así que mientras dure no
 * hay header ni Detalle y la columna central ocupa el espacio restante.
 * Sin permiso para crear assets solo queda el encabezado.
 */
export function AssetEmptyContent({ currentFolderId, onPreserveScroll }: AssetEmptyContentProps) {
  const { t } = useTranslation('assets');
  const { selectedOrganizationId } = useOrganization();
  const { canCreate, canAccessAssets } = useUserPermissions();
  const { handleCreateAsset, handleImportAsset, handleImportAssetFromExternal, handleImportConfig } = useNavKnowledgeActions();

  if (!selectedOrganizationId) {
    return null;
  }

  const canCreateAssets = canAccessAssets && canCreate('asset');

  // Cada acción conserva el scroll del contenedor antes de abrir el flujo existente.
  const actions: CreateOptionActions = {
    handleCreateAsset: (folderId, mode) => {
      onPreserveScroll?.();
      handleCreateAsset(folderId, mode);
    },
    handleImportAsset: (folderId) => {
      onPreserveScroll?.();
      handleImportAsset(folderId);
    },
    handleImportAssetFromExternal: (folderId) => {
      onPreserveScroll?.();
      handleImportAssetFromExternal(folderId);
    },
  };

  return (
    <div className="flex h-full flex-1 justify-center overflow-auto bg-[#f7f8fa] px-8 pt-10 pb-12">
      <div className="flex w-full max-w-[900px] flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[25px] font-semibold tracking-[-0.01em] text-[#0f172a]">{t('createWizard.title')}</h2>
          <p className="max-w-[640px] text-sm leading-[1.6] text-[#64748b] [text-wrap:pretty]">
            {canCreateAssets ? t('createWizard.description') : t('createWizard.descriptionNoCreate')}
          </p>
        </div>

        {canCreateAssets && (
          <>
            <AssetCreateWizard folderId={currentFolderId} actions={actions} />

            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-[13px] text-[#64748b]">{t('createWizard.footText')}</p>
              <Button
                type="button"
                variant="outline"
                className="h-[34px] hover:cursor-pointer"
                onClick={() => {
                  onPreserveScroll?.();
                  handleImportConfig();
                }}
              >
                {t('createWizard.importJson')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
