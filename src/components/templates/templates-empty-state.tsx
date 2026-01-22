import { Button } from "@/components/ui/button";
import { List, Plus, Sparkles, Loader2 } from "lucide-react";

interface TemplateEmptyStateProps {
  isGenerating: boolean;
  onAddSection: () => void;
  onGenerateWithAI: () => void;
  canCreate?: boolean;
}

export function TemplateEmptyState({
  isGenerating,
  onAddSection,
  onGenerateWithAI,
  canCreate = true,
}: TemplateEmptyStateProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-8 text-center">
        <List className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-2">No Sections Yet</h3>
        <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
          Start building your template by adding structured sections.
        </p>
        <div className="flex items-center justify-center gap-2">
          {canCreate && (
            <>
              <Button
                onClick={onAddSection}
                size="sm"
                disabled={isGenerating}
                className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-9 text-sm px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
              <Button
                onClick={onGenerateWithAI}
                size="sm"
                variant="outline"
                className="hover:cursor-pointer h-9 text-sm px-4"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
