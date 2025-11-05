import { backendUrl } from "@/config";

export async function uploadDocxTemplate(documentId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${backendUrl}/docx_template/${documentId}`, {
    method: 'POST',

    body: formData,
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
