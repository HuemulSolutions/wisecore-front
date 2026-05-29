export type SearchType = 'semantic' | 'title' | 'code' | 'content';

export interface SearchResultSection {
  section_execution_id: string;
  section_execution_name: string;
  content: string;
}

export interface SearchResultExecution {
  execution_id: string;
  execution_name: string;
  execution_status: string;
  lifecycle_state: string;
  matched_on: string;
  match_count: number;
  sections: SearchResultSection[];
}

export interface ServiceSearchResultDocument {
  document_id: string;
  document_name: string;
  document_internal_code: string;
  document_type_id: string;
  template_id: string;
  created_by: string;
  matched_on: string;
  match_count: number;
  executions: SearchResultExecution[];
}

export interface SearchResponse {
  data: ServiceSearchResultDocument[];
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface SearchParams {
  query: string;
  organizationId: string;
  search_type?: SearchType;
  document_type_id?: string | null;
  template_id?: string | null;
  created_by?: string | null;
  lifecycle_state?: string | null;
  filter_with_llm?: boolean;
  owner_scope?: string | null;
  has_unresolved_comments?: boolean | null;
  has_pending_ai_suggestion?: boolean | null;
  expiration_date?: string | null;
  expiration_date_from?: string | null;
  expiration_date_to?: string | null;
  estimated_publication_date?: string | null;
  estimated_publication_date_from?: string | null;
  estimated_publication_date_to?: string | null;
  review_date?: string | null;
  review_date_from?: string | null;
  review_date_to?: string | null;
  audit_date?: string | null;
  audit_date_from?: string | null;
  audit_date_to?: string | null;
  sort?: string | null;
  page?: number;
  page_size?: number;
}
