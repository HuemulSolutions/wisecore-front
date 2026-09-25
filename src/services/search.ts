import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { toDateParam } from "@/lib/date-params";
import type { SearchType, SearchResultSection, SearchResultExecution, ServiceSearchResultDocument, SearchResponse, SearchParams } from "@/types/search";

export type { SearchType, SearchResultSection, SearchResultExecution, ServiceSearchResultDocument as SearchResultDocument, SearchResponse, SearchParams };

export async function search({
    query,
    organizationId,
    search_type = 'semantic',
    document_type_id,
    template_id,
    tag_id,
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
    custom_field_filter,
}: SearchParams) {
    const params = new URLSearchParams();
    params.set('query', query);
    params.set('search_type', search_type);
    params.set('filter_with_llm', String(filter_with_llm));
    params.set('page', String(page));
    params.set('page_size', String(page_size));
    if (document_type_id != null) params.set('document_type_id', document_type_id);
    if (template_id != null) params.set('template_id', template_id);
    // Sin confirmar contra backend — ver nota en types/search/core.ts.
    if (tag_id != null) params.set('tag_id', tag_id);
    if (created_by != null) params.set('created_by', created_by);
    if (lifecycle_state != null) params.set('lifecycle_state', lifecycle_state);
    if (owner_scope != null) params.set('owner_scope', owner_scope);
    if (has_unresolved_comments != null) params.set('has_unresolved_comments', String(has_unresolved_comments));
    if (has_pending_ai_suggestion != null) params.set('has_pending_ai_suggestion', String(has_pending_ai_suggestion));
    if (expiration_date != null) params.set('expiration_date', toDateParam(expiration_date));
    if (expiration_date_from != null) params.set('expiration_date_from', toDateParam(expiration_date_from));
    if (expiration_date_to != null) params.set('expiration_date_to', toDateParam(expiration_date_to));
    if (estimated_publication_date != null) params.set('estimated_publication_date', toDateParam(estimated_publication_date));
    if (estimated_publication_date_from != null) params.set('estimated_publication_date_from', toDateParam(estimated_publication_date_from));
    if (estimated_publication_date_to != null) params.set('estimated_publication_date_to', toDateParam(estimated_publication_date_to));
    if (review_date != null) params.set('review_date', toDateParam(review_date));
    if (review_date_from != null) params.set('review_date_from', toDateParam(review_date_from));
    if (review_date_to != null) params.set('review_date_to', toDateParam(review_date_to));
    if (audit_date != null) params.set('audit_date', toDateParam(audit_date));
    if (audit_date_from != null) params.set('audit_date_from', toDateParam(audit_date_from));
    if (audit_date_to != null) params.set('audit_date_to', toDateParam(audit_date_to));
    if (sort != null) params.set('sort', sort);
    custom_field_filter?.forEach(f => params.append('custom_field_filter', f));

    const response = await httpClient.get(`${backendUrl}/search/?${params.toString()}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data: SearchResponse = await response.json();
    return data;
}
