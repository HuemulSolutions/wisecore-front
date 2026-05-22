import type { SearchResultDocument, SearchResultExecution } from '@/services/search'

export interface ExecutionResultProps {
  execution: SearchResultExecution;
  documentId: string;
}

export interface DocumentResultProps {
  document: SearchResultDocument;
}
