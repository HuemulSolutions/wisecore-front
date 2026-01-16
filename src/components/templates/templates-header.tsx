import { Button } from "@/components/ui/button";
import { Plus, Edit3, Trash2, FileCode, List, Sparkles, Loader2, RefreshCw } from "lucide-react";

interface TemplateHeaderProps {
  templateName: string;
  templateDescription?: string;
  isMobile: boolean;
  hasNoSections: boolean;
  isGenerating: boolean;
  isRefreshing?: boolean;
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
  hasNoSections,
  isGenerating,
  isRefreshing = false,
  onToggleSidebar,
  onAddSection,
  onGenerateWithAI,
  onEdit,
  onDelete,
  onRefresh,
}: TemplateHeaderProps) {
  if (isMobile) {
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm py-1 px-3 z-20 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggleSidebar}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer flex-shrink-0"
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
              className="h-7 w-7 p-0 hover:bg-gray-100 hover:cursor-pointer flex-shrink-0"
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
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-7 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm p-3 md:px-5 z-10 flex-shrink-0">
      <div className="space-y-2 md:space-y-2.5">
        {/* Title Section */}
        <div className="flex items-start md:items-center gap-2 md:gap-3 flex-col md:flex-row">
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-lg font-bold text-gray-900 break-words mb-0.5">
              {templateName}
            </h1>
            {templateDescription && (
              <p className="text-xs text-gray-600 leading-relaxed">
                {templateDescription}
              </p>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 text-[10px] font-medium text-blue-700">
            <FileCode className="w-2 h-2" />
            Template
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex items-start gap-2 flex-wrap">
          {/* Primary Actions Group */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg flex-wrap min-w-0">
            <Button
              onClick={onAddSection}
              size="sm"
              variant="ghost"
              disabled={isGenerating}
              className="h-7 px-2.5 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-[10px]"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Section
            </Button>
            
            {hasNoSections && (
              <Button
                onClick={onGenerateWithAI}
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-[#4464f7] hover:bg-[#4464f7] hover:text-white hover:cursor-pointer transition-colors text-[10px]"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate with AI
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Secondary Actions Group */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg flex-wrap min-w-0">
            <Button
              onClick={onRefresh}
              size="sm"
              variant="ghost"
              disabled={isGenerating}
              className="h-7 px-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              onClick={onEdit}
              size="sm"
              variant="ghost"
              disabled={isGenerating}
              className="h-7 px-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:cursor-pointer transition-colors"
            >
              <Edit3 className="h-3 w-3" />
            </Button>

            <Button
              onClick={onDelete}
              size="sm"
              variant="ghost"
              disabled={isGenerating}
              className="h-7 px-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 hover:cursor-pointer transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
