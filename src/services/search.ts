import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

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

export interface SearchResultDocument {
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
    data: SearchResultDocument[];
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

export async function search({
    query,
    organizationId,
    search_type = 'semantic',
    document_type_id,
    template_id,
    created_by,
    lifecycle_state,
    filter_with_llm = true,
    owner_scope,
    has_unresolved_comments,
    has_pending_ai_suggestion,
    expiration_date,
    expiration_date_from,
    expiration_date_to,
    estimated_publication_date,
    estimated_publication_date_from,
    estimated_publication_date_to,
    review_date,
    review_date_from,
    review_date_to,
    audit_date,
    audit_date_from,
    audit_date_to,
    sort,
    page = 1,
    page_size = 100,
}: SearchParams) {
    const params = new URLSearchParams();
    params.set('query', query);
    params.set('search_type', search_type);
    params.set('filter_with_llm', String(filter_with_llm));
    params.set('page', String(page));
    params.set('page_size', String(page_size));
    if (document_type_id != null) params.set('document_type_id', document_type_id);
    if (template_id != null) params.set('template_id', template_id);
    if (created_by != null) params.set('created_by', created_by);
    if (lifecycle_state != null) params.set('lifecycle_state', lifecycle_state);
    if (owner_scope != null) params.set('owner_scope', owner_scope);
    if (has_unresolved_comments != null) params.set('has_unresolved_comments', String(has_unresolved_comments));
    if (has_pending_ai_suggestion != null) params.set('has_pending_ai_suggestion', String(has_pending_ai_suggestion));
    if (expiration_date != null) params.set('expiration_date', expiration_date);
    if (expiration_date_from != null) params.set('expiration_date_from', expiration_date_from);
    if (expiration_date_to != null) params.set('expiration_date_to', expiration_date_to);
    if (estimated_publication_date != null) params.set('estimated_publication_date', estimated_publication_date);
    if (estimated_publication_date_from != null) params.set('estimated_publication_date_from', estimated_publication_date_from);
    if (estimated_publication_date_to != null) params.set('estimated_publication_date_to', estimated_publication_date_to);
    if (review_date != null) params.set('review_date', review_date);
    if (review_date_from != null) params.set('review_date_from', review_date_from);
    if (review_date_to != null) params.set('review_date_to', review_date_to);
    if (audit_date != null) params.set('audit_date', audit_date);
    if (audit_date_from != null) params.set('audit_date_from', audit_date_from);
    if (audit_date_to != null) params.set('audit_date_to', audit_date_to);
    if (sort != null) params.set('sort', sort);

    const response = await httpClient.get(`${backendUrl}/search/?${params.toString()}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data: SearchResponse = await response.json();
    return data;
}
