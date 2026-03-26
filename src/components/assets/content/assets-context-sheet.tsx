import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import AddContext from "@/components/context/context-add";
import type { LifecyclePermissions } from "@/types/assets";

interface ContextSheetProps {
  selectedFile: {
    id: string;
    name: string;
    type: "folder" | "document";
    access_levels?: string[];
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile?: boolean;
  documentName?: string;
  lifecyclePermissions?: LifecyclePermissions;
  stage?: string;
  showTrigger?: boolean;
}

export function ContextSheet({
  selectedFile,
  isOpen,
  onOpenChange,
  isMobile = false,
  documentName,
  lifecyclePermissions,
  stage,
  showTrigger = true,
}: ContextSheetProps) {
  const { t } = useTranslation('context')

  // Can access sheet: review, approve, publish, create or edit
  const canAccess = !!(
    lifecyclePermissions?.review ||
    lifecyclePermissions?.approve ||
    lifecyclePermissions?.publish ||
    lifecyclePermissions?.create ||
    lifecyclePermissions?.edit
  );

  // Can add/edit/delete contexts: only create or edit, and only in edit stage
  const canEdit = !!(lifecyclePermissions?.create || lifecyclePermissions?.edit) && stage === 'edit';

  if (!canAccess) return null;

  return (
    <>
      {showTrigger && (
        <HuemulButton
          requiredAccess={["edit", "create"]}
          requireAll={false}
          checkGlobalPermissions={true}
          resource="context"
          lifecyclePermissions={lifecyclePermissions}
          size="sm"
          variant="ghost"
          icon={Users}
          iconClassName={isMobile ? "h-4 w-4" : "h-3.5 w-3.5"}
          label={isMobile ? undefined : t('sheet.buttonLabel')}
          title={t('sheet.manageContext')}
          className={isMobile
            ? "h-7 w-7 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors rounded-full"
            : "h-7 px-2 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
          }
          onClick={() => onOpenChange(true)}
        />
      )}

      <HuemulSheet
        open={isOpen}
        onOpenChange={onOpenChange}
        title={t('sheet.title')}
        description={t('sheet.description')}
        icon={Users}
        side="right"
        maxWidth="sm:max-w-[90vw] lg:max-w-[800px]"
        showFooter={false}
      >
        <div className="space-y-6">
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {t('sheet.documentLabel', { name: documentName || selectedFile?.name })}
            </h3>
            <p className="text-xs text-gray-600">{t('sheet.documentDescription')}</p>
          </div>

          {/* Context Component */}
          {selectedFile && (
            <AddContext id={selectedFile.id} isSheetOpen={isOpen} canEdit={canEdit} />
          )}
        </div>
      </HuemulSheet>
    </>
  );
}