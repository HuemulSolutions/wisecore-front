import { Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import AddDependencySheet from "@/components/dependency/dependency-panel";
import type { DependenciesSheetProps } from '@/types/assets';
export type { DependenciesSheetProps } from '@/types/assets';

export function DependenciesSheet({
  selectedFile,
  isOpen,
  onOpenChange,
  isMobile = false,
  documentName,
  lifecyclePermissions,
  stage,
  showTrigger = true,
}: DependenciesSheetProps) {
  const { t } = useTranslation('dependencies')

  // Can access sheet: review, approve, publish, create or edit
  const canAccess = !!(
    lifecyclePermissions?.review ||
    lifecyclePermissions?.approve ||
    lifecyclePermissions?.publish ||
    lifecyclePermissions?.create ||
    lifecyclePermissions?.edit
  );

  // Can add/remove dependencies: only create or edit, and only in edit stage
  const canEdit = !!(lifecyclePermissions?.create || lifecyclePermissions?.edit) && stage === 'edit';

  if (!canAccess) return null;

  return (
    <>
      {showTrigger && (
        <HuemulButton
          requiredAccess={["edit", "create"]}
          requireAll={false}
          checkGlobalPermissions={true}
          resource="asset"
          lifecyclePermissions={lifecyclePermissions}
          size="sm"
          variant="ghost"
          onClick={() => onOpenChange(true)}
          tooltip={t('sheet.buttonLabel')}
          className={isMobile
            ? "h-7 w-7 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors rounded-full"
            : "h-7 px-2 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
          }
        >
          <Link2 className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5 mr-1.5"} />
          {!isMobile && t('sheet.buttonLabel')}
        </HuemulButton>
      )}

      <HuemulSheet
        open={isOpen}
        onOpenChange={onOpenChange}
        eyebrow={t('sheet.documentLabel', { name: documentName || selectedFile?.name })}
        title={t('sheet.title')}
        description={t('sheet.description')}
        icon={Link2}
        side="right"
        maxWidth="w-full sm:max-w-[90vw] lg:max-w-[800px]"
        showFooter={false}
      >
        {selectedFile && (
          <AddDependencySheet
            id={selectedFile.id}
            isSheetOpen={isOpen}
            canEdit={canEdit}
            onRequestClose={() => onOpenChange(false)}
          />
        )}
      </HuemulSheet>
    </>
  );
}