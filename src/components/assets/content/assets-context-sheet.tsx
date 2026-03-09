import { Users } from "lucide-react";
import { DocumentActionButton } from "@/components/assets/content/assets-access-control";
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
}

export function ContextSheet({
  selectedFile,
  isOpen,
  onOpenChange,
  isMobile = false,
  accessLevels
}: ContextSheetProps) {
  return (
    <>
      <DocumentActionButton
        accessLevels={accessLevels || selectedFile?.access_levels}
        requiredAccess={["edit", "create"]}
        requireAll={false}
        checkGlobalPermissions={true}
        resource="asset"
        size="sm"
        variant="ghost"
        className={isMobile 
          ? "h-8 w-8 p-0 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors rounded-full" 
          : "h-8 px-3 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-xs"
        }
        title="Manage Context"
        onClick={() => onOpenChange(true)}
      >
        <Users className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5 mr-1.5"} />
        {!isMobile && "Context"}
      </DocumentActionButton>

      <HuemulSheet
        open={isOpen}
        onOpenChange={onOpenChange}
        title="Document Context"
        description="Configure document context, variables, and execution environment."
        icon={Users}
        side="right"
        maxWidth="sm:max-w-[90vw] lg:max-w-[800px]"
        showFooter={false}
      >
        <div className="space-y-6">
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Document: {selectedFile?.name}</h3>
            <p className="text-xs text-gray-600">Set up context variables, user permissions, and environmental settings that influence document execution and content generation.</p>
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