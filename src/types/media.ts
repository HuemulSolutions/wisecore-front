export type MediaLevel = 'organization' | 'document_type' | 'document' | 'execution'

// ─── Main entities ────────────────────────────────────────────────────────────

export interface MediaVersion {
  id: string
  media_id: string
  version_number: number
  file_name: string
  file_size: number
  media_type: string
  origin: string | null
  summary: string | null
  created_at: string
  created_by: string | null
}

export interface Media {
  id: string
  name: string | null
  level: MediaLevel
  parent_id: string | null
  media_type: string | null
  origin: string | null
  summary: string | null
  current_version: number
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

// ─── Response wrappers ────────────────────────────────────────────────────────

export interface MediaResponse {
  data: Media
  transaction_id: string
}

export interface MediaListResponse {
  data: Media[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  total?: number
}

export interface MediaVersionResponse {
  data: MediaVersion
  transaction_id: string
}

export interface MediaVersionListResponse {
  data: MediaVersion[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  total?: number
}

export interface MediaDownloadUrlResponse {
  data: {
    media_id: string
    version_number: number
    original_filename: string
    content_type: string
    file_size: number
    download_url: string
  }
  transaction_id: string
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface GetMediaParams {
  level: MediaLevel
  parent_id?: string | null
  media_type?: string | null
  page?: number
  page_size?: number
}

export interface GetMediaPickerParams {
  media_type?: string | null
  page?: number
  page_size?: number
}

export interface GetMediaVersionsParams {
  page?: number
  page_size?: number
}

// ─── Request bodies ───────────────────────────────────────────────────────────

export interface UploadMediaRequest {
  file: File
  level: MediaLevel
  parent_id?: string | null
  name?: string | null
  origin?: string | null
  summary?: string | null
}

export interface PatchMediaRequest {
  name?: string
  summary?: string
}

export interface UploadMediaVersionRequest {
  file: File
}
