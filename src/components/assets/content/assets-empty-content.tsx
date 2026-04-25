import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { FileIcon, FileCode, FileText } from "lucide-react";
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyActions } from "@/components/ui/empty";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { CreateTemplateDialog } from "@/components/templates/templates-create-dialog";
import { TemplateConfigSheet } from "@/components/assets/content/assets-template-sheet";
import { useOrganization } from "@/contexts/organization-context";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useNavKnowledgeActions } from "@/components/layout/nav-knowledge";
import { getTemplateById } from "@/services/templates";

interface AssetEmptyContentProps {
  currentFolderId: string | undefined;
  onPreserveScroll?: () => void;
}

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

  return (
    <>
      <div className="h-full bg-gray-50 flex items-center justify-center p-4">
        <Empty>
          <div className="p-8 text-center">
            <EmptyIcon>
              <FileIcon className="h-12 w-12" />
            </EmptyIcon>
            <EmptyTitle>{t('content.welcomeTitle')}</EmptyTitle>
            <EmptyDescription>
              {(canAccessTemplates && canCreate('template')) || (canAccessAssets && canCreate('asset'))
                ? t('content.welcomeDescriptionWithPermissions')
                : t('content.welcomeDescriptionNoPermissions')
              }
            </EmptyDescription>
            <EmptyActions>
              {canAccessTemplates && canCreate('template') && (
                <HuemulButton
                  onClick={() => {
                    onPreserveScroll?.();
                    setIsCreateTemplateSheetOpen(true);
                  }}
                  variant="outline"
                  icon={FileCode}
                  iconClassName="h-4 w-4"
                  label={t('content.createTemplate')}
                />
              )}
              {canAccessAssets && canCreate('asset') && (
                <HuemulButton
                  onClick={() => {
                    onPreserveScroll?.();
                    openCreateAssetDialog(currentFolderId);
                  }}
                  className="bg-[#4464f7] hover:bg-[#3451e6]"
                  icon={FileText}
                  iconClassName="h-4 w-4"
                  label={t('content.createAsset')}
                />
              )}
            </EmptyActions>
          </div>
        </Empty>
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
