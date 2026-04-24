import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  uploadMedia,
  getMediaList,
  getMediaPicker,
  getMedia,
  patchMedia,
  deleteMedia,
  uploadMediaVersion,
  getMediaVersions,
  getMediaVersion,
  deleteMediaVersion,
  getMediaDownloadUrl,
} from '@/services/media'
import type {
  MediaLevel,
  GetMediaParams,
  GetMediaPickerParams,
  GetMediaVersionsParams,
  UploadMediaRequest,
  PatchMediaRequest,
  UploadMediaVersionRequest,
} from '@/types/media'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const mediaQueryKeys = {
  all: ['media'] as const,
  listBase: () => [...mediaQueryKeys.all, 'list'] as const,
  list: (organizationId: string, params: GetMediaParams) =>
    [...mediaQueryKeys.listBase(), organizationId, params] as const,
  pickerBase: () => [...mediaQueryKeys.all, 'picker'] as const,
  picker: (organizationId: string, documentId: string, params: GetMediaPickerParams) =>
    [...mediaQueryKeys.pickerBase(), organizationId, documentId, params] as const,
  detail: (organizationId: string, mediaId: string) =>
    [...mediaQueryKeys.all, 'detail', organizationId, mediaId] as const,
  versionsBase: (mediaId: string) =>
    [...mediaQueryKeys.all, 'versions', mediaId] as const,
  versions: (organizationId: string, mediaId: string, params: GetMediaVersionsParams) =>
    [...mediaQueryKeys.versionsBase(mediaId), organizationId, params] as const,
  versionDetail: (organizationId: string, mediaId: string, versionNumber: number) =>
    [...mediaQueryKeys.versionsBase(mediaId), 'detail', organizationId, versionNumber] as const,
  downloadUrl: (organizationId: string, mediaId: string, versionNumber?: number | null) =>
    [...mediaQueryKeys.all, 'download', organizationId, mediaId, versionNumber ?? 'current'] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseMediaListOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  mediaType?: string | null
  parentId?: string | null
}

export interface UseMediaPickerOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  mediaType?: string | null
}

export interface UseMediaVersionsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useMediaList(
  organizationId: string,
  level: MediaLevel,
  options: UseMediaListOptions = {},
) {
  const {
    enabled = true,
    page = 1,
    pageSize = 100,
    mediaType,
    parentId,
  } = options

  const params: GetMediaParams = {
    level,
    page,
    page_size: pageSize,
    media_type: mediaType,
    parent_id: parentId,
  }

  return useQuery({
    queryKey: mediaQueryKeys.list(organizationId, params),
    queryFn: () => getMediaList(organizationId, params),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Picker query ─────────────────────────────────────────────────────────────

export function useMediaPicker(
  organizationId: string,
  documentId: string,
  options: UseMediaPickerOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100, mediaType } = options

  const params: GetMediaPickerParams = {
    page,
    page_size: pageSize,
    media_type: mediaType,
  }

  return useQuery({
    queryKey: mediaQueryKeys.picker(organizationId, documentId, params),
    queryFn: () => getMediaPicker(organizationId, documentId, params),
    enabled: enabled && !!organizationId && !!documentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useMedia(organizationId: string, mediaId: string) {
  return useQuery({
    queryKey: mediaQueryKeys.detail(organizationId, mediaId),
    queryFn: () => getMedia(organizationId, mediaId),
    enabled: !!organizationId && !!mediaId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Versions list query ──────────────────────────────────────────────────────

export function useMediaVersions(
  organizationId: string,
  mediaId: string,
  options: UseMediaVersionsOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100 } = options

  const params: GetMediaVersionsParams = { page, page_size: pageSize }

  return useQuery({
    queryKey: mediaQueryKeys.versions(organizationId, mediaId, params),
    queryFn: () => getMediaVersions(organizationId, mediaId, params),
    enabled: enabled && !!organizationId && !!mediaId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Version detail query ─────────────────────────────────────────────────────

export function useMediaVersion(
  organizationId: string,
  mediaId: string,
  versionNumber: number,
) {
  return useQuery({
    queryKey: mediaQueryKeys.versionDetail(organizationId, mediaId, versionNumber),
    queryFn: () => getMediaVersion(organizationId, mediaId, versionNumber),
    enabled: !!organizationId && !!mediaId && versionNumber > 0,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Download URL query ───────────────────────────────────────────────────────

export function useMediaDownloadUrl(
  organizationId: string,
  mediaId: string,
  versionNumber?: number | null,
) {
  return useQuery({
    queryKey: mediaQueryKeys.downloadUrl(organizationId, mediaId, versionNumber),
    queryFn: () => getMediaDownloadUrl(organizationId, mediaId, versionNumber),
    enabled: !!organizationId && !!mediaId,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useMediaMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: mediaQueryKeys.listBase() })

  const invalidatePicker = () =>
    queryClient.invalidateQueries({ queryKey: mediaQueryKeys.pickerBase() })

  const uploadMutation = useMutation({
    mutationFn: (body: UploadMediaRequest) => uploadMedia(organizationId, body),
    onSuccess: () => {
      invalidateList()
      invalidatePicker()
    },
  })

  const patchMutation = useMutation({
    mutationFn: ({ mediaId, body }: { mediaId: string; body: PatchMediaRequest }) =>
      patchMedia(organizationId, mediaId, body),
    onSuccess: (_data, { mediaId }) => {
      invalidateList()
      invalidatePicker()
      queryClient.invalidateQueries({
        queryKey: mediaQueryKeys.detail(organizationId, mediaId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => deleteMedia(organizationId, mediaId),
    onSuccess: (_data, mediaId) => {
      invalidateList()
      invalidatePicker()
      queryClient.removeQueries({
        queryKey: mediaQueryKeys.detail(organizationId, mediaId),
      })
    },
  })

  const uploadVersionMutation = useMutation({
    mutationFn: ({
      mediaId,
      body,
    }: {
      mediaId: string
      body: UploadMediaVersionRequest
    }) => uploadMediaVersion(organizationId, mediaId, body),
    onSuccess: (_data, { mediaId }) => {
      invalidateList()
      invalidatePicker()
      queryClient.invalidateQueries({
        queryKey: mediaQueryKeys.detail(organizationId, mediaId),
      })
      queryClient.invalidateQueries({
        queryKey: mediaQueryKeys.versionsBase(mediaId),
      })
    },
  })

  const deleteVersionMutation = useMutation({
    mutationFn: ({
      mediaId,
      versionNumber,
    }: {
      mediaId: string
      versionNumber: number
    }) => deleteMediaVersion(organizationId, mediaId, versionNumber),
    onSuccess: (_data, { mediaId, versionNumber }) => {
      invalidateList()
      invalidatePicker()
      queryClient.invalidateQueries({
        queryKey: mediaQueryKeys.detail(organizationId, mediaId),
      })
      queryClient.removeQueries({
        queryKey: mediaQueryKeys.versionDetail(organizationId, mediaId, versionNumber),
      })
      queryClient.invalidateQueries({
        queryKey: mediaQueryKeys.versionsBase(mediaId),
      })
    },
  })

  return {
    uploadMedia: uploadMutation,
    patchMedia: patchMutation,
    deleteMedia: deleteMutation,
    uploadMediaVersion: uploadVersionMutation,
    deleteMediaVersion: deleteVersionMutation,
  }
}
