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

    const response = await httpClient.get(`${backendUrl}/search/?${params.toString()}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data: SearchResponse = await response.json();
    return data;
}
