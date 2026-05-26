import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCanvasList,
  getCanvas,
  createCanvas,
  updateCanvas,
  deleteCanvas,
} from '@/services/canvas'
import type {
  CreateCanvasRequest,
  UpdateCanvasRequest,
} from '@/types/canvas'
import type { UseCanvasListOptions } from '@/types/canvas'
export type { UseCanvasListOptions } from '@/types/canvas'

export const canvasQueryKeys = {
  all: ['canvas'] as const,
  listBase: () => [...canvasQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, canvasId: string) =>
    [...canvasQueryKeys.all, 'detail', organizationId, canvasId] as const,
  list: (
    organizationId: string,
    page: number,
    pageSize: number,
    search?: string,
    isActive?: boolean,
  ) =>
    [
      ...canvasQueryKeys.listBase(),
      organizationId,
      page,
      pageSize,
      search ?? '',
      isActive ?? '',
    ] as const,
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useCanvasList(organizationId: string, options: UseCanvasListOptions = {}) {
  const { enabled = true, page = 1, pageSize = 100, search, isActive } = options

  return useQuery({
    queryKey: canvasQueryKeys.list(organizationId, page, pageSize, search, isActive),
    queryFn: () =>
      getCanvasList(organizationId, {
        page,
        page_size: pageSize,
        search,
        is_active: isActive,
      }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useCanvas(organizationId: string, canvasId: string) {
  return useQuery({
    queryKey: canvasQueryKeys.detail(organizationId, canvasId),
    queryFn: () => getCanvas(organizationId, canvasId),
    enabled: !!organizationId && !!canvasId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCanvasMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: canvasQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateCanvasRequest) => createCanvas(organizationId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({ canvasId, body }: { canvasId: string; body: UpdateCanvasRequest }) =>
      updateCanvas(organizationId, canvasId, body),
    onSuccess: (_data, { canvasId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: canvasQueryKeys.detail(organizationId, canvasId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (canvasId: string) => deleteCanvas(organizationId, canvasId),
    onSuccess: (_data, canvasId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: canvasQueryKeys.detail(organizationId, canvasId),
      })
    },
  })

  return {
    createCanvas: createMutation,
    updateCanvas: updateMutation,
    deleteCanvas: deleteMutation,
  }
}
