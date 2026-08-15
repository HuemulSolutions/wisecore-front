import type { RefObject } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Edge, Node } from '@xyflow/react'
import {
  getDiagrams,
  getDiagram,
  createDiagram,
  updateDiagram,
  deleteDiagram,
} from '@/services/diagrams'
import type { CreateDiagramRequest, UpdateDiagramRequest, Diagram } from '@/types/diagrams'
import { useMediaMutations } from './useMedia'
import { captureDiagramSnapshot } from '@/lib/diagram-snapshot'
import { buildDiagramGraphPayload } from '@/lib/diagram-utils'
import type { AssetTypeNodeData } from '@/components/document-type-relationships/asset-type-node'
import type { CanvasElementNodeData } from '@/components/document-type-relationships/text-node'
import type { RelationshipEdgeData } from '@/components/document-type-relationships/relationship-edge'

// The canvas mixes asset nodes with free-standing text/container elements; the
// save flow only cares about telling them apart by `type` when building the payload.
type CanvasNode = Node<AssetTypeNodeData | CanvasElementNodeData>

// ─── Query keys ───────────────────────────────────────────────────────────────

export const diagramQueryKeys = {
  all: ['diagrams'] as const,
  listBase: () => [...diagramQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, diagramId: string) =>
    [...diagramQueryKeys.all, 'detail', organizationId, diagramId] as const,
  list: (
    organizationId: string,
    page: number,
    pageSize: number,
    search?: string,
    executionId?: string,
    documentId?: string,
  ) =>
    [
      ...diagramQueryKeys.listBase(),
      organizationId,
      page,
      pageSize,
      search ?? '',
      executionId ?? '',
      documentId ?? '',
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseDiagramsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  executionId?: string
  documentId?: string
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useDiagrams(organizationId: string, options: UseDiagramsOptions = {}) {
  const { enabled = true, page = 1, pageSize = 100, search, executionId, documentId } = options

  return useQuery({
    queryKey: diagramQueryKeys.list(organizationId, page, pageSize, search, executionId, documentId),
    queryFn: () =>
      getDiagrams(organizationId, {
        page,
        page_size: pageSize,
        search,
        execution_id: executionId,
        document_id: documentId,
      }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useDiagram(organizationId: string, diagramId: string) {
  return useQuery({
    queryKey: diagramQueryKeys.detail(organizationId, diagramId),
    queryFn: () => getDiagram(organizationId, diagramId),
    enabled: !!organizationId && !!diagramId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useDiagramMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: diagramQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateDiagramRequest) => createDiagram(organizationId, body),
    onSuccess: (saved) => {
      invalidateList()
      // Sembrar el detalle evita el canvas en blanco al pasar de ?diagram=new a
      // ?diagram=<id>: DiagramCanvas monta con el diagrama ya en cache en vez de
      // renderizar null mientras hace el GET.
      queryClient.setQueryData(diagramQueryKeys.detail(organizationId, saved.id), saved)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ diagramId, body }: { diagramId: string; body: UpdateDiagramRequest }) =>
      updateDiagram(organizationId, diagramId, body),
    onSuccess: (_data, { diagramId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: diagramQueryKeys.detail(organizationId, diagramId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (diagramId: string) => deleteDiagram(organizationId, diagramId),
    onSuccess: (_data, diagramId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: diagramQueryKeys.detail(organizationId, diagramId),
      })
    },
  })

  return {
    createDiagram: createMutation,
    updateDiagram: updateMutation,
    deleteDiagram: deleteMutation,
  }
}

// ─── Save graph (snapshot + create/update) ─────────────────────────────────────

export interface SaveDiagramGraphParams {
  /** When set, updates this existing diagram (PUT) instead of creating a new one (POST). */
  diagramId?: string
  name: string
  description?: string | null
  executionId: string
  snapshotMediaId?: string | null
  nodes: CanvasNode[]
  edges: Edge<RelationshipEdgeData>[]
  containerRef: RefObject<HTMLDivElement | null>
  fitView: () => void
  /** Skips the PNG capture/upload and reuses `snapshotMediaId` as-is — for edits that only touch name/description/execution. */
  skipSnapshot?: boolean
}

/**
 * Shared save flow for every diagram-writing surface (save changes, save as new,
 * metadata-only edit): captures/uploads the snapshot when needed, builds the graph
 * payload and calls create or update. Does not toast or navigate — callers own that.
 */
export function useSaveDiagramGraph(organizationId: string) {
  const { uploadMedia, uploadMediaVersion } = useMediaMutations(organizationId)
  const { createDiagram: createMutation, updateDiagram: updateMutation } = useDiagramMutations(organizationId)

  const saveMutation = useMutation({
    mutationFn: async (params: SaveDiagramGraphParams): Promise<Diagram> => {
      let snapshotMediaId = params.snapshotMediaId ?? undefined

      if (!params.skipSnapshot) {
        const file = await captureDiagramSnapshot(params.containerRef, params.nodes, params.fitView)
        if (params.diagramId && params.snapshotMediaId) {
          // Editing a diagram that already has a snapshot → add a new version to the same Media
          await uploadMediaVersion.mutateAsync({ mediaId: params.snapshotMediaId, body: { file } })
          snapshotMediaId = params.snapshotMediaId
        } else {
          // First save (create), or editing a diagram that somehow has no snapshot yet
          const media = await uploadMedia.mutateAsync({
            file,
            level: 'execution',
            parent_id: params.executionId,
            name: `${params.name} - snapshot`,
            origin: 'diagram_snapshot',
          })
          snapshotMediaId = media.id
        }
      }

      const body = {
        name: params.name,
        execution_id: params.executionId,
        description: params.description || undefined,
        snapshot_media_id: snapshotMediaId,
        ...buildDiagramGraphPayload(params.nodes, params.edges),
      }

      return params.diagramId
        ? await updateMutation.mutateAsync({ diagramId: params.diagramId, body })
        : await createMutation.mutateAsync(body)
    },
  })

  return {
    saveDiagramGraph: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  }
}
