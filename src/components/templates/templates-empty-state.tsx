import { Button } from "@/components/ui/button";
import { List, Plus, Sparkles, Loader2 } from "lucide-react";

interface TemplateEmptyStateProps {
  isGenerating: boolean;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
}

export function TemplateEmptyState({
  isGenerating,
  onAddSection,
  onGenerateWithAI,
}: TemplateEmptyStateProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 text-center">
        <List className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <h3 className="text-sm font-medium text-gray-900 mb-1.5">No Sections Yet</h3>
        <p className="text-xs text-gray-500 mb-3">
          Start building your template by adding structured sections.
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <Button
            onClick={onAddSection}
            size="sm"
            disabled={isGenerating}
            className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Section
          </Button>
          <Button
            onClick={onGenerateWithAI}
            size="sm"
            variant="outline"
            className="hover:cursor-pointer h-8 text-xs"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Generate with AI
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
