import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { toDateParam } from "@/lib/date-params";
import type {
    SearchType,
    SearchResultSection,
    SearchResultExecution,
    ServiceSearchResultDocument,
    SearchResponse,
    SearchParams,
    SearchPassagesParams,
    SearchPassagesResponse,
    SearchFeedbackRequest,
    SearchLogFeedbackItem,
    SearchLogsResponse,
} from "@/types/search";

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
    tag_id?.forEach((id) => params.append('tag_id', id));
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

/**
 * Búsqueda por pasajes (`GET /search/passages`): híbrida (significado + palabras + código y
 * nombre del activo) y, con `highPrecision`, reordenada por el LLM de rerank de la
 * organización (503 RERANK_LLM_NOT_CONFIGURED si no hay uno marcado).
 */
export async function searchPassages({
    organizationId,
    query,
    topK = 12,
    versionScope = 'official',
    lifecycleStates,
    documentTypeIds,
    templateId,
    ownerScope,
    createdBy,
    tagIds,
    hasUnresolvedComments,
    hasPendingAiSuggestion,
    businessDates,
    customFieldFilter,
    searchIn,
    highPrecision = false,
    page,
    pageSize,
}: SearchPassagesParams): Promise<SearchPassagesResponse> {
    const params = new URLSearchParams();
    params.set('query', query);
    // page_size manda sobre top_k en el backend; top_k queda para quien no pagina.
    if (pageSize != null) params.set('page_size', String(pageSize));
    else params.set('top_k', String(topK));
    if (page != null) params.set('page', String(page));
    params.set('version_scope', versionScope);
    params.set('high_precision', String(highPrecision));
    lifecycleStates?.forEach((state) => params.append('lifecycle_state', state));
    documentTypeIds?.forEach((id) => params.append('document_type_id', id));
    if (templateId) params.set('template_id', templateId);
    if (ownerScope) params.set('owner_scope', ownerScope);
    if (createdBy) params.set('created_by', createdBy);
    tagIds?.forEach((id) => params.append('tag_id', id));
    if (hasUnresolvedComments != null) params.set('has_unresolved_comments', String(hasUnresolvedComments));
    if (hasPendingAiSuggestion != null) params.set('has_pending_ai_suggestion', String(hasPendingAiSuggestion));
    Object.entries(businessDates ?? {}).forEach(([key, value]) => {
        if (value) params.set(key, toDateParam(value));
    });
    customFieldFilter?.forEach((f) => params.append('custom_field_filter', f));
    searchIn?.forEach((scope) => params.append('search_in', scope));

    const response = await httpClient.get(`${backendUrl}/search/passages?${params.toString()}`, {
        headers: { 'X-Org-Id': organizationId },
    });
    const data = await response.json();
    return data.data as SearchPassagesResponse;
}

/** Feedback útil / no útil sobre un pasaje o sobre la búsqueda completa. */
export async function createSearchFeedback(organizationId: string, body: SearchFeedbackRequest): Promise<{ id: string }> {
    const response = await httpClient.post(`${backendUrl}/search/feedback`, body, {
        headers: { 'X-Org-Id': organizationId },
    });
    const data = await response.json();
    return data.data;
}

/** Búsquedas registradas, las más recientes primero (solo org admins). */
export async function getSearchLogs(
    organizationId: string,
    { page = 1, pageSize = 50, onlyWithFeedback = false }: { page?: number; pageSize?: number; onlyWithFeedback?: boolean } = {},
): Promise<SearchLogsResponse> {
    const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        only_with_feedback: String(onlyWithFeedback),
    });
    const response = await httpClient.get(`${backendUrl}/search/logs?${params.toString()}`, {
        headers: { 'X-Org-Id': organizationId },
    });
    return response.json();
}

/** Feedback registrado para una búsqueda (solo org admins). */
export async function getSearchLogFeedback(organizationId: string, searchLogId: string): Promise<SearchLogFeedbackItem[]> {
    const response = await httpClient.get(`${backendUrl}/search/logs/${searchLogId}/feedback`, {
        headers: { 'X-Org-Id': organizationId },
    });
    const data = await response.json();
    return (data.data ?? []) as SearchLogFeedbackItem[];
}
