import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  Media,
  MediaResponse,
  MediaListResponse,
  MediaVersion,
  MediaVersionResponse,
  MediaVersionListResponse,
  MediaDownloadUrlResponse,
  GetMediaParams,
  GetMediaPickerParams,
  GetMediaVersionsParams,
  UploadMediaRequest,
  PatchMediaRequest,
  UploadMediaVersionRequest,
} from '@/types/media'

const BASE_URL = `${backendUrl}/media`

// ─── Media ────────────────────────────────────────────────────────────────────

export async function uploadMedia(
  organizationId: string,
  body: UploadMediaRequest,
): Promise<Media> {
  const formData = new FormData()
  formData.append('file', body.file)
  formData.append('level', body.level)
  if (body.parent_id != null) formData.append('parent_id', body.parent_id)
  if (body.name != null) formData.append('name', body.name)
  if (body.origin != null) formData.append('origin', body.origin)
  if (body.summary != null) formData.append('summary', body.summary)

  const response = await httpClient.fetch(`${BASE_URL}/`, {
    method: 'POST',
    body: formData,
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as MediaResponse
  return data.data
}

export async function getMediaList(
  organizationId: string,
  params: GetMediaParams,
): Promise<MediaListResponse> {
  const { level, parent_id, media_type, page = 1, page_size = 100 } = params

  const query = new URLSearchParams({
    level,
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (parent_id != null) query.set('parent_id', parent_id)
  if (media_type?.trim()) query.set('media_type', media_type.trim())

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<MediaListResponse>
}

export async function getMediaPicker(
  organizationId: string,
  documentId: string,
  params: GetMediaPickerParams = {},
): Promise<MediaListResponse> {
  const { media_type, page = 1, page_size = 100 } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (media_type?.trim()) query.set('media_type', media_type.trim())

  const response = await httpClient.get(
    `${BASE_URL}/picker/${documentId}?${query}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  return response.json() as Promise<MediaListResponse>
}

export async function getMedia(
  organizationId: string,
  mediaId: string,
): Promise<Media> {
  const response = await httpClient.get(`${BASE_URL}/${mediaId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as MediaResponse
  return data.data
}

export async function patchMedia(
  organizationId: string,
  mediaId: string,
  body: PatchMediaRequest,
): Promise<Media> {
  const response = await httpClient.patch(`${BASE_URL}/${mediaId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as MediaResponse
  return data.data
}

export async function deleteMedia(
  organizationId: string,
  mediaId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${mediaId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

// ─── Media versions ───────────────────────────────────────────────────────────

export async function uploadMediaVersion(
  organizationId: string,
  mediaId: string,
  body: UploadMediaVersionRequest,
): Promise<MediaVersion> {
  const formData = new FormData()
  formData.append('file', body.file)

  const response = await httpClient.fetch(`${BASE_URL}/${mediaId}/versions`, {
    method: 'POST',
    body: formData,
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as MediaVersionResponse
  return data.data
}

export async function getMediaVersions(
  organizationId: string,
  mediaId: string,
  params: GetMediaVersionsParams = {},
): Promise<MediaVersionListResponse> {
  const { page = 1, page_size = 100 } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })

  const response = await httpClient.get(
    `${BASE_URL}/${mediaId}/versions?${query}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  return response.json() as Promise<MediaVersionListResponse>
}

export async function getMediaVersion(
  organizationId: string,
  mediaId: string,
  versionNumber: number,
): Promise<MediaVersion> {
  const response = await httpClient.get(
    `${BASE_URL}/${mediaId}/versions/${versionNumber}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as MediaVersionResponse
  return data.data
}

export async function deleteMediaVersion(
  organizationId: string,
  mediaId: string,
  versionNumber: number,
): Promise<void> {
  await httpClient.delete(
    `${BASE_URL}/${mediaId}/versions/${versionNumber}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

// ─── Download ─────────────────────────────────────────────────────────────────

export async function getMediaDownloadUrl(
  organizationId: string,
  mediaId: string,
  versionNumber?: number | null,
): Promise<string> {
  const query = new URLSearchParams()
  if (versionNumber != null) query.set('version_number', versionNumber.toString())

  const url = query.toString()
    ? `${BASE_URL}/${mediaId}/download?${query}`
    : `${BASE_URL}/${mediaId}/download`

  const response = await httpClient.get(url, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as MediaDownloadUrlResponse
  return data.data.url
}

export type { Media, MediaVersion, MediaListResponse, MediaVersionListResponse }
