import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Markdown from "@/components/ui/markdown";
import { FileText } from "lucide-react";
import { useEffect, useRef } from "react";

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

  // Highlight matching content when dialog opens
  useEffect(() => {
    if (open && contentRef.current && section?.content) {
      // Simple highlight - you can enhance this based on actual search terms
      const content = contentRef.current;
      
      // Add a slight delay to ensure content is rendered
      setTimeout(() => {
        const firstParagraph = content.querySelector('p');
        if (firstParagraph) {
          firstParagraph.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [open, section]);

  if (!section) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
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
                Section content
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto px-2 py-4"
        >
          <div className="prose prose-sm max-w-none">
            <Markdown>{section.content}</Markdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
