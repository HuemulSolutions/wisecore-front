import { HuemulDialog } from "@/huemul/components/huemul-dialog";
import Markdown from "@/components/ui/markdown";
import { FileText } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation('search');

  const displayedContent = useMemo(() => {
    return (section?.content ?? "").replace(/\\n/g, "\n");
  }, [section?.content]);

  const dialogTitle = section?.section_execution_name || t('section.fallbackName', { number: index + 1 });

  if (!section) return null;

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={t('section.contentDescription')}
      icon={FileText}
      showFooter={false}
      maxWidth="sm:max-w-2xl"
      maxHeight="max-h-[90vh]"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <Markdown>{displayedContent}</Markdown>
        </div>
      </div>
    </HuemulDialog>
  );
}
