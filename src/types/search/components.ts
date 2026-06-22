import type { SearchResultDocument, SearchResultExecution } from '@/services/search'
import type { SearchResultSection } from '@/services/search'

export interface ExecutionResultProps {
  execution: SearchResultExecution;
  documentId: string;
}

export interface DocumentResultProps {
  document: SearchResultDocument;
}

export interface SectionContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SearchResultSection | null;
  index: number;
}

export interface SectionResultProps {
  section: SearchResultSection;
  index: number;
}
