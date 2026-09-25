import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  CustomFieldValueEntityType,
  CustomFieldValueFile,
  CustomFieldValueFilesResponse,
  CustomFieldValueFileResponse,
} from "@/types/custom-fields";

// Colección value_blobs de un custom field value (carga_de_archivos con max_value > 1).
// Espejo idéntico entre custom_field_templates y custom_field_documents — un solo
// módulo parametrizado por entityType en vez de duplicar seis funciones gemelas.
// Independiente del endpoint value_blob singular (custom-fields-templates.ts /
// custom-fieldds-documents.ts), que sigue intacto para max_value <= 1.
const RESOURCE_PATH: Record<CustomFieldValueEntityType, string> = {
  template: "custom_field_templates",
  document: "custom_field_documents",
};

function buildBaseUrl(entityType: CustomFieldValueEntityType, entityCustomFieldId: string): string {
  return `${backendUrl}/${RESOURCE_PATH[entityType]}/${entityCustomFieldId}/value_blobs`;
}

// Lista todos los archivos actuales de la fila.
export async function getCustomFieldValueBlobs(
  entityType: CustomFieldValueEntityType,
  entityCustomFieldId: string,
): Promise<CustomFieldValueFile[]> {
  const response = await httpClient.get(buildBaseUrl(entityType, entityCustomFieldId));
  const result: CustomFieldValueFilesResponse = await response.json();
  return result.data;
}

// Agrega un archivo a la colección — no reemplaza los existentes. httpClient.fetch ya
// lanza ApiError (con .detail/.message) en el 422 de "Too many files." cuando se
// supera max_value.
export async function addCustomFieldValueBlob(
  entityType: CustomFieldValueEntityType,
  entityCustomFieldId: string,
  file: File,
  organizationId: string,
): Promise<CustomFieldValueFile> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await httpClient.fetch(buildBaseUrl(entityType, entityCustomFieldId), {
    method: "POST",
    headers: { "X-Org-Id": organizationId },
    body: formData,
  });

  const result: CustomFieldValueFileResponse = await response.json();
  return result.data;
}

// Borra un archivo puntual por su blob_id, sin afectar los demás. No valida min_value.
export async function deleteCustomFieldValueBlob(
  entityType: CustomFieldValueEntityType,
  entityCustomFieldId: string,
  blobId: string,
): Promise<void> {
  await httpClient.delete(`${buildBaseUrl(entityType, entityCustomFieldId)}/${blobId}`);
}

export type { CustomFieldValueEntityType, CustomFieldValueFile };
