import type { SearchResultSection } from '@/services/search'

export interface SearchResultDocument {
  document_id: string;
  execution_id: string;
  document_name: string;
  sections: SearchResultSection[];
}

export interface SearchResultProps {
  documents: SearchResultDocument[];
}
