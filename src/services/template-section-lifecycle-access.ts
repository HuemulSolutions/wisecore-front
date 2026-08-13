import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  SetTemplateSectionAccessRequest,
  TemplateSectionLifecycleAccess,
  TemplateSectionLifecycleAccessResponse,
} from '@/types/templates/section-lifecycle-access'

const BASE_URL = `${backendUrl}/template_sections`

const accessUrl = (sectionId: string) => `${BASE_URL}/${sectionId}/lifecycle_access`

/**
 * Configuración de acceso de una sección. Solo devuelve los pares (sección, step)
 * configurados explícitamente: los steps ausentes están OCULTOS para esa sección.
 */
export async function getTemplateSectionLifecycleAccess(
  organizationId: string,
  templateSectionId: string,
): Promise<TemplateSectionLifecycleAccess[]> {
  const response = await httpClient.get(accessUrl(templateSectionId), {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as TemplateSectionLifecycleAccessResponse
  return data.data ?? []
}

/** Upsert: si ya había configuración para el par, se actualiza in place. */
export async function setTemplateSectionLifecycleAccess(
  organizationId: string,
  templateSectionId: string,
  lifecycleStepId: string,
  body: SetTemplateSectionAccessRequest,
): Promise<void> {
  await httpClient.put(`${accessUrl(templateSectionId)}/${lifecycleStepId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
}

/** Borra la fila: la sección vuelve a estar oculta en ese step. */
export async function clearTemplateSectionLifecycleAccess(
  organizationId: string,
  templateSectionId: string,
  lifecycleStepId: string,
): Promise<void> {
  await httpClient.delete(`${accessUrl(templateSectionId)}/${lifecycleStepId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { TemplateSectionLifecycleAccess, TemplateSectionLifecycleAccessResponse }
