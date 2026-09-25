import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import type { AddSectionExecutionRequest, AiSuggestionStatus, ReviewStatus, SectionHistoryChangeType, SectionHistoryEntry, SectionHistoryResponse } from "@/types/section-execution";
import type { FormAnswerPayload, FormValuesSectionPayload } from "@/types/sections/core";

export type { AddSectionExecutionRequest, AiSuggestionStatus, ReviewStatus, SectionHistoryChangeType, SectionHistoryEntry, SectionHistoryResponse };


export async function modifyContent(sectionId: string, content: string, plateContent?: string[]) {
    logger.log(`Modifying content for section ID: ${sectionId}`);
    const body: { new_content: string; plate_content?: string[] } = { new_content: content };
    if (plateContent) {
        body.plate_content = plateContent;
    }
    const response = await httpClient.put(`${backendUrl}/section_executions/${sectionId}/modify_content`, body);

    const data = await response.json();
    logger.log('Section content modified:', data.data);
    return data.data;
}


export async function deleteSectionExec(sectionExecId: string) {
    const response = await httpClient.delete(`${backendUrl}/section_executions/${sectionExecId}`);

    const data = await response.json();
    logger.log('Section deleted:', data);
    return data;
}

export async function createSectionExecution(executionId: string, sectionData: AddSectionExecutionRequest) {
    logger.log(`Creating section execution for execution ID: ${executionId}`);
    const response = await httpClient.post(`${backendUrl}/section_executions/${executionId}`, sectionData);

    const data = await response.json();
    logger.log('Section execution created:', data.data);
    return data.data;
}

export async function linkSectionToExecution(executionId: string, sectionId: string, organizationId?: string) {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }

    const response = await httpClient.post(
        `${backendUrl}/section_executions/${executionId}/link`,
        { section_id: sectionId },
        { headers }
    );

    const data = await response.json();
    logger.log('Section linked to execution:', data.data);
    return data.data;
}

export async function getSectionExecutionContent(sectionExecutionId: string, organizationId?: string) {
    logger.log(`Getting content for section execution ID: ${sectionExecutionId}`);
    
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    
    const response = await httpClient.get(`${backendUrl}/section_executions/${sectionExecutionId}/content`, {
        headers,
    });

    const data = await response.json();
    logger.log('Section execution content:', data.data);
    
    // Extract the actual content from the response
    if (data.data && typeof data.data === 'object' && data.data.output) {
        const output = data.data.output;
        logger.log('Returning output, type:', typeof output, 'length:', output?.length || 0);
        return output;
    }
    
    // Fallback in case the structure is different
    logger.warn('Unexpected data structure, returning fallback:', data.data);
    return data.data || '';
}

export async function createAiSuggestion(
    sectionExecutionId: string,
    instruction: string,
    organizationId?: string
): Promise<void> {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    await httpClient.post(
        `${backendUrl}/section_executions/${sectionExecutionId}/ai_suggestion`,
        { instruction },
        { headers }
    );
}

export async function getAiSuggestion(
    sectionExecutionId: string,
    organizationId?: string
): Promise<AiSuggestionStatus> {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    const response = await httpClient.get(
        `${backendUrl}/section_executions/${sectionExecutionId}/ai_suggestion`,
        { headers }
    );
    const data = await response.json();
    return data.data as AiSuggestionStatus;
}

export async function acceptAiSuggestion(
    sectionExecutionId: string,
    organizationId?: string
): Promise<void> {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    await httpClient.post(
        `${backendUrl}/section_executions/${sectionExecutionId}/ai_suggestion/accept`,
        {},
        { headers }
    );
}

export async function rejectAiSuggestion(
    sectionExecutionId: string,
    organizationId?: string
): Promise<void> {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    await httpClient.post(
        `${backendUrl}/section_executions/${sectionExecutionId}/ai_suggestion/reject`,
        {},
        { headers }
    );
}

export async function updateReviewStatus(
    sectionExecutionId: string,
    reviewStatus: ReviewStatus,
    organizationId?: string
): Promise<void> {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    await httpClient.patch(
        `${backendUrl}/section_executions/${sectionExecutionId}/review_status`,
        { review_status: reviewStatus },
        { headers }
    );
}

// â”€â”€â”€ Form values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Rechaza con 400 ("'<field>' is a calculated field; its value cannot be set directly.")
// si `values` incluye el id de un campo campo_calculado_formula/campo_calculado_condicional
// (ver ia context/campos-calculados-en-formularios-guide.md) — el caller ya los excluye vía
// isFieldAnswerable antes de armar el payload. La respuesta sí incluye, ya recalculados, los
// campos calculados de TODA la ejecución afectados por este guardado (cross-sección).
export async function updateSectionFormValues(
    sectionExecutionId: string,
    values: { id: string; value: unknown }[],
    organizationId?: string
): Promise<FormValuesSectionPayload[]> {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    const response = await httpClient.patch(
        `${backendUrl}/section_executions/${sectionExecutionId}/form_values`,
        { values },
        { headers }
    );
    const data = await response.json();
    return data.data as FormValuesSectionPayload[];
}

// Mismo rechazo de 400 que updateSectionFormValues para un id de campo calculado. A
// diferencia de ese endpoint, la respuesta solo trae form_fields de ESTA sección — un
// recálculo cross-sección disparado por esta respuesta se guarda en el backend pero no se
// refleja acá (hay que refrescar la otra sección aparte). Sin consumidor en el repo aún.
export async function answerSectionFormQuestion(
    sectionExecutionId: string,
    id: string,
    value: unknown,
    organizationId?: string
): Promise<FormAnswerPayload> {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    const response = await httpClient.patch(
        `${backendUrl}/section_executions/${sectionExecutionId}/form_answer`,
        { id, value },
        { headers }
    );
    const data = await response.json();
    return data.data as FormAnswerPayload;
}

// â”€â”€â”€ Section History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getSectionExecutionHistory(
    sectionExecutionId: string,
    organizationId?: string
): Promise<SectionHistoryResponse> {
    const headers: Record<string, string> = {};
    if (organizationId) {
        headers['X-Org-Id'] = organizationId;
    }
    const response = await httpClient.get(
        `${backendUrl}/section_executions/${sectionExecutionId}/history`,
        { headers }
    );
    const data = await response.json();
    return data.data as SectionHistoryResponse;
}
