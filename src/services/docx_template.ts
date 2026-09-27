import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  DocxTemplate,
  DocxTemplateResponse,
  DocxTemplatesResponse,
  AvailableDocxTemplate,
  AvailableDocxTemplatesResponse,
  GetDocxTemplatesParams,
  RenameDocxTemplateRequest,
} from '@/types/docx-templates'

const BASE_URL = `${backendUrl}/docx_templates`

// ─── Document endpoints ───────────────────────────────────────────────────────

/**
 * POST /docx_templates/{document_id}
 * Upload or replace the DOCX template associated with a document.
 */
export async function uploadDocxTemplate(
  documentId: string,
  file: File,
  organizationId: string,
): Promise<DocxTemplate> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await httpClient.fetch(`${BASE_URL}/${documentId}`, {
    method: 'POST',
    body: formData,
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DocxTemplateResponse
  return data.data
}

/**
 * GET /docx_templates/document/{document_id}/available
 * List available DOCX templates for a document (own + parent template's).
 */
export async function getAvailableDocxTemplatesForDocument(
  documentId: string,
  organizationId: string,
): Promise<AvailableDocxTemplate[]> {
  const response = await httpClient.get(
    `${BASE_URL}/document/${documentId}/available`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as AvailableDocxTemplatesResponse
  return data.data
}

// ─── Template endpoints ───────────────────────────────────────────────────────

/**
 * POST /docx_templates/template/{template_id}
 * Upload or replace the DOCX template associated with a template.
 */
export async function uploadDocxTemplateForTemplate(
  templateId: string,
  file: File,
  organizationId: string,
  name?: string,
): Promise<DocxTemplate> {
  const formData = new FormData()
  formData.append('file', file)
  if (name?.trim()) formData.append('name', name.trim())
  const response = await httpClient.fetch(`${BASE_URL}/template/${templateId}`, {
    method: 'POST',
    body: formData,
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DocxTemplateResponse
  return data.data
}

/**
 * GET /docx_templates/template/{template_id}
 * List DOCX templates for a template (paginated).
 */
export async function getDocxTemplatesForTemplate(
  templateId: string,
  organizationId: string,
  params: GetDocxTemplatesParams = {},
): Promise<DocxTemplatesResponse> {
  const { page = 1, page_size = 100 } = params
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  const response = await httpClient.get(
    `${BASE_URL}/template/${templateId}?${query}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  return response.json() as Promise<DocxTemplatesResponse>
}

/**
 * PUT /docx_templates/template/{template_id}/{docx_template_id}
 * Replace the file of an existing DOCX template. Optionally rename it.
 */
export async function replaceDocxTemplateFile(
  templateId: string,
  docxTemplateId: string,
  file: File,
  organizationId: string,
  name?: string,
): Promise<DocxTemplate> {
  const formData = new FormData()
  formData.append('file', file)
  if (name?.trim()) formData.append('name', name.trim())
  const response = await httpClient.fetch(
    `${BASE_URL}/template/${templateId}/${docxTemplateId}`,
    {
      method: 'PUT',
      body: formData,
      headers: { 'X-Org-Id': organizationId },
    },
  )
  const data = (await response.json()) as DocxTemplateResponse
  return data.data
}

/**
 * PATCH /docx_templates/template/{template_id}/{docx_template_id}
 * Rename a DOCX template without replacing the file.
 */
export async function renameDocxTemplate(
  templateId: string,
  docxTemplateId: string,
  body: RenameDocxTemplateRequest,
  organizationId: string,
): Promise<DocxTemplate> {
  const response = await httpClient.patch(
    `${BASE_URL}/template/${templateId}/${docxTemplateId}`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as DocxTemplateResponse
  return data.data
}

/**
 * DELETE /docx_templates/template/{template_id}/{docx_template_id}
 * Delete a DOCX template.
 */
export async function deleteDocxTemplate(
  templateId: string,
  docxTemplateId: string,
  organizationId: string,
): Promise<void> {
  await httpClient.delete(
    `${BASE_URL}/template/${templateId}/${docxTemplateId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

export type { DocxTemplate, DocxTemplatesResponse, AvailableDocxTemplate }
