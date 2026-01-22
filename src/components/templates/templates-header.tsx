import { Button } from "@/components/ui/button";
import { Plus, List, RefreshCw } from "lucide-react";

interface TemplateHeaderProps {
  templateName: string;
  templateDescription?: string;
  isMobile: boolean;
  hasNoSections: boolean;
  isGenerating: boolean;
  isRefreshing?: boolean;
  activeTab?: string;
  onToggleSidebar?: () => void;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export function TemplateHeader({
  templateName,
  templateDescription,
  isMobile,
  isGenerating,
  isRefreshing = false,
  onToggleSidebar,
  onAddSection,
  onRefresh,
}: TemplateHeaderProps) {
  if (isMobile) {
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm py-1 px-3 z-20 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggleSidebar}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer shrink-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium text-gray-900 truncate">
                {templateName}
              </span>
            </div>
            {templateDescription && (
              <p className="text-[10px] text-gray-600 truncate ml-9">
                {templateDescription}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={onRefresh}
              size="sm"
              variant="ghost"
              disabled={isGenerating}
              className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer shrink-0"
            >
              {isRefreshing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              onClick={onAddSection}
              size="sm"
              disabled={isGenerating}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-7 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-4 py-3 z-10 shrink-0">
      <div className="flex flex-col gap-1">
        {/* Template Name */}
        <h1 className="text-xl font-semibold text-gray-900">
          {templateName}
        </h1>
        {/* Template Description */}
        {templateDescription && (
          <p className="text-sm text-gray-600">
            {templateDescription}
          </p>
        )}
      </div>
    </div>
  );
}
