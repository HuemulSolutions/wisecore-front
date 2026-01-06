import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Markdown from "@/components/ui/markdown";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSectionExecutionContent } from "@/services/section_execution";
import { highlightSearchMatches, findBestMatch } from "@/lib/search-utils";
import { useOrganization } from "@/contexts/organization-context";

interface SearchResultSection {
  section_execution_id: string;
  section_execution_name: string;
  content: string;
}

interface SectionContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SearchResultSection | null;
  index: number;
}

export function SectionContentDialog({
  open,
  onOpenChange,
  section,
  index,
}: SectionContentDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { selectedOrganizationId } = useOrganization();

  // Fetch full section content
  const { data: fullSectionContent, isLoading, error } = useQuery({
    queryKey: ['section-execution-content', section?.section_execution_id, selectedOrganizationId],
    queryFn: () => getSectionExecutionContent(section!.section_execution_id, selectedOrganizationId || undefined),
    enabled: !!section?.section_execution_id && !!selectedOrganizationId && open,
  });

  // Scroll to highlighted content when dialog opens and content is loaded
  useEffect(() => {
    if (open && contentRef.current && fullSectionContent && section?.content) {
      // Find the best matching section and scroll to it
      const bestMatch = findBestMatch(fullSectionContent, section.content);
      
      setTimeout(() => {
        if (contentRef.current) {
          // Try to find highlighted content first
          const highlightedElement = contentRef.current.querySelector('mark');
          if (highlightedElement) {
            highlightedElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          } else {
            // Fallback to scrolling to approximate position
            const scrollPosition = (bestMatch.startIndex / fullSectionContent.length) * contentRef.current.scrollHeight;
            contentRef.current.scrollTop = Math.max(0, scrollPosition - 100);
          }
        }
      }, 200);
    }
  }, [open, fullSectionContent, section]);

  if (!section) return null;

  // Get the content to display (highlighted if full content is available)
  const getDisplayContent = () => {
    if (isLoading) return '';
    if (error || !fullSectionContent) return section.content;
    
    return highlightSearchMatches(fullSectionContent, section.content);
  };

  const displayContent = getDisplayContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col min-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground truncate">
                {section.section_execution_name || `Sección ${index + 1}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isLoading ? 'Loading full content...' : 
                 error ? 'Section content (search result only)' : 
                 'Full section content'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto px-2 py-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading full section content...</span>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Could not load full section content. Showing search result only.
                </p>
              </div>
              <div className="prose prose-sm max-w-none">
                <Markdown>{section.content}</Markdown>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: displayContent }}
                className="markdown-content"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
