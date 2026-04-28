import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

interface SyncedDocumentResult {
  document_id: string;
  document_name: string;
  sections_created: number;
  sections_updated: number;
  sections_deleted: number;
  custom_sections_preserved: number;
}

interface SyncDocumentsFromTemplateResponse {
  template_id: string;
  template_name: string;
  synced_documents: SyncedDocumentResult[];
  total_documents_synced: number;
  errors: string[];
}

interface SyncTemplateFromDocumentResponse {
  template_id: string;
  template_name: string;
  document_id: string;
  document_name: string;
  sections_created: number;
  sections_updated: number;
  sections_deleted: number;
}

export async function getAllDocuments(organizationId: string, documentTypeId?: string) {
  const url = new URL(`${backendUrl}/documents/`);
  if (documentTypeId) {
    url.searchParams.append('document_type_id', documentTypeId);
  }
  
  const headers: Record<string, string> = {};
  if (organizationId) {
    headers['X-Org-Id'] = organizationId;
  }
  
  const response = await httpClient.get(url.toString(), {
    headers,
  });
  const data = await response.json();
  console.log('Documents fetched:', data.data);
  return data.data;
}

export async function getDocumentById(documentId: string, organizationId: string) {
  const response = await httpClient.get(`${backendUrl}/documents/${documentId}`, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  const data = await response.json();
  console.log('Document fetched:', data.data);
  return data.data;
}

export async function deleteDocument(documentId: string, organizationId: string) {
  await httpClient.delete(`${backendUrl}/documents/${documentId}`, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  console.log('Document deleted:', documentId);
  return true;
}

export async function getDocumentSections(documentId: string, organizationId: string) {
  const response = await httpClient.get(`${backendUrl}/documents/${documentId}/sections`, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  const data = await response.json();
  console.log('Document sections fetched:', data.data);
  return data.data;
}

export async function getDocumentSectionsConfig(documentId: string, organizationId: string, executionId?: string) {
  const url = new URL(`${backendUrl}/documents/${documentId}/sections_config`);
  if (executionId) {
    url.searchParams.append('execution_id', executionId);
  }

  const response = await httpClient.get(url.toString(), {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  const data = await response.json();
  console.log('Document sections config fetched:', data.data);
  return data.data;
}

export async function createDocument(documentData: { name: string; description?: string; 
  internal_code?: string; template_id?: string | null; document_type_id?: string, folder_id?: string }, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/documents/`, documentData, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  const data = await response.json();
  console.log('Document created:', data.data);
  return data.data;
}

export async function getDocumentContent(documentId: string, organizationId: string, executionId?: string) {
  const url = new URL(`${backendUrl}/documents/${documentId}/content`);
  if (executionId) {
    url.searchParams.append('execution_id', executionId);
  }

  const response = await httpClient.get(url.toString(), {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  const data = await response.json();
  console.log('Document content fetched:', data.data);
  return data.data;
}


export async function generateDocumentStructure(documentId: string, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/documents/${documentId}/generate`, {}, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  const data = await response.json();
  console.log('Document structure generation initiated:', data);
  return data;
}

export async function updateDocument(
  documentId: string, 
  documentData: { name?: string; description?: string; internal_code?: string; document_type_id?: string }, 
  organizationId: string
) {
  const response = await httpClient.put(`${backendUrl}/documents/${documentId}`, documentData, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  const data = await response.json();
  console.log('Document updated:', data.data);
  return data.data;
}

export async function moveDocument(documentId: string, newParentId: string | undefined, organizationId: string) {
  console.log('Moving document:', documentId, 'to parent:', newParentId);
  
  const response = await httpClient.put(`${backendUrl}/documents/${documentId}/move`, {
    folder_id: newParentId === undefined ? null : newParentId,
  }, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  const data = await response.json();
  console.log('Document moved:', data.data);
  return data.data;
}

export async function createTemplateFromDocument(
  documentId: string, 
  templateData: { name: string; description?: string }, 
  organizationId: string
) {
  const response = await httpClient.post(
    `${backendUrl}/documents/${documentId}/create-template`,
    templateData,
    {
      headers: {
        'X-Org-Id': organizationId,
      },
    }
  );
  const data = await response.json();
  console.log('Template created from document:', data.data);
  return data.data;
}

export async function syncDocumentsFromTemplate(
  templateId: string,
  documentIds: string[],
  organizationId: string,
): Promise<SyncDocumentsFromTemplateResponse> {
  const response = await httpClient.post(`${backendUrl}/documents/sync-from-template`, {
    template_id: templateId,
    document_ids: documentIds,
  }, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  const data = await response.json();
  console.log('Documents synced from template:', data.data);
  return data.data;
}

export async function syncTemplateFromDocument(
  templateId: string,
  documentId: string,
  organizationId: string,
): Promise<SyncTemplateFromDocumentResponse> {
  const response = await httpClient.post(`${backendUrl}/templates/${templateId}/sync-from-document`, {
    document_id: documentId,
  }, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  const data = await response.json();
  console.log('Template synced from document:', data.data);
  return data.data;
}

export interface ImportDocumentFromFileParams {
  name: string;
  description?: string;
  internal_code?: string;
  document_type_id: string;
  section_separator?: 'h1' | 'h2' | 'h3';
  force_import?: boolean;
  folder_id?: string | null;
  file: File;
  organizationId: string;
}

export async function importDocumentFromFile(params: ImportDocumentFromFileParams) {
  const url = new URL(`${backendUrl}/documents/import-from-file`);
  url.searchParams.append('name', params.name);
  url.searchParams.append('document_type_id', params.document_type_id);
  if (params.description) url.searchParams.append('description', params.description);
  if (params.internal_code) url.searchParams.append('internal_code', params.internal_code);
  if (params.section_separator) url.searchParams.append('section_separator', params.section_separator);
  if (params.force_import !== undefined) url.searchParams.append('force_import', String(params.force_import));
  if (params.folder_id != null) url.searchParams.append('folder_id', params.folder_id);

  const formData = new FormData();
  formData.append('file', params.file);

  const response = await httpClient.fetch(url.toString(), {
    method: 'POST',
    body: formData,
    headers: {
      'X-Org-Id': params.organizationId,
    },
  });

  const data = await response.json();
  console.log('Document imported from file:', data.data);
  return data.data;
}

export async function checkDocumentLifecycle(documentId: string, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/documents/${documentId}/lifecycle/check`, {}, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  const data = await response.json();
  console.log('Document lifecycle checked:', data.data);
  return data.data;
}

export async function rejectDocumentLifecycle(documentId: string, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/documents/${documentId}/lifecycle/reject`, {}, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  const data = await response.json();
  console.log('Document lifecycle rejected:', data.data);
  return data.data;
}

// --- Pending AI suggestions ---

export interface PendingAiSuggestionSection {
  section_execution_id: string
  section_id: string
  section_name: string
}

export interface PendingAiSuggestionExecution {
  execution_id: string
  execution_name: string
  pending_ai_suggestion_count: number
  pending_ai_suggestion_sections: PendingAiSuggestionSection[]
}

export interface DocumentWithPendingChanges {
  id: string
  name: string
  internal_code: string | null
  updated_at: string
  updated_by: string | null
  document_type: {
    id: string
    name: string
    color: string
  }
  template_name: string
  has_pending_ai_suggestion: boolean
  pending_ai_suggestion_executions: PendingAiSuggestionExecution[]
}

export interface PendingChangesResponse {
  data: DocumentWithPendingChanges[]
  page: number
  page_size: number
  has_next: boolean
}

export async function getDocumentsWithPendingChanges(
  organizationId: string,
  options: {
    page?: number
    pageSize?: number
    search?: string
    hasPendingAiSuggestion?: boolean
  } = {}
): Promise<PendingChangesResponse> {
  const { page = 1, pageSize = 20, search, hasPendingAiSuggestion = true } = options
  const url = new URL(`${backendUrl}/documents/`)
  url.searchParams.append('page', String(page))
  url.searchParams.append('page_size', String(pageSize))
  if (search) url.searchParams.append('search', search)
  if (hasPendingAiSuggestion !== undefined) {
    url.searchParams.append('has_pending_ai_suggestion', String(hasPendingAiSuggestion))
  }

  const response = await httpClient.get(url.toString(), {
    headers: { 'X-Org-Id': organizationId },
  })
  const json = await response.json()
  return {
    data: json.data,
    page: json.page,
    page_size: json.page_size,
    has_next: json.has_next,
  }
}
