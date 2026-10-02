import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import { ApiError } from "@/types/api-error";
import type { AddTextContextBody, EditTextContextBody } from "@/types/context";

export async function getContext(documentId: string, organizationId: string) {
  const response = await httpClient.get(`${backendUrl}/context/${documentId}/get_context`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  logger.log('Document context fetched:', data.data);
  return data.data;
}

export async function addTextContext(documentId: string, body: AddTextContextBody, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/context/${documentId}/add_text`,
    body,
    {
      headers: {
        'X-Org-Id': organizationId
      }
    }
  );

  const data = await response.json();
  logger.log('Text context added:', data.data);
  return data.data;
}

export async function addDocumentContext(documentId: string, file: File, organizationId: string) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await httpClient.fetch(`${backendUrl}/context/${documentId}/add_file`, {
    method: 'POST',
    body: formData,
    headers: {
      'X-Org-Id': organizationId
    }
  });
  
  const data = await response.json();
  logger.log('Document context added:', data.data);
  return data.data;
}

export interface UploadContextFileOptions {
  /** Porcentaje 0-100 de bytes enviados. */
  onProgress?: (percent: number) => void;
  /** Al abortar, la promesa rechaza con un `DOMException` de nombre `AbortError`. */
  signal?: AbortSignal;
}

/**
 * Igual que `addDocumentContext`, pero con progreso real y cancelación: `fetch` no expone
 * el avance de una subida, así que se usa `XMLHttpRequest`. Arma los mismos headers que
 * `httpClient.fetch` (token de organización con fallback al de login + `X-Org-Id`) y
 * rechaza con `ApiError` cuando el backend responde con el formato estandarizado.
 */
export function addDocumentContextWithProgress(
  documentId: string,
  file: File,
  organizationId: string,
  { onProgress, signal }: UploadContextFileOptions = {},
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Upload aborted', 'AbortError'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${backendUrl}/context/${documentId}/add_file`);

    const token = httpClient.getOrganizationToken() || httpClient.getLoginToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('X-Org-Id', organizationId);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    xhr.onload = () => {
      cleanup();
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // cuerpo no JSON: se cae al error genérico de abajo si el status no es 2xx
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        const data = (body as { data?: unknown } | null)?.data;
        logger.log('Document context added:', data);
        resolve(data);
        return;
      }
      if (ApiError.isApiErrorResponse(body)) {
        reject(new ApiError(body));
      } else {
        reject(new Error(`HTTP Error ${xhr.status}: ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('Network error'));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException('Upload aborted', 'AbortError'));
    };

    xhr.send(formData);
  });
}

export async function editTextContext(contextId: string, body: EditTextContextBody, organizationId: string) {
  const response = await httpClient.patch(`${backendUrl}/context/${contextId}/text`,
    body,
    {
      headers: {
        'X-Org-Id': organizationId
      }
    }
  );

  const data = await response.json();
  logger.log('Text context updated:', data.data);
  return data.data;
}

export async function editFileContext(contextId: string, file: File, organizationId: string, name?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (name) {
    formData.append('name', name);
  }

  const response = await httpClient.fetch(`${backendUrl}/context/${contextId}/file`, {
    method: 'PATCH',
    body: formData,
    headers: {
      'X-Org-Id': organizationId
    }
  });
  
  const data = await response.json();
  logger.log('File context updated:', data.data);
  return data.data;
}

export async function deleteContext(contextId: string, organizationId: string) {
  const response = await httpClient.delete(`${backendUrl}/context/${contextId}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  
  const data = await response.json();
  logger.log('Context deleted:', data.data);
  return data.data;
}
