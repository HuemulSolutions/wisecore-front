import { ReusableDialog } from "@/components/ui/reusable-dialog";
import Markdown from "@/components/ui/markdown";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSectionExecutionContent } from "@/services/section_execution";
import { findBestMatch } from "@/lib/search-utils";
import { useOrganization } from "@/contexts/organization-context";
import HighlightedMarkdown from "@/components/HighlightedMarkdown";

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

  console.log('[SectionContentDialog] Render with:', { open, sectionId: section?.section_execution_id, orgId: selectedOrganizationId });

  // Fetch full section content
  const { data: fullSectionContent, isLoading, error, isFetching, status } = useQuery({
    queryKey: ['section-execution-content', section?.section_execution_id, selectedOrganizationId],
    queryFn: async () => {
      console.log('[Query] Starting fetch for section:', section?.section_execution_id);
      if (!section?.section_execution_id) {
        throw new Error('No section execution ID provided');
      }
      const content = await getSectionExecutionContent(
        section.section_execution_id, 
        selectedOrganizationId || undefined
      );
      console.log('[Query] Resolved with content length:', content?.length || 0, 'type:', typeof content);
      return content;
    },
    enabled: open && !!section?.section_execution_id && !!selectedOrganizationId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Debug logs
  useEffect(() => {
    console.log('[SectionContentDialog] State:', {
      open,
      sectionId: section?.section_execution_id,
      orgId: selectedOrganizationId,
      status,
      isLoading,
      isFetching,
      hasError: !!error,
      errorMessage: error?.message,
      hasContent: !!fullSectionContent,
      contentType: typeof fullSectionContent,
      contentLength: fullSectionContent?.length || 0,
    });
  }, [open, section, selectedOrganizationId, status, isLoading, isFetching, error, fullSectionContent]);

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

  // Process content to replace \n with actual newlines
  const displayedContent = useMemo(() => {
    if (!fullSectionContent) return '';
    return fullSectionContent.replace(/\\n/g, "\n");
  }, [fullSectionContent]);

  const dialogTitle = section.section_execution_name || `Sección ${index + 1}`;
  const dialogDescription = isLoading ? 'Loading full content...' : 
                           error ? 'Section content (search result only)' : 
                           'Full section content';

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={dialogDescription}
      icon={FileText}
      maxWidth="2xl"
      maxHeight="90vh"
    >
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading full section content...</span>
          </div>
        ) : error || !fullSectionContent ? (
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
          <HighlightedMarkdown
            title={dialogTitle}
            markdown={displayedContent}
            highlightFragment={section.content}
            withCard={false}
            className="prose prose-sm max-w-none"
          />
        )}
      </div>
    </ReusableDialog>
  );
}
