import { ReusableDialog } from "@/components/ui/reusable-dialog";
import Markdown from "@/components/ui/markdown";
import { FileText } from "lucide-react";
import { useMemo } from "react";

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
  if (!section) return null;

  const displayedContent = useMemo(() => {
    return (section.content ?? "").replace(/\\n/g, "\n");
  }, [section.content]);

  const dialogTitle = section.section_execution_name || `Section ${index + 1}`;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description="Section content"
      icon={FileText}
      maxWidth="2xl"
      maxHeight="90vh"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <Markdown>{displayedContent}</Markdown>
        </div>
      </div>
    </ReusableDialog>
  );
}
