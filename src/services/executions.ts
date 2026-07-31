import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import { toDateParam } from "@/lib/date-params";
import { ApiError } from "@/types/api-error";
import type { ExecutionsResponse, GetExecutionsParams, RollbackTarget, RollbackStep, RollbackTargetsResponse, ExecutionVersionSuggestion, ExecutionVersionSuggestionResponse } from "@/types/execution";
import type { AvailableDocxTemplate, AvailableDocxTemplatesResponse } from "@/types/docx-templates";
import type { CompleteLifecycleStepResponse } from "@/types/lifecycle";

export type { RollbackTarget, RollbackStep, RollbackTargetsResponse, ExecutionVersionSuggestion };

export async function getAllExecutions(
  organizationId: string,
  params: GetExecutionsParams = {},
): Promise<ExecutionsResponse> {
  const {
    page = 1,
    page_size = 100,
    query,
    search_type,
    created_by,
    has_pending_ai_suggestion,
    lifecycle_state,
    owner_scope,
    has_unresolved_comments,
    expiring_soon,
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
    template_id,
    document_type_id,
    sort,
    custom_field_filter,
  } = params
  const qs = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (query?.trim()) qs.set('query', query.trim())
  if (search_type) qs.set('search_type', search_type)
  if (created_by) qs.set('created_by', created_by)
  if (has_pending_ai_suggestion != null) qs.set('has_pending_ai_suggestion', has_pending_ai_suggestion.toString())
  if (lifecycle_state) qs.set('lifecycle_state', lifecycle_state)
  if (owner_scope) qs.set('owner_scope', owner_scope)
  if (has_unresolved_comments != null) qs.set('has_unresolved_comments', has_unresolved_comments.toString())
  if (expiring_soon != null) qs.set('expiring_soon', expiring_soon.toString())
  if (expiration_date) qs.set('expiration_date', toDateParam(expiration_date))
  if (expiration_date_from) qs.set('expiration_date_from', toDateParam(expiration_date_from))
  if (expiration_date_to) qs.set('expiration_date_to', toDateParam(expiration_date_to))
  if (estimated_publication_date) qs.set('estimated_publication_date', toDateParam(estimated_publication_date))
  if (estimated_publication_date_from) qs.set('estimated_publication_date_from', toDateParam(estimated_publication_date_from))
  if (estimated_publication_date_to) qs.set('estimated_publication_date_to', toDateParam(estimated_publication_date_to))
  if (review_date) qs.set('review_date', toDateParam(review_date))
  if (review_date_from) qs.set('review_date_from', toDateParam(review_date_from))
  if (review_date_to) qs.set('review_date_to', toDateParam(review_date_to))
  if (audit_date) qs.set('audit_date', toDateParam(audit_date))
  if (audit_date_from) qs.set('audit_date_from', toDateParam(audit_date_from))
  if (audit_date_to) qs.set('audit_date_to', toDateParam(audit_date_to))
  if (template_id) qs.set('template_id', template_id)
  if (document_type_id) qs.set('document_type_id', document_type_id)
  if (sort) qs.set('sort', sort)
  custom_field_filter?.forEach(f => qs.append('custom_field_filter', f))
  const response = await httpClient.get(`${backendUrl}/execution/?${qs}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<ExecutionsResponse>
}

export async function getExecutionsByDocumentId(documentId: string, organizationId: string) {
    logger.log(`Fetching executions for document ID: ${documentId}`);
    const response = await httpClient.get(`${backendUrl}/documents/${documentId}/executions`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    logger.log(`Fetched ${data.data.length} executions for document ID: ${documentId}`);
    return data.data;
}

export async function getExecutionById(executionId: string, organizationId: string) {
    logger.log(`Fetching execution with ID: ${executionId}`);
    const response = await httpClient.get(`${backendUrl}/execution/${executionId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    logger.log('Execution fetched:', data.data);
    return data.data;
}

export async function getExecutionStatus(executionId: string, organizationId: string) {
    logger.log(`Fetching execution status with ID: ${executionId}`);
    const response = await httpClient.get(`${backendUrl}/execution/${executionId}/status`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    
    const data = await response.json();
    logger.log('Execution status fetched:', data);
    return data.data || data; // Handle both data.data and direct data response
}

export async function getExecutionSectionsStatus(executionId: string, organizationId: string) {
    logger.log(`Fetching sections status for execution ID: ${executionId}`);
    const response = await httpClient.get(`${backendUrl}/execution/${executionId}/sections_status`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    
    const data = await response.json();
    logger.log('Sections status fetched:', data.data);
    return data.data;
}

export async function createExecution(documentId: string, organizationId: string) {
    logger.log(`Creating execution for document ID: ${documentId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${documentId}`, {}, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    logger.log('Execution created:', data.data);
    return data.data;
}

export async function executeDocument({
    documentId,
    llmId,
    instructions,
    organizationId,
    singleSectionMode,
    startSectionId,
    executionId
}: {
    documentId: string;
    llmId: string;
    instructions?: string;
    organizationId: string;
    singleSectionMode?: boolean;
    startSectionId?: string;
    executionId?: string;
}) {
    logger.log(`Executing document with ID: ${documentId}`);
    
    const requestBody: Record<string, unknown> = {
        document_id: documentId,
        llm_id: llmId
    };
    
    // Add optional parameters only when they have values
    if (instructions) {
        requestBody.instructions = instructions;
    }
    
    if (executionId) {
        requestBody.execution_id = executionId;
    }
    
    if (startSectionId) {
        requestBody.start_section_id = startSectionId;
    }
    
    // Include single_section_mode when explicitly provided
    if (singleSectionMode !== undefined) {
        requestBody.single_section_mode = singleSectionMode;
    }
    
    const response = await httpClient.post(`${backendUrl}/execution/generate`, requestBody, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    logger.log('Document execution started:', data.data);
    return data.data;
}


export async function deleteExecution(executionId: string, organizationId: string) {
    logger.log(`Deleting execution with ID: ${executionId}`);
    const response = await httpClient.delete(`${backendUrl}/execution/${executionId}`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    logger.log('Execution deleted:', data);
    return data;
}


export async function updateLLM(executionId: string, llmId: string, organizationId: string) {
    logger.log(`Updating LLM for execution ID: ${executionId} with LLM ID: ${llmId}`);
    const response = await httpClient.put(`${backendUrl}/execution/update_llm/${executionId}`, { llm_id: llmId }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });

    const data = await response.json();
    logger.log('LLM updated for execution:', data.data);
    return data.data;
}

async function exportExecutionFile(executionId: string, exportType: 'markdown' | 'word' | 'custom_word' | 'excel', organizationId: string) {
    const endpoints = {
        markdown: `execution/${executionId}/export_markdown`,
        word: `execution/${executionId}/export_word`,
        custom_word: `execution/${executionId}/export_custom_word`,
        excel: `execution/${executionId}/export_excel`
    };
    
    const extensions = {
        markdown: 'md',
        word: 'docx',
        custom_word: 'docx',
        excel: 'xlsx'
    };
        
    logger.log(`Exporting execution to ${exportType} for ID: ${executionId}`);
    
    // Usar fetch nativo para tener acceso completo a los headers
    const orgToken = httpClient.getOrganizationToken();
    const response = await fetch(`${backendUrl}/${endpoints[exportType]}`, {
        headers: {
            'Authorization': `Bearer ${orgToken}`,
            'X-Org-Id': organizationId,
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error al exportar la ejecuciÃ³n a ${exportType}`);
    }

    // Obtener el contenido del archivo y el nombre del archivo desde los headers
    const blob = await response.blob();
    
    const contentDisposition = response.headers.get('content-disposition');
    
    // Extraer el nombre del archivo del header content-disposition
    let filename = `execution_${executionId}.${extensions[exportType]}`;
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/) || 
                             contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].trim();
        }
    }
    
    // Crear el enlace de descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Disparar la descarga
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    logger.log(`Execution exported successfully as: ${filename}`);
    return { success: true };
}

export async function exportExecutionToMarkdown(executionId: string, organizationId: string) {
    return exportExecutionFile(executionId, 'markdown', organizationId);
}

export async function exportExecutionToWord(executionId: string, organizationId: string) {
    return exportExecutionFile(executionId, 'word', organizationId);
}

export async function exportExecutionCustomWord(
    executionId: string,
    organizationId: string,
    options: { docxTemplateId?: string; file?: File } = {},
): Promise<{ success: true }> {
    const { docxTemplateId, file } = options
    const orgToken = httpClient.getOrganizationToken()

    const formData = new FormData()
    if (docxTemplateId) formData.append('docx_template_id', docxTemplateId)
    if (file) formData.append('file', file)

    const response = await fetch(`${backendUrl}/execution/${executionId}/export_custom_word`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${orgToken}`,
            'X-Org-Id': organizationId,
        },
        body: formData,
    })

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        if (ApiError.isApiErrorResponse(errorBody)) throw new ApiError(errorBody)
        throw new Error(errorBody?.message ?? 'Error al exportar a Word')
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `execution_${executionId}.docx`
    if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/) ||
                      contentDisposition.match(/filename=([^;]+)/)
        if (match?.[1]) filename = match[1].trim()
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true }
}

export async function getAvailableDocxTemplatesForExecution(
    executionId: string,
    organizationId: string,
): Promise<AvailableDocxTemplate[]> {
    const response = await httpClient.get(
        `${backendUrl}/execution/${executionId}/available_docx_templates`,
        { headers: { 'X-Org-Id': organizationId } },
    )
    const data = (await response.json()) as AvailableDocxTemplatesResponse
    return data.data
}

export async function exportExecutionToExcel(executionId: string, organizationId: string) {
    return exportExecutionFile(executionId, 'excel', organizationId);
}

export async function approveExecution(executionId: string, organizationId: string) {
    logger.log(`Approving execution with ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${executionId}/approve`, {}, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    logger.log('Execution approved:', data.data);
    return data.data;
}

export async function disapproveExecution(executionId: string, organizationId: string) {
    logger.log(`Disapproving execution with ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${executionId}/dissapprove`, {}, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    logger.log('Execution disapproved:', data.data);
    return data.data;
}

export async function cloneExecution(executionId: string, organizationId: string) {
    logger.log(`Cloning execution with ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/execution/${executionId}/clone`, undefined, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    logger.log('Execution cloned:', data.data);
    return data.data;
}

export async function cloneExecutionToNewDocument(
    executionId: string,
    organizationId: string,
    options: {
        name?: string;
        internal_code?: string;
        description?: string;
        folder_id?: string;
    } = {},
) {
    logger.log(`Cloning execution with ID: ${executionId} to new document`);
    const body: Record<string, string> = { mode: 'new_document' };
    if (options.name) body.name = options.name;
    if (options.internal_code) body.internal_code = options.internal_code;
    if (options.description) body.description = options.description;
    if (options.folder_id) body.folder_id = options.folder_id;
    const response = await httpClient.post(`${backendUrl}/execution/${executionId}/clone`, body, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    logger.log('Execution cloned to new document:', data.data);
    return data.data;
}

export async function completeExecutionLifecycleStep(
    executionId: string,
    stepId: string,
    organizationId: string,
    options?: { comment?: string; run_external_review?: boolean },
): Promise<CompleteLifecycleStepResponse> {
    const response = await httpClient.post(`${backendUrl}/execution-lifecycle/${executionId}/steps/${stepId}/complete`, {
        comment: options?.comment || '',
        ...(options?.run_external_review && { run_external_review: true }),
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function advanceExecutionLifecycle(
    executionId: string,
    organizationId: string,
    options?: {
        comment?: string
        skip_published?: boolean
        publish_step_id?: string
        run_external_publish?: boolean
    },
) {
    const response = await httpClient.post(`${backendUrl}/execution-lifecycle/${executionId}/advance`, {
        comment: options?.comment || '',
        ...(options?.skip_published && { skip_published: true }),
        ...(options?.publish_step_id && { publish_step_id: options.publish_step_id }),
        ...(options?.run_external_publish && { run_external_publish: true }),
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function getRollbackTargets(executionId: string, organizationId: string): Promise<RollbackTargetsResponse> {
    const response = await httpClient.get(`${backendUrl}/execution-lifecycle/${executionId}/rollback-targets`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function rejectExecutionLifecycle(
    executionId: string,
    organizationId: string,
    options?: { comment?: string; target_state?: string; target_step_id?: string }
) {
    const response = await httpClient.post(`${backendUrl}/execution-lifecycle/${executionId}/reject`, {
        comment: options?.comment || '',
        ...(options?.target_state && { target_state: options.target_state }),
        ...(options?.target_step_id && { target_step_id: options.target_step_id }),
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function restoreExecutionLifecycle(
    executionId: string,
    organizationId: string,
    options?: { comment?: string },
) {
    const response = await httpClient.post(`${backendUrl}/execution-lifecycle/${executionId}/restore`, {
        comment: options?.comment || '',
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function assignExecutionVersion(
    executionId: string,
    version: { major: number; minor: number; patch: number },
    organizationId: string
) {
    const response = await httpClient.patch(`${backendUrl}/execution/${executionId}/version`, version, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function getExecutionVersionSuggestion(
    executionId: string,
    organizationId: string
): Promise<ExecutionVersionSuggestion> {
    const response = await httpClient.get(`${backendUrl}/execution/${executionId}/version/suggestion`, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = (await response.json()) as ExecutionVersionSuggestionResponse;
    return data.data;
}

export async function updateExecutionName(
    executionId: string,
    name: string,
    organizationId: string
) {
    const response = await httpClient.patch(`${backendUrl}/execution/${executionId}/update_name`, { name }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function updateExecutionBusinessDates(
    executionId: string,
    dates: {
        expiration_date?: string | null;
        estimated_publication_date?: string | null;
        review_date?: string | null;
        audit_date?: string | null;
    },
    organizationId: string
) {
    const response = await httpClient.patch(`${backendUrl}/execution/${executionId}/business-dates`, dates, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function bulkGenerateByTemplateSection({
    executionIds,
    templateSectionId,
    llmId,
    instructions,
    singleSectionMode,
    organizationId,
}: {
    executionIds: string[];
    templateSectionId: string;
    llmId: string;
    instructions?: string;
    singleSectionMode: boolean;
    organizationId: string;
}) {
    const response = await httpClient.post(`${backendUrl}/execution/bulk_generate_by_template_section`, {
        execution_ids: executionIds,
        template_section_id: templateSectionId,
        llm_id: llmId,
        instructions: instructions || "",
        single_section_mode: singleSectionMode,
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function bulkAiFixByTemplateSection({
    executionIds,
    templateSectionId,
    instruction,
    autoApply,
    organizationId,
}: {
    executionIds: string[];
    templateSectionId: string;
    instruction?: string;
    autoApply: boolean;
    organizationId: string;
}) {
    const response = await httpClient.post(`${backendUrl}/section_executions/bulk_ai_fix_by_template_section`, {
        execution_ids: executionIds,
        template_section_id: templateSectionId,
        instruction: instruction || "",
        auto_apply: autoApply,
    }, {
        headers: {
            'X-Org-Id': organizationId,
        },
    });
    const data = await response.json();
    return data.data;
}

export async function runExternalPublish(
    executionId: string,
    organizationId: string,
    publishStepId: string,
) {
    const res = await httpClient.post(
        `${backendUrl}/execution-lifecycle/${executionId}/run-external-publish`,
        { publish_step_id: publishStepId },
        { headers: { 'X-Org-Id': organizationId } },
    )
    const data = await res.json()
    return data.data
}

export async function bulkExportExcel({
    templateId,
    executionIds,
    templateSectionIds,
    organizationId,
}: {
    templateId: string;
    executionIds: string[];
    templateSectionIds: string[];
    organizationId: string;
}) {
    const orgToken = httpClient.getOrganizationToken();
    const response = await fetch(`${backendUrl}/execution/bulk_export_excel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${orgToken}`,
            'X-Org-Id': organizationId,
        },
        body: JSON.stringify({
            template_id: templateId,
            execution_ids: executionIds,
            template_section_ids: templateSectionIds,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        if (ApiError.isApiErrorResponse(errorBody)) {
            throw new ApiError(errorBody);
        }
        throw new Error(errorBody?.message ?? 'Error al exportar a Excel');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');

    let filename = `bulk_export.xlsx`;
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/) ||
                             contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].trim();
        }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
}

export async function bulkExportCustomWord({
    templateId,
    executionIds,
    docxTemplateId,
    file,
    organizationId,
}: {
    templateId: string;
    executionIds: string[];
    docxTemplateId?: string | null;
    file?: File | null;
    organizationId: string;
}) {
    const orgToken = httpClient.getOrganizationToken();

    const formData = new FormData();
    formData.append('template_id', templateId);
    executionIds.forEach((id) => formData.append('execution_ids', id));
    if (docxTemplateId) formData.append('docx_template_id', docxTemplateId);
    if (file) formData.append('file', file);

    const response = await fetch(`${backendUrl}/execution/bulk_export_custom_word`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${orgToken}`,
            'X-Org-Id': organizationId,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        if (ApiError.isApiErrorResponse(errorBody)) {
            throw new ApiError(errorBody);
        }
        throw new Error(errorBody?.message ?? 'Error al exportar a Word');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');

    let filename = `bulk_export.zip`;
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/) ||
                             contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].trim();
        }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
}
