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
