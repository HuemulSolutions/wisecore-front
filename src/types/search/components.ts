import type { SearchResultDocument, SearchResultExecution } from '@/services/search'
import type { SearchResultSection } from '@/services/search'
import type { SearchType } from '@/services/search'

export interface ExecutionResultProps {
  execution: SearchResultExecution;
  documentId: string;
}

export interface DocumentResultProps {
  document: SearchResultDocument;
}

export interface SearchFilterValues {
  document_type_id?: string | null;
  template_id?: string | null;
  ownerValue?: string | null;
  lifecycle_state?: string | null;
  filter_with_llm: boolean;
  has_unresolved_comments?: boolean;
  has_pending_ai_suggestion?: boolean;
  expiration_date?: string;
  expiration_date_from?: string;
  expiration_date_to?: string;
  estimated_publication_date?: string;
  estimated_publication_date_from?: string;
  estimated_publication_date_to?: string;
  review_date?: string;
  review_date_from?: string;
  review_date_to?: string;
  audit_date?: string;
  audit_date_from?: string;
  audit_date_to?: string;
}

export interface SearchFiltersProps {
  organizationId: string;
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  onApply: (filters: SearchFilterValues) => void;
  initialFilters?: SearchFilterValues;
  defaultOpen?: boolean;
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
