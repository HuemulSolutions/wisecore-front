import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { HuemulScreenState } from "@/huemul/components/huemul-screen-state";
import { buildNoSelectionState } from "@/components/assets/content/content-states-config";
import type { ScreenStateConfig } from "@/types/huemul";
import { CreateTemplateDialog } from "@/components/templates/templates-create-dialog";
import { TemplateConfigSheet } from "@/components/assets/content/assets-template-sheet";
import { useOrganization } from "@/contexts/organization-context";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useNavKnowledgeActions } from "@/contexts/nav-knowledge-context";
import { getTemplateById } from "@/services/templates";
import type { AssetEmptyContentProps } from '@/types/assets';
export type { AssetEmptyContentProps } from '@/types/assets';

/**
 * Lightweight component rendered when no asset is selected.
 * Avoids mounting the heavy AssetContent with its 50+ state variables and mutations.
 */
export function AssetEmptyContent({ currentFolderId, onPreserveScroll }: AssetEmptyContentProps) {
  const { t } = useTranslation('assets');
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganization();
  const { canCreate, canAccessTemplates, canAccessAssets } = useUserPermissions();
  const { handleCreateAsset: openCreateAssetDialog } = useNavKnowledgeActions();

  const [isCreateTemplateSheetOpen, setIsCreateTemplateSheetOpen] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<{ id: string; name: string } | null>(null);
  const [isTemplateConfigSheetOpen, setIsTemplateConfigSheetOpen] = useState(false);

  const { data: fullTemplate } = useQuery({
    queryKey: ['template', createdTemplate?.id],
    queryFn: () => getTemplateById(createdTemplate!.id, selectedOrganizationId!),
    enabled: !!createdTemplate?.id && !!selectedOrganizationId,
  });

  if (!selectedOrganizationId) {
    return null;
  }

  const canCreateTemplateAction = canAccessTemplates && canCreate('template');
  const canCreateAssetAction = canAccessAssets && canCreate('asset');
  const screenState: ScreenStateConfig = {
    ...buildNoSelectionState(t),
    actions: [
      ...(canCreateTemplateAction
        ? [
            {
              label: t('content.createTemplate'),
              onClick: () => {
                onPreserveScroll?.();
                setIsCreateTemplateSheetOpen(true);
              },
            },
          ]
        : []),
      ...(canCreateAssetAction
        ? [
            {
              label: t('content.createAsset'),
              onClick: () => {
                onPreserveScroll?.();
                openCreateAssetDialog(currentFolderId);
              },
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <div className="h-full overflow-auto bg-[#f7f8fa] p-4">
        <HuemulScreenState config={screenState} />
      </div>

      {/* Template Creation Dialog */}
      <CreateTemplateDialog
        open={isCreateTemplateSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            onPreserveScroll?.();
            setIsCreateTemplateSheetOpen(false);
          } else {
            setIsCreateTemplateSheetOpen(true);
          }
        }}
        organizationId={selectedOrganizationId}
        onTemplateCreated={(template) => {
          setCreatedTemplate(template);
          setIsCreateTemplateSheetOpen(false);
          queryClient.invalidateQueries({ queryKey: ['templates', selectedOrganizationId] });
          setTimeout(() => {
            setIsTemplateConfigSheetOpen(true);
          }, 300);
        }}
      />

      {/* Template Configuration Sheet */}
      <TemplateConfigSheet
        template={fullTemplate}
        isOpen={isTemplateConfigSheetOpen}
        onOpenChange={setIsTemplateConfigSheetOpen}
      />
    </>
  );
}
