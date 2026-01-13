import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function uploadDocxTemplate(documentId: string, file: File, organizationId: string) {
  const formData = new FormData();
  formData.append('file', file);

  console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
  console.log('FormData entries:');
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  // Don't set Content-Type header for FormData - let the browser set it with proper boundary
  const response = await httpClient.fetch(`${backendUrl}/docx_template/${documentId}`, {
    method: 'POST',
    body: formData,
    headers: {
      'X-Org-Id': organizationId,
      // Explicitly remove Content-Type to let browser handle FormData boundary
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error('Error uploading DOCX template:', errorResponse);
    throw new Error(errorResponse.error || 'Error al subir la plantilla DOCX');
  }

  const data = await response.json();
  console.log('DOCX template uploaded:', data.data);
  return data.data;
}
