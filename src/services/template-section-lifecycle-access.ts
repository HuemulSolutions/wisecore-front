import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  SetTemplateSectionAccessRequest,
  TemplateLifecycleAccessMatrix,
  TemplateSectionLifecycleAccess,
  TemplateSectionLifecycleAccessResponse,
} from '@/types/templates/section-lifecycle-access'

const BASE_URL = `${backendUrl}/template_sections`

const accessUrl = (sectionId: string) => `${BASE_URL}/${sectionId}/lifecycle_access`

/**
 * Matriz completa sección × step de una plantilla: secciones, steps y accesos
 * configurados en una sola llamada (reemplaza el N+1 de pedir el acceso sección
 * por sección). El resto de los endpoints del proyecto envuelven la respuesta en
 * `{ data }`; por si este no lo hiciera, se acepta también el objeto plano.
 */
export async function getTemplateLifecycleAccessMatrix(
  organizationId: string,
  templateId: string,
): Promise<TemplateLifecycleAccessMatrix> {
  const response = await httpClient.get(`${backendUrl}/templates/${templateId}/lifecycle_access_matrix`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const json = await response.json()
  return (json.data ?? json) as TemplateLifecycleAccessMatrix
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

/** Borra la fila: la sección vuelve a heredar el permiso del documento en ese step. */
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
