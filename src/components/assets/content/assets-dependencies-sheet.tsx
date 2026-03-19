import { Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HuemulButton } from "@/huemul/components/huemul-button";
import { HuemulSheet } from "@/huemul/components/huemul-sheet";
import AddDependencySheet from "@/components/dependency/dependency-add";

interface DependenciesSheetProps {
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

export function DependenciesSheet({
  selectedFile,
  isOpen,
  onOpenChange,
  isMobile = false,
  accessLevels,
  documentName
}: DependenciesSheetProps) {
  const { t } = useTranslation('dependencies')

  return (
    <>
      <HuemulButton
        accessLevels={accessLevels || selectedFile?.access_levels}
        requiredAccess={["edit", "create"]}
        requireAll={false}
        checkGlobalPermissions={true}
        resource="asset"
        size="sm"
        variant="ghost"
        onClick={() => onOpenChange(true)}
        className={isMobile
          ? "h-8 w-8 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors rounded-full"
          : "h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white transition-colors text-xs"
        }
        tooltip={t('sheet.buttonTooltip')}
      >
        <Link2 className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5 mr-1.5"} />
        {!isMobile && t('sheet.buttonLabel')}
      </HuemulButton>

      <HuemulSheet
        open={isOpen}
        onOpenChange={onOpenChange}
        title={t('sheet.title')}
        description={t('sheet.description')}
        icon={Link2}
        side="right"
        maxWidth="w-full sm:max-w-[90vw] lg:max-w-[800px]"
        showFooter={false}
      >
        <div className="space-y-6">
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-900 mb-1">{t('sheet.documentLabel', { name: documentName || selectedFile?.name })}</h3>
                <p className="text-xs text-gray-600">{t('sheet.documentDescription')}</p>
          </div>

          {/* Dependencies Component */}
          {selectedFile && (
            <AddDependencySheet id={selectedFile.id} isSheetOpen={isOpen} />
          )}
        </div>
      </HuemulSheet>
    </>
  );
}