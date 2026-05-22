import type { SearchType } from '@/services/search'

export interface SearchFilterValues {
  document_type_id?: string | null;
  template_id?: string | null;
  created_by?: string | null;
  lifecycle_state?: string | null;
  filter_with_llm: boolean;
}

export interface SearchFiltersProps {
  organizationId: string;
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  onApply: (filters: SearchFilterValues) => void;
  initialFilters?: SearchFilterValues;
  defaultOpen?: boolean;
}
