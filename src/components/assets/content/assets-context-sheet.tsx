import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import AddContext from "@/components/context/context-add";

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
  accessLevels?: string[];
  documentName?: string;
}

export function ContextSheet({
  selectedFile,
  isOpen,
  onOpenChange,
  isMobile = false,
  accessLevels,
  documentName
}: ContextSheetProps) {
  const { t } = useTranslation('context')

  return (
    <>
      <HuemulButton
        size="sm"
        variant="ghost"
        icon={Users}
        iconClassName={isMobile ? "h-4 w-4" : "h-3.5 w-3.5"}
        label={isMobile ? undefined : t('sheet.buttonLabel')}
        title={t('sheet.manageContext')}
        className={isMobile
          ? "h-8 w-8 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors rounded-full"
          : "h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors text-xs"
        }
        accessLevels={accessLevels || selectedFile?.access_levels}
        requiredAccess={["edit", "create"]}
        requireAll={false}
        checkGlobalPermissions={true}
        resource="asset"
        onClick={() => onOpenChange(true)}
      />

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
            <AddContext id={selectedFile.id} isSheetOpen={isOpen} />
          )}
        </div>
      </HuemulSheet>
    </>
  );
}