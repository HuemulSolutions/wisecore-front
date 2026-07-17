"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ConnectionMode,
  MarkerType,
  type Node,
  type Edge,
  type OnConnect,
  type OnConnectEnd,
  BackgroundVariant,
  Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useQueryClient } from "@tanstack/react-query"
import { GitMerge, Trash2, Workflow } from "lucide-react"
import { toast } from "sonner"
import { MemoizedAssetTypeNode, type AssetTypeNodeData } from "./asset-type-node"
import { MemoizedRelationshipEdge, type RelationshipEdgeData } from "./relationship-edge"
import { RelationshipCreateDialog, RelationshipEditDialog } from "./relationship-dialogs"
import { ExecutionRelationshipCreateDialog, ExecutionRelationshipEditDialog, ExecutionPickerDialog, executionLabel } from "./execution-relationship-dialogs"
import { RelationshipDeleteDialog } from "./relationship-delete-dialog"
import { RelationshipAttributesDialog } from "./relationship-attributes-dialog"
import { SaveAsDiagramSheet } from "./save-as-diagram-sheet"
import { LoadDiagramSheet } from "./load-diagram-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { RelationshipPanel } from "./relationship-panel"
import { NodePanel } from "./node-panel"
import { documentTypeRelationshipQueryKeys } from "@/hooks/useDocumentTypeRelationships"
import { getDocumentTypeRelationships } from "@/services/document-type-relationships"
import { getExecutionRelationshipsByExecution } from "@/services/execution-relationships"
import { useExecutionRelationshipMutations } from "@/hooks/useExecutionRelationships"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { CreateAssetSheet } from "@/components/assets/dialogs"
import { getDocumentById } from "@/services/assets"
import { getExecutionsByDocumentId } from "@/services/executions"
import type {
  DocumentTypeRelationship,
  InitialCanvasNode,
  InitialCanvasRelationship,
  PendingConnection,
  RelationshipsCanvasProps,
} from "@/types/document-type-relationships"
import type { ExecutionRelationship, ExecutionRelationshipSubitem } from "@/types/execution-relationships"
import type { Diagram } from "@/types/diagrams"
import { cn } from "@/lib/utils"

const NODE_TYPES = {
  assetType: MemoizedAssetTypeNode,
}

const EDGE_TYPES = {
  relationship: MemoizedRelationshipEdge,
}

// Vertical offset (px) to separate N parallel edges centered around the handle.
// e.g. N=2: [-7, +7]  N=3: [-14, 0, +14]  N=4: [-21, -7, +7, +21]
const PARALLEL_SPACING = 14
function parallelOffset(index: number, total: number): number {
  return (index - (total - 1) / 2) * PARALLEL_SPACING
}

// Normalise the relationship object into a config shape for use in canvas logic.
function extractRelConfig(rel: DocumentTypeRelationship) {
  return {
    id: rel.id,
    name: rel.name,
    source_document_type_id: rel.source_document_type_id,
    target_document_type_id: rel.target_document_type_id,
    min_count: rel.min_count,
    max_count: rel.max_count,
  }
}

// ─── Hierarchical layout helper ────────────────────────────────────────────────
const NODE_COL_SPACING = 260
const NODE_ROW_SPACING = 110

function computeLayoutForNewNodes(
  anchorId: string,
  anchorPos: { x: number; y: number },
  newNodeIds: string[],
  edges: Array<{ source: string; target: string }>,
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>()
  if (newNodeIds.length === 0) return result

  const allIds = new Set([anchorId, ...newNodeIds])
  const adj = new Map<string, string[]>()
  const revAdj = new Map<string, string[]>()
  for (const id of allIds) { adj.set(id, []); revAdj.set(id, []) }

  for (const { source, target } of edges) {
    if (allIds.has(source) && allIds.has(target)) {
      adj.get(source)!.push(target)
      revAdj.get(target)!.push(source)
    }
  }

  // BFS from anchor: positive level = downstream, negative = upstream
  const levels = new Map<string, number>([[anchorId, 0]])
  const queue: string[] = [anchorId]
  while (queue.length > 0) {
    const cur = queue.shift()!
    const curLevel = levels.get(cur)!
    for (const next of adj.get(cur) ?? []) {
      if (!levels.has(next)) { levels.set(next, curLevel + 1); queue.push(next) }
    }
    for (const prev of revAdj.get(cur) ?? []) {
      if (!levels.has(prev)) { levels.set(prev, curLevel - 1); queue.push(prev) }
    }
  }

  // Nodes unreachable from anchor go after the deepest level
  let maxLevel = Math.max(0, ...Array.from(levels.values()))
  for (const id of newNodeIds) {
    if (!levels.has(id)) levels.set(id, ++maxLevel)
  }

  // Group new nodes by level
  const levelGroups = new Map<number, string[]>()
  for (const id of newNodeIds) {
    const lv = levels.get(id)!
    if (!levelGroups.has(lv)) levelGroups.set(lv, [])
    levelGroups.get(lv)!.push(id)
  }

  // Position nodes: each level is a column offset from anchor
  for (const [level, ids] of levelGroups) {
    const totalHeight = (ids.length - 1) * NODE_ROW_SPACING
    ids.forEach((id, i) => {
      result.set(id, {
        x: anchorPos.x + level * NODE_COL_SPACING,
        y: anchorPos.y - totalHeight / 2 + i * NODE_ROW_SPACING,
      })
    })
  }

  return result
}

// ─── Public export — wraps with ReactFlowProvider so inner hooks work ──────────

export function RelationshipsCanvas(props: RelationshipsCanvasProps) {
  return (
    <ReactFlowProvider>
      <RelationshipsCanvasFlow {...props} />
    </ReactFlowProvider>
  )
}

// ─── Inner canvas — has access to useReactFlow context ────────────────────────

function RelationshipsCanvasFlow({
  organizationId,
  documentTypes,
  initialDocumentTypeId,
  nodeActions,
  mode = 'document-type',
  initialNodes,
  initialRelationships,
  editingDiagram: editingDiagramProp,
}: RelationshipsCanvasProps) {
  const { t } = useTranslation("document-type-relationships")
  const { screenToFlowPosition, getNodes, getEdges, fitView } = useReactFlow()
  const queryClient = useQueryClient()
  const { deleteExecutionRelationship } = useExecutionRelationshipMutations(organizationId)
  const { isOrgAdmin, hasPermission, hasAnyPermission, canCreate } = useUserPermissions()
  const containerRef = useRef<HTMLDivElement>(null)

  // ─── Relationship permissions ───────────────────────────────────────────────
  const canListRelationships = isOrgAdmin || hasAnyPermission(['asset_type_relationship:l', 'asset_type_relationship:r'])
  const canCreateRelationship = isOrgAdmin || hasPermission('asset_type_relationship:c')
  const canUpdateRelationship = isOrgAdmin || hasPermission('asset_type_relationship:u')
  const canDeleteRelationship = isOrgAdmin || hasPermission('asset_type_relationship:d')

  const canListExecRelationships = isOrgAdmin || hasAnyPermission(['execution_relationship:l', 'execution_relationship:r'])
  const canCreateExecRelationship = isOrgAdmin || hasPermission('execution_relationship:c')
  const canUpdateExecRelationship = isOrgAdmin || hasPermission('execution_relationship:u')
  const canDeleteExecRelationship = isOrgAdmin || hasPermission('execution_relationship:d')

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [showSaveDiagramDialog, setShowSaveDiagramDialog] = useState(false)
  const [showLoadDiagramSheet, setShowLoadDiagramSheet] = useState(false)
  const [editingDiagram, setEditingDiagram] = useState(editingDiagramProp)

  // Dialog state
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null)
  const pendingConnectionRef = useRef<PendingConnection | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<DocumentTypeRelationship | null>(null)
  // execution-mode edit state
  const [editingExecRelationship, setEditingExecRelationship] = useState<ExecutionRelationship | null>(null)
  const [editingExecRelName, setEditingExecRelName] = useState("")
  // execution-mode load state: nodeId waiting for user to pick an execution
  const [pendingExecLoad, setPendingExecLoad] = useState<string | null>(null)
  // execution-mode drop state: asset dropped on canvas, waiting for the user to pick a version
  const [pendingDrop, setPendingDrop] = useState<{
    docType: { id: string; name: string; color: string; documentTypeId?: string }
    position: { x: number; y: number }
  } | null>(null)
  // execution-mode drop state: connection dragged onto empty canvas, waiting for the user
  // to create a brand-new asset that becomes the target of the relationship.
  const [pendingNewAssetConnection, setPendingNewAssetConnection] = useState<{
    sourceId: string
    position: { x: number; y: number }
  } | null>(null)
  // execution-mode delete state
  const [deletingExecRelId, setDeletingExecRelId] = useState<string | null>(null)
  const [deletingExecRelName, setDeletingExecRelName] = useState("")
  const [deletingRelationship, setDeletingRelationship] = useState<DocumentTypeRelationship | null>(null)
  const [attributesRelationshipId, setAttributesRelationshipId] = useState<string | null>(null)
  const [attributesRelationshipName, setAttributesRelationshipName] = useState("")

  // Right panel — tracks the clicked edge
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
  }, [])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }, [])

  // Keep ref in sync so handleRelationshipCreated avoids stale closure
  useEffect(() => {
    pendingConnectionRef.current = pendingConnection
  }, [pendingConnection])

  // Memoize document type map for O(1) lookup — recreated only when documentTypes changes
  const docTypeMap = useMemo(
    () => new Map(documentTypes.map((dt) => [dt.id, dt])),
    [documentTypes],
  )

  // Keep volatile values in refs so handleLoadRelationships can be stable
  const docTypeMapRef = useRef(docTypeMap)
  const organizationIdRef = useRef(organizationId)
  useEffect(() => { docTypeMapRef.current = docTypeMap }, [docTypeMap])
  useEffect(() => { organizationIdRef.current = organizationId }, [organizationId])

  // ─── Sync canvas node name/color when documentTypes data changes ───────────
  useEffect(() => {
    if (docTypeMap.size === 0) return
    setNodes((nds) =>
      nds.map((n) => {
        const updated = docTypeMap.get(n.id)
        if (!updated) return n
        const data = n.data as AssetTypeNodeData
        if (data.name === updated.name && data.color === updated.color) return n
        return { ...n, data: { ...data, name: updated.name, color: updated.color } }
      }),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docTypeMap])

  // ─── Load relationships for a specific document type ───────────────────────
  // Stable identity — reads latest data via refs, latest graph via getNodes/getEdges
  const handleLoadRelationships = useCallback(
    async (documentTypeId: string) => {
      if (!canListRelationships) return
      const dtMap = docTypeMapRef.current
      const orgId = organizationIdRef.current

      const relData = await queryClient.fetchQuery({
        queryKey: documentTypeRelationshipQueryKeys.list(orgId, 1, 1000, undefined, documentTypeId, true),
        queryFn: () =>
          getDocumentTypeRelationships(orgId, {
            page: 1,
            page_size: 1000,
            document_type_id: documentTypeId,
            include_subrelationships: true,
          }),
        staleTime: 2 * 60 * 1000,
      })

      if (!relData?.data?.length) return

      // Flatten top-level + all sub-relationships (relationship_source / relationship_target)
      // into a single deduplicated map so the full connected graph is rendered in one pass.
      const allRelsMap = new Map<string, DocumentTypeRelationship>()
      relData.data.forEach((rel) => {
        allRelsMap.set(rel.id, rel) // top-level item takes precedence (has full callbacks)
        rel.relationship_source.forEach((sub) => { if (!allRelsMap.has(sub.id)) allRelsMap.set(sub.id, sub) })
        rel.relationship_target.forEach((sub) => { if (!allRelsMap.has(sub.id)) allRelsMap.set(sub.id, sub) })
      })
      const allRels = Array.from(allRelsMap.values())

      // Use getNodes/getEdges to always read current graph state (no stale closure)
      const existingNodeIds = new Set(getNodes().map((n) => n.id))
      const existingEdges = getEdges()
      const existingEdgeIds = new Set(existingEdges.map((e) => e.id))
      const newNodes: Node<AssetTypeNodeData>[] = []
      const newEdges: Edge[] = []

      // Pre-count how many NEW edges will be added per pair in this batch
      const newEdgeCountPerPair = new Map<string, number>()
      allRels.forEach((rel) => {
        const cfg = extractRelConfig(rel)
        if (!existingEdgeIds.has(`rel-${cfg.id}`)) {
          const key = `${cfg.source_document_type_id}::${cfg.target_document_type_id}`
          newEdgeCountPerPair.set(key, (newEdgeCountPerPair.get(key) ?? 0) + 1)
        }
      })

      // Count existing edges per pair so we can assign indexes starting after them
      const existingCountPerPair = new Map<string, number>()
      existingEdges.forEach((e) => {
        const key = `${e.source}::${e.target}`
        existingCountPerPair.set(key, (existingCountPerPair.get(key) ?? 0) + 1)
      })

      // Track current new-edge index per pair (starts at existing count)
      const currentIndexPerPair = new Map<string, number>(existingCountPerPair)

      allRels.forEach((rel) => {
        const cfg = extractRelConfig(rel)
        const sourceId = cfg.source_document_type_id
        const targetId = cfg.target_document_type_id

        if (!existingNodeIds.has(sourceId) && !newNodes.some((n) => n.id === sourceId)) {
          const sourceDocType = dtMap.get(sourceId)
          if (sourceDocType) {
            newNodes.push({
              id: sourceId,
              type: "assetType",
              position: { x: 0, y: 0 }, // will be overwritten by layout
              data: {
                id: sourceId,
                name: sourceDocType.name,
                color: sourceDocType.color,
                onLoadRelationships: handleLoadRelationships,
                onLoadRelationshipsCanvasOnly: handleLoadRelationshipsCanvasOnly,
                onRemove: (id: string) => setNodes((nds) => nds.filter((n) => n.id !== id)),
              },
            })
            existingNodeIds.add(sourceId)
          }
        }

        if (!existingNodeIds.has(targetId) && !newNodes.some((n) => n.id === targetId)) {
          const targetDocType = dtMap.get(targetId)
          if (targetDocType) {
            newNodes.push({
              id: targetId,
              type: "assetType",
              position: { x: 0, y: 0 }, // will be overwritten by layout
              data: {
                id: targetId,
                name: targetDocType.name,
                color: targetDocType.color,
                onLoadRelationships: handleLoadRelationships,
                onLoadRelationshipsCanvasOnly: handleLoadRelationshipsCanvasOnly,
                onRemove: (id: string) => setNodes((nds) => nds.filter((n) => n.id !== id)),
              },
            })
            existingNodeIds.add(targetId)
          }
        }

        const edgeId = `rel-${cfg.id}`
        if (!existingEdgeIds.has(edgeId) && !newEdges.some((e) => e.id === edgeId)) {
          const pairKey = `${sourceId}::${targetId}`
          const existingCount = existingCountPerPair.get(pairKey) ?? 0
          const newCount = newEdgeCountPerPair.get(pairKey) ?? 1
          const total = existingCount + newCount
          const index = currentIndexPerPair.get(pairKey) ?? existingCount
          currentIndexPerPair.set(pairKey, index + 1)

          newEdges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: "relationship",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            data: {
              relationshipId: cfg.id,
              name: cfg.name,
              minCount: cfg.min_count,
              maxCount: cfg.max_count,
              pathOffset: parallelOffset(index, total),
              onEdit: canUpdateRelationship ? () => setEditingRelationship(rel) : undefined,
              onDelete: canDeleteRelationship ? () => setDeletingRelationship(rel) : undefined,
              onManageAttributes: canUpdateRelationship ? (id) => {
                setAttributesRelationshipId(id)
                setAttributesRelationshipName(cfg.name)
              } : undefined,
            } satisfies RelationshipEdgeData,
          })
          existingEdgeIds.add(edgeId)
        }
      })

      // Apply hierarchical layout to new nodes relative to the anchor
      if (newNodes.length > 0) {
        const anchorPos = getNodes().find((n) => n.id === documentTypeId)?.position ?? { x: 0, y: 0 }
        const edgePairs = newEdges.map((e) => ({ source: e.source as string, target: e.target as string }))
        const layoutPositions = computeLayoutForNewNodes(
          documentTypeId,
          anchorPos,
          newNodes.map((n) => n.id),
          edgePairs,
        )
        for (const node of newNodes) {
          const pos = layoutPositions.get(node.id)
          if (pos) node.position = pos
        }
        setNodes((nds) => [...nds, ...newNodes])
      }
      if (newEdges.length > 0) setEdges((eds) => [...eds, ...newEdges])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, getNodes, getEdges, setNodes, setEdges, canListRelationships, canUpdateRelationship, canDeleteRelationship],
  )

  // ─── Load relationships — canvas-only (no new nodes, only edges between existing nodes) ───
  const handleLoadRelationshipsCanvasOnly = useCallback(
    async (documentTypeId: string) => {
      if (!canListRelationships) return
      const orgId = organizationIdRef.current

      const relData = await queryClient.fetchQuery({
        queryKey: documentTypeRelationshipQueryKeys.list(orgId, 1, 1000, undefined, documentTypeId, true),
        queryFn: () =>
          getDocumentTypeRelationships(orgId, {
            page: 1,
            page_size: 1000,
            document_type_id: documentTypeId,
            include_subrelationships: true,
          }),
        staleTime: 2 * 60 * 1000,
      })

      if (!relData?.data?.length) return

      const allRelsMap = new Map<string, DocumentTypeRelationship>()
      relData.data.forEach((rel) => {
        allRelsMap.set(rel.id, rel)
        rel.relationship_source.forEach((sub) => { if (!allRelsMap.has(sub.id)) allRelsMap.set(sub.id, sub) })
        rel.relationship_target.forEach((sub) => { if (!allRelsMap.has(sub.id)) allRelsMap.set(sub.id, sub) })
      })
      const allRels = Array.from(allRelsMap.values())

      const existingNodeIds = new Set(getNodes().map((n) => n.id))
      const existingEdges = getEdges()
      const existingEdgeIds = new Set(existingEdges.map((e) => e.id))
      const newEdges: Edge[] = []

      // Pre-count new edges per pair (only where both nodes already exist in canvas)
      const newEdgeCountPerPair = new Map<string, number>()
      allRels.forEach((rel) => {
        const cfg = extractRelConfig(rel)
        if (
          existingNodeIds.has(cfg.source_document_type_id) &&
          existingNodeIds.has(cfg.target_document_type_id) &&
          !existingEdgeIds.has(`rel-${cfg.id}`)
        ) {
          const key = `${cfg.source_document_type_id}::${cfg.target_document_type_id}`
          newEdgeCountPerPair.set(key, (newEdgeCountPerPair.get(key) ?? 0) + 1)
        }
      })

      const existingCountPerPair = new Map<string, number>()
      existingEdges.forEach((e) => {
        const key = `${e.source}::${e.target}`
        existingCountPerPair.set(key, (existingCountPerPair.get(key) ?? 0) + 1)
      })

      const currentIndexPerPair = new Map<string, number>(existingCountPerPair)

      allRels.forEach((rel) => {
        const cfg = extractRelConfig(rel)
        const sourceId = cfg.source_document_type_id
        const targetId = cfg.target_document_type_id

        // Skip if either node is not already in the canvas
        if (!existingNodeIds.has(sourceId) || !existingNodeIds.has(targetId)) return

        const edgeId = `rel-${cfg.id}`
        if (!existingEdgeIds.has(edgeId) && !newEdges.some((e) => e.id === edgeId)) {
          const pairKey = `${sourceId}::${targetId}`
          const existingCount = existingCountPerPair.get(pairKey) ?? 0
          const newCount = newEdgeCountPerPair.get(pairKey) ?? 1
          const total = existingCount + newCount
          const index = currentIndexPerPair.get(pairKey) ?? existingCount
          currentIndexPerPair.set(pairKey, index + 1)

          newEdges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: "relationship",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            data: {
              relationshipId: cfg.id,
              name: cfg.name,
              minCount: cfg.min_count,
              maxCount: cfg.max_count,
              pathOffset: parallelOffset(index, total),
              onEdit: canUpdateRelationship ? () => setEditingRelationship(rel) : undefined,
              onDelete: canDeleteRelationship ? () => setDeletingRelationship(rel) : undefined,
              onManageAttributes: canUpdateRelationship ? (id) => {
                setAttributesRelationshipId(id)
                setAttributesRelationshipName(cfg.name)
              } : undefined,
            } satisfies RelationshipEdgeData,
          })
          existingEdgeIds.add(edgeId)
        }
      })

      if (newEdges.length > 0) setEdges((eds) => [...eds, ...newEdges])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, getNodes, getEdges, setEdges, canListRelationships, canUpdateRelationship, canDeleteRelationship],
  )

  // ─── Auto-load initial document type ───────────────────────────────────────
  useEffect(() => {
    if (initialDocumentTypeId) {
      handleLoadRelationships(initialDocumentTypeId)
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Drag-and-drop onto canvas ──────────────────────────────────────────────
  const handleRemoveNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id))
    },
    [setNodes],
  )

  // ─── Select execution for a node (execution mode) ─────────────────────────
  const handleSelectExecution = useCallback(
    (nodeId: string, executionId: string, executionName: string) => {
      // Block selecting a version already used by another node of the same asset
      const node = getNodes().find((n) => n.id === nodeId)
      const assetId = (node?.data as AssetTypeNodeData | undefined)?.assetId
      const duplicate = getNodes().some((n) => {
        if (n.id === nodeId) return false
        const d = n.data as AssetTypeNodeData
        return d.assetId === assetId && d.executionId === executionId
      })
      if (duplicate) {
        toast.warning(t("nodePanel.versionAlreadyInCanvas"))
        return
      }
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, executionId, executionName } } : n,
        ),
      )
    },
    [setNodes, getNodes, t],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  // Create an execution-mode node at the given position, with the picked version pre-filled.
  // A unique canvas node ID lets multiple versions of the same asset coexist; the real asset
  // ID is stored in data.assetId.
  const createExecutionNode = useCallback(
    (
      docType: { id: string; name: string; color: string; documentTypeId?: string },
      position: { x: number; y: number },
      executionId: string,
      executionName: string,
    ) => {
      const canvasNodeId = `${docType.id}-${Math.random().toString(36).slice(2, 9)}`
      setNodes((nds) => [
        ...nds,
        {
          id: canvasNodeId,
          type: "assetType",
          position,
          data: {
            id: canvasNodeId,
            assetId: docType.id,
            documentTypeId: docType.documentTypeId,
            name: docType.name,
            color: docType.color,
            executionId,
            executionName,
            onLoadRelationships: (id: string) => handleLoadExecRelRef.current?.(id),
            onLoadRelationshipsCanvasOnly: (id: string) => handleLoadExecRelCanvasOnlyRef.current?.(id),
            onRemove: handleRemoveNode,
          },
        },
      ])
      setSelectedNodeId(canvasNodeId)
      setSelectedEdgeId(null)
      return canvasNodeId
    },
    [setNodes, handleRemoveNode],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData("application/document-type")
      if (!raw) return

      let docType: { id: string; name: string; color: string; documentTypeId?: string }
      try {
        docType = JSON.parse(raw)
      } catch {
        return
      }

      // Use screenToFlowPosition to correctly account for pan and zoom
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })

      // In execution mode, ask which version to add (and validate against canvas duplicates)
      // before creating the node. In doc-type mode create the node directly, avoiding duplicates.
      if (mode === 'execution') {
        setPendingDrop({ docType, position })
        return
      }

      if (getNodes().some((n) => n.id === docType.id)) return

      setNodes((nds) => [
        ...nds,
        {
          id: docType.id,
          type: "assetType",
          position,
          data: {
            id: docType.id,
            documentTypeId: docType.documentTypeId,
            name: docType.name,
            color: docType.color,
            onLoadRelationships: handleLoadRelationships,
            onLoadRelationshipsCanvasOnly: handleLoadRelationshipsCanvasOnly,
            onRemove: handleRemoveNode,
          },
        },
      ])
    },
    [getNodes, screenToFlowPosition, setNodes, handleLoadRelationships, handleLoadRelationshipsCanvasOnly, handleRemoveNode, mode],
  )

  // ─── Connect → open create dialog ──────────────────────────────────────────
  const onConnect: OnConnect = useCallback((params) => {
    if (!params.source || !params.target) return
    if (mode === 'execution') {
      const allNodes = getNodes()
      const srcNode = allNodes.find((n) => n.id === params.source)
      const tgtNode = allNodes.find((n) => n.id === params.target)
      const srcData = srcNode?.data as AssetTypeNodeData | undefined
      const tgtData = tgtNode?.data as AssetTypeNodeData | undefined
      // Block connection if either node has no version selected
      if (!srcData?.executionId || !tgtData?.executionId) {
        const missing = [
          !srcData?.executionId ? srcData?.name : null,
          !tgtData?.executionId ? tgtData?.name : null,
        ].filter(Boolean).join(", ")
        toast.warning(t("nodePanel.versionRequiredFor", { names: missing }))
        return
      }
      if (!canCreateExecRelationship) {
        toast.warning(t("relationship.noCreatePermission"))
        return
      }
      setPendingConnection({
        sourceId: params.source,
        targetId: params.target,
        sourceAssetId: srcData?.assetId ?? params.source,
        targetAssetId: tgtData?.assetId ?? params.target,
        sourceDocumentTypeId: srcData?.documentTypeId ?? srcData?.id,
        targetDocumentTypeId: tgtData?.documentTypeId ?? tgtData?.id,
        sourceName: srcData?.name,
        targetName: tgtData?.name,
        sourceColor: srcData?.color,
        targetColor: tgtData?.color,
        sourceExecutionId: srcData.executionId,
        targetExecutionId: tgtData.executionId,
      })
    } else {
      if (!canCreateRelationship) {
        toast.warning(t("relationship.noCreatePermission"))
        return
      }
      setPendingConnection({ sourceId: params.source, targetId: params.target })
    }
  }, [mode, getNodes, t, canCreateExecRelationship, canCreateRelationship])

  // ─── Connection dropped on empty canvas (execution mode) → create a new asset ──
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (mode !== 'execution' || !canCreate('asset') || !canCreateExecRelationship) return
      if (connectionState.isValid || connectionState.toNode || !connectionState.fromNode) return

      const fromNodeId = connectionState.fromNode.id
      const fromData = getNodes().find((n) => n.id === fromNodeId)?.data as AssetTypeNodeData | undefined
      if (!fromData?.executionId) {
        toast.warning(t("nodePanel.versionRequiredFor", { names: fromData?.name ?? '' }))
        return
      }

      const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event
      const position = screenToFlowPosition({ x: clientX, y: clientY })
      setPendingNewAssetConnection({ sourceId: fromNodeId, position })
    },
    [mode, canCreate, canCreateExecRelationship, getNodes, screenToFlowPosition, t],
  )

  // ─── New asset created from the empty-canvas drop → place node + open relationship dialog ──
  const handleNewAssetCreated = useCallback(
    async (created?: { id: string; name: string; type: string }) => {
      const pending = pendingNewAssetConnection
      setPendingNewAssetConnection(null)
      if (!created || !pending) return

      const [document, executions] = await Promise.all([
        getDocumentById(created.id, organizationId),
        getExecutionsByDocumentId(created.id, organizationId),
      ])
      const execution = executions?.[0]
      if (!execution) return // the create-asset dialog always leaves an initial version created

      const newCanvasNodeId = createExecutionNode(
        {
          id: created.id,
          name: created.name,
          color: document?.document_type?.color ?? '#94a3b8',
          documentTypeId: document?.document_type?.id,
        },
        pending.position,
        execution.id,
        executionLabel(execution),
      )

      const sourceData = getNodes().find((n) => n.id === pending.sourceId)?.data as AssetTypeNodeData | undefined

      setPendingConnection({
        sourceId: pending.sourceId,
        targetId: newCanvasNodeId,
        sourceAssetId: sourceData?.assetId ?? pending.sourceId,
        targetAssetId: created.id,
        sourceDocumentTypeId: sourceData?.documentTypeId ?? sourceData?.id,
        targetDocumentTypeId: document?.document_type?.id,
        sourceName: sourceData?.name,
        targetName: created.name,
        sourceColor: sourceData?.color,
        targetColor: document?.document_type?.color,
        sourceExecutionId: sourceData?.executionId,
        targetExecutionId: execution.id,
      })
    },
    [pendingNewAssetConnection, organizationId, getNodes, createExecutionNode],
  )

  const handleRelationshipUpdated = useCallback(
    (updated: DocumentTypeRelationship) => {
      const cfg = extractRelConfig(updated)
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== `rel-${cfg.id}`) return e
          return {
            ...e,
            data: {
              ...(e.data as RelationshipEdgeData),
              name: cfg.name,
              minCount: cfg.min_count,
              maxCount: cfg.max_count,
              onEdit: canUpdateRelationship ? () => setEditingRelationship(updated) : undefined,
              onManageAttributes: canUpdateRelationship ? (id: string) => {
                setAttributesRelationshipId(id)
                setAttributesRelationshipName(cfg.name)
              } : undefined,
            } satisfies RelationshipEdgeData,
          }
        }),
      )
      setEditingRelationship(updated)
    },
    [setEdges, canUpdateRelationship],
  )

  const handleRelationshipCreated = useCallback(
    (relationship: DocumentTypeRelationship) => {
      const conn = pendingConnectionRef.current
      if (!conn) return

      const cfg = extractRelConfig(relationship)

      setEdges((eds) => {
        const pairCount = eds.filter(
          (e) => e.source === conn.sourceId && e.target === conn.targetId,
        ).length
        return addEdge(
          {
            id: `rel-${cfg.id}`,
            source: conn.sourceId,
            target: conn.targetId,
            type: "relationship",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            data: {
              relationshipId: cfg.id,
              name: cfg.name,
              minCount: cfg.min_count,
              maxCount: cfg.max_count,
              pathOffset: parallelOffset(pairCount, pairCount + 1),
              onEdit: canUpdateRelationship ? () => setEditingRelationship(relationship) : undefined,
              onDelete: canDeleteRelationship ? () => setDeletingRelationship(relationship) : undefined,
              onManageAttributes: canUpdateRelationship ? (id) => {
                setAttributesRelationshipId(id)
                setAttributesRelationshipName(cfg.name)
              } : undefined,
            } satisfies RelationshipEdgeData,
          },
          eds,
        )
      })
      setPendingConnection(null)
    },
    [setEdges, canUpdateRelationship, canDeleteRelationship],
  )

  // ─── Execution relationship created → add edge ─────────────────────────────
  const handleExecutionRelationshipCreated = useCallback(
    (relationship: ExecutionRelationship, relName: string, sourceExecId: string, targetExecId: string) => {
      const conn = pendingConnectionRef.current
      if (!conn) return

      // Store executionIds on source and target nodes for future use
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === conn.sourceId) return { ...n, data: { ...n.data, executionId: sourceExecId } }
          if (n.id === conn.targetId) return { ...n, data: { ...n.data, executionId: targetExecId } }
          return n
        }),
      )

      setEdges((eds) => {
        const pairCount = eds.filter(
          (e) => e.source === conn.sourceId && e.target === conn.targetId,
        ).length
        return addEdge(
          {
            id: `exec-rel-${relationship.id}`,
            source: conn.sourceId,
            target: conn.targetId,
            type: "relationship",
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            data: {
              relationshipId: relationship.id,
              name: relName,
              relationshipType: relationship.relationship_type,
              minCount: 0,
              maxCount: 0,
              pathOffset: parallelOffset(pairCount, pairCount + 1),
              onEdit: canUpdateExecRelationship ? () => {
                setEditingExecRelationship(relationship)
                setEditingExecRelName(relName)
              } : undefined,
              onDelete: canDeleteExecRelationship ? () => {
                setDeletingExecRelId(relationship.id)
                setDeletingExecRelName(relName)
              } : undefined,
              onManageAttributes: undefined,
            } satisfies RelationshipEdgeData,
          },
          eds,
        )
      })
      setPendingConnection(null)
    },
    [setEdges, canUpdateExecRelationship, canDeleteExecRelationship],
  )

  // ─── Load execution relationships for a node ────────────────────────────────
  // Ref so new nodes created during load can reference the handler without stale closure
  const handleLoadExecRelRef = useRef<((nodeId: string) => void) | null>(null)
  const handleLoadExecRelCanvasOnlyRef = useRef<((nodeId: string, allowedRelIds?: Set<string>) => void) | null>(null)

  const doLoadExecutionRelationships = useCallback(
    async (nodeId: string, executionId: string) => {
      if (!canListExecRelationships) return
      const orgId = organizationIdRef.current

      // Persist the executionId on the node
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, executionId } } : n,
        ),
      )

      const relData = await getExecutionRelationshipsByExecution(orgId, executionId, {
        page: 1,
        page_size: 1000,
        include_subrelationships: true,
      })
      if (!relData?.data?.length) return

      // Flatten top-level + all sub-relationships (relationship_source / relationship_target)
      // into a single deduplicated map by id so the full connected graph renders in one pass.
      const allRelsMap = new Map<string, ExecutionRelationshipSubitem>()
      for (const item of relData.data) {
        if (!allRelsMap.has(item.id)) allRelsMap.set(item.id, item)
        for (const sub of item.relationship_source) {
          if (!allRelsMap.has(sub.id)) allRelsMap.set(sub.id, sub)
        }
        for (const sub of item.relationship_target) {
          if (!allRelsMap.has(sub.id)) allRelsMap.set(sub.id, sub)
        }
      }
      const allRels = Array.from(allRelsMap.values())

      const currentNodes = getNodes()
      const currentEdgeIds = new Set(getEdges().map((e) => e.id))
      const newNodes: Node<AssetTypeNodeData>[] = []
      const newEdges: Edge[] = []

      // Helper: ensure a node exists for a given execution endpoint
      const ensureNode = (docId: string, execId: string, execName: string, docName: string, docTypeId: string, docTypeColor: string) => {
        // Already in canvas (by executionId or by doc id)
        const byExecId =
          currentNodes.find((n) => (n.data as AssetTypeNodeData).executionId === execId)?.id ??
          newNodes.find((n) => (n.data as AssetTypeNodeData).executionId === execId)?.id
        if (byExecId) return byExecId

        // Look for a node with the same assetId that hasn't been assigned an execution yet
        const existingByDocId = currentNodes.find((n) => {
          const nd = n.data as AssetTypeNodeData
          return !nd.executionId && (nd.assetId === docId || (!nd.assetId && n.id === docId))
        })
        if (existingByDocId) {
          // Attach executionId, executionName and documentTypeId
          setNodes((nds) =>
            nds.map((n) => {
              if (n.id !== existingByDocId.id) return n
              const nd = n.data as AssetTypeNodeData
              return { ...n, data: { ...nd, executionId: execId, executionName: execName, documentTypeId: nd.documentTypeId ?? docTypeId } }
            }),
          )
          return existingByDocId.id
        }

        // Create a new node with a unique canvas ID
        const canvasId = `${docId}-${Math.random().toString(36).slice(2, 9)}`
        if (!newNodes.some((n) => (n.data as AssetTypeNodeData).executionId === execId)) {
          newNodes.push({
            id: canvasId,
            type: 'assetType',
            position: { x: 0, y: 0 },
            data: {
              id: canvasId,
              assetId: docId,
              executionId: execId,
              executionName: execName,
              documentTypeId: docTypeId,
              name: docName,
              color: docTypeColor || '#94a3b8',
              onLoadRelationships: (id: string) => handleLoadExecRelRef.current?.(id),
              onLoadRelationshipsCanvasOnly: (id: string) => handleLoadExecRelCanvasOnlyRef.current?.(id),
              onRemove: handleRemoveNode,
            },
          })
        }
        return canvasId
      }

      for (const rel of allRels) {
        const srcDocId = rel.source_execution.document_id
        const tgtDocId = rel.target_execution.document_id

        const srcCanvasId = ensureNode(srcDocId, rel.source_execution.id, rel.source_execution.name, rel.source_execution.document_name, rel.source_execution.document_type_id, rel.source_execution.document_type_color ?? '')
        const tgtCanvasId = ensureNode(tgtDocId, rel.target_execution.id, rel.target_execution.name, rel.target_execution.document_name, rel.target_execution.document_type_id, rel.target_execution.document_type_color ?? '')

        const edgeId = `exec-rel-${rel.id}`
        if (!currentEdgeIds.has(edgeId) && !newEdges.some((e) => e.id === edgeId)) {
          const pairCount = getEdges().filter(
            (e) => e.source === srcCanvasId && e.target === tgtCanvasId,
          ).length

          const dtr = rel.document_type_relationship
          const isManual = rel.relationship_type === 'manual' || !dtr
          const relName = isManual ? (rel.execution_relationship_name ?? '') : dtr!.name

          newEdges.push({
            id: edgeId,
            source: srcCanvasId,
            target: tgtCanvasId,
            type: 'relationship',
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            data: {
              relationshipId: rel.id,
              name: relName,
              relationshipType: rel.relationship_type,
              minCount: dtr?.min_count ?? 0,
              maxCount: dtr?.max_count ?? 0,
              pathOffset: parallelOffset(pairCount, pairCount + 1),
              onEdit: canUpdateExecRelationship ? () => {
                setEditingExecRelationship({
                  id: rel.id,
                  document_type_relationship_id: dtr?.id ?? null,
                  relationship_type: rel.relationship_type,
                  execution_relationship_name: rel.execution_relationship_name ?? null,
                  source_execution_id: rel.source_execution.id,
                  target_execution_id: rel.target_execution.id,
                  attributes: rel.attributes,
                  created_at: '',
                  updated_at: '',
                  created_by: null,
                  updated_by: null,
                })
                setEditingExecRelName(relName)
              } : undefined,
              onDelete: canDeleteExecRelationship ? () => {
                setDeletingExecRelId(rel.id)
                setDeletingExecRelName(relName)
              } : undefined,
              onManageAttributes: undefined,
            } satisfies RelationshipEdgeData,
          })
          currentEdgeIds.add(edgeId)
        }
      }

      if (newNodes.length > 0) {
        const anchorPos = getNodes().find((n) => n.id === nodeId)?.position ?? { x: 0, y: 0 }
        const edgePairs = newEdges.map((e) => ({ source: e.source as string, target: e.target as string }))
        const layoutPositions = computeLayoutForNewNodes(
          nodeId, anchorPos, newNodes.map((n) => n.id), edgePairs,
        )
        for (const node of newNodes) {
          const pos = layoutPositions.get(node.id)
          if (pos) node.position = pos
        }
        setNodes((nds) => [...nds, ...newNodes])
      }
      if (newEdges.length > 0) setEdges((eds) => [...eds, ...newEdges])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, getNodes, getEdges, setNodes, setEdges, handleRemoveNode, canListExecRelationships, canUpdateExecRelationship, canDeleteExecRelationship],
  )

  const handleLoadExecutionRelationships = useCallback(
    (nodeId: string) => {
      const node = getNodes().find((n) => n.id === nodeId)
      const nodeData = node?.data as AssetTypeNodeData | undefined
      if (!nodeData) return
      if (nodeData.executionId) {
        doLoadExecutionRelationships(nodeId, nodeData.executionId)
      } else {
        toast.warning(t("nodePanel.versionRequiredFor", { names: nodeData.name }))
      }
    },
    [getNodes, doLoadExecutionRelationships, t],
  )

  // ─── Load execution relationships — canvas-only (no new nodes, only edges between existing executions) ───
  const handleLoadExecRelCanvasOnly = useCallback(
    async (nodeId: string, allowedRelIds?: Set<string>) => {
      if (!canListExecRelationships) return
      const node = getNodes().find((n) => n.id === nodeId)
      const nodeData = node?.data as AssetTypeNodeData | undefined
      if (!nodeData?.executionId) {
        toast.warning(t("nodePanel.versionRequiredFor", { names: nodeData?.name ?? '' }))
        return
      }
      const orgId = organizationIdRef.current
      const relData = await getExecutionRelationshipsByExecution(orgId, nodeData.executionId, {
        page: 1,
        page_size: 1000,
        include_subrelationships: true,
      })
      if (!relData?.data?.length) return

      const allRelsMap = new Map<string, ExecutionRelationshipSubitem>()
      for (const item of relData.data) {
        if (!allRelsMap.has(item.id)) allRelsMap.set(item.id, item)
        for (const sub of item.relationship_source) {
          if (!allRelsMap.has(sub.id)) allRelsMap.set(sub.id, sub)
        }
        for (const sub of item.relationship_target) {
          if (!allRelsMap.has(sub.id)) allRelsMap.set(sub.id, sub)
        }
      }
      const allRels = Array.from(allRelsMap.values())

      const currentNodes = getNodes()
      const existingEdges = getEdges()
      const existingEdgeIds = new Set(existingEdges.map((e) => e.id))
      const newEdges: Edge[] = []

      // Build map of executionId → canvas node id
      const execToNodeId = new Map<string, string>()
      for (const n of currentNodes) {
        const nd = n.data as AssetTypeNodeData
        if (nd.executionId) execToNodeId.set(nd.executionId, n.id)
      }

      // Count existing edges per pair for parallel offset
      const existingCountPerPair = new Map<string, number>()
      existingEdges.forEach((e) => {
        const key = `${e.source}::${e.target}`
        existingCountPerPair.set(key, (existingCountPerPair.get(key) ?? 0) + 1)
      })

      for (const rel of allRels) {
        // When seeding a saved Diagram, draw only the relationships it persisted —
        // live backend relationships created since the save must not reappear.
        if (allowedRelIds && !allowedRelIds.has(rel.id)) continue
        const srcExecId = rel.source_execution.id
        const tgtExecId = rel.target_execution.id
        // Only draw edges between executions already on canvas
        if (!execToNodeId.has(srcExecId) || !execToNodeId.has(tgtExecId)) continue
        const srcCanvasId = execToNodeId.get(srcExecId)!
        const tgtCanvasId = execToNodeId.get(tgtExecId)!
        const edgeId = `exec-rel-${rel.id}`
        if (!existingEdgeIds.has(edgeId) && !newEdges.some((e) => e.id === edgeId)) {
          const pairKey = `${srcCanvasId}::${tgtCanvasId}`
          const existingCount = existingCountPerPair.get(pairKey) ?? 0
          const total = existingCount + 1
          const dtr = rel.document_type_relationship
          const isManual = rel.relationship_type === 'manual' || !dtr
          const relName = isManual ? (rel.execution_relationship_name ?? '') : dtr!.name

          newEdges.push({
            id: edgeId,
            source: srcCanvasId,
            target: tgtCanvasId,
            type: 'relationship',
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
            data: {
              relationshipId: rel.id,
              name: relName,
              relationshipType: rel.relationship_type,
              minCount: dtr?.min_count ?? 0,
              maxCount: dtr?.max_count ?? 0,
              pathOffset: parallelOffset(existingCount, total),
              onEdit: canUpdateExecRelationship ? () => {
                setEditingExecRelationship({
                  id: rel.id,
                  document_type_relationship_id: dtr?.id ?? null,
                  relationship_type: rel.relationship_type,
                  execution_relationship_name: rel.execution_relationship_name ?? null,
                  source_execution_id: rel.source_execution.id,
                  target_execution_id: rel.target_execution.id,
                  attributes: rel.attributes,
                  created_at: '',
                  updated_at: '',
                  created_by: null,
                  updated_by: null,
                })
                setEditingExecRelName(relName)
              } : undefined,
              onDelete: canDeleteExecRelationship ? () => {
                setDeletingExecRelId(rel.id)
                setDeletingExecRelName(relName)
              } : undefined,
              onManageAttributes: undefined,
            } satisfies RelationshipEdgeData,
          })
          existingEdgeIds.add(edgeId)
          existingCountPerPair.set(pairKey, total)
        }
      }
      if (newEdges.length > 0) setEdges((eds) => [...eds, ...newEdges])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getNodes, getEdges, setEdges, t, canListExecRelationships, canUpdateExecRelationship, canDeleteExecRelationship],
  )

  // Keep refs in sync so nodes created during load can reference the latest handlers
  useEffect(() => {
    handleLoadExecRelRef.current = handleLoadExecutionRelationships
  }, [handleLoadExecutionRelationships])
  useEffect(() => {
    handleLoadExecRelCanvasOnlyRef.current = handleLoadExecRelCanvasOnly
  }, [handleLoadExecRelCanvasOnly])
  useEffect(() => {
    const nodeIds = new Set(nodes.map((n) => n.id))
    setEdges((eds) => eds.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)))
  }, [nodes, setEdges])

  // ─── Draw relationship edges for a freshly-seeded batch of nodes ──────────
  // The saved Diagram's relationships arrive already resolved by the backend
  // (source/target execution ids, document_type_relationship, etc.) — no fetch
  // needed here, just build edges off the just-built `seeded` array so node
  // lookup and parallel-offset counting can't race against react-flow's state.
  const seedRelationshipEdges = useCallback(
    (seeded: { canvasNodeId: string; node: Node<AssetTypeNodeData> }[], relationships?: InitialCanvasRelationship[]) => {
      if (!canListExecRelationships || !relationships?.length) return

      const execToNodeId = new Map<string, string>()
      for (const { canvasNodeId, node } of seeded) {
        if (node.data.executionId) execToNodeId.set(node.data.executionId, canvasNodeId)
      }

      const newEdges: Edge[] = []
      const edgeIds = new Set<string>()
      const countPerPair = new Map<string, number>()

      for (const rel of relationships) {
        const srcExecId = rel.source_execution_id
        const tgtExecId = rel.target_execution_id
        // Only draw edges between executions already on canvas
        if (!execToNodeId.has(srcExecId) || !execToNodeId.has(tgtExecId)) continue
        const srcCanvasId = execToNodeId.get(srcExecId)!
        const tgtCanvasId = execToNodeId.get(tgtExecId)!
        const edgeId = `exec-rel-${rel.execution_relationship_id}`
        if (edgeIds.has(edgeId)) continue

        const pairKey = `${srcCanvasId}::${tgtCanvasId}`
        const existingCount = countPerPair.get(pairKey) ?? 0
        const total = existingCount + 1
        const dtr = rel.document_type_relationship
        const isManual = rel.relationship_type === 'manual' || !dtr
        const relName = isManual ? (rel.execution_relationship_name ?? '') : dtr!.name

        newEdges.push({
          id: edgeId,
          source: srcCanvasId,
          target: tgtCanvasId,
          type: 'relationship',
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
          data: {
            relationshipId: rel.execution_relationship_id,
            name: relName,
            relationshipType: rel.relationship_type,
            minCount: dtr?.min_count ?? 0,
            maxCount: dtr?.max_count ?? 0,
            pathOffset: parallelOffset(existingCount, total),
            onEdit: canUpdateExecRelationship ? () => {
              setEditingExecRelationship({
                id: rel.execution_relationship_id,
                document_type_relationship_id: dtr?.id ?? null,
                relationship_type: rel.relationship_type,
                execution_relationship_name: rel.execution_relationship_name ?? null,
                source_execution_id: rel.source_execution_id,
                target_execution_id: rel.target_execution_id,
                attributes: rel.attributes,
                created_at: '',
                updated_at: '',
                created_by: null,
                updated_by: null,
              })
              setEditingExecRelName(relName)
            } : undefined,
            onDelete: canDeleteExecRelationship ? () => {
              setDeletingExecRelId(rel.execution_relationship_id)
              setDeletingExecRelName(relName)
            } : undefined,
            onManageAttributes: undefined,
          } satisfies RelationshipEdgeData,
        })
        edgeIds.add(edgeId)
        countPerPair.set(pairKey, total)
      }

      if (newEdges.length > 0) setEdges((eds) => [...eds, ...newEdges])
    },
    [setEdges, canListExecRelationships, canUpdateExecRelationship, canDeleteExecRelationship],
  )

  // ─── Seed nodes at explicit saved positions (reopening/loading a Diagram) ──
  // `relationships`, when given, are the diagram's saved relationships (already
  // resolved by the backend) — otherwise no edges are drawn for the seeded nodes.
  const seedCanvasNodes = useCallback((nodesToSeed: InitialCanvasNode[], relationships?: InitialCanvasRelationship[]) => {
    const seeded = nodesToSeed.map((n) => {
      const canvasNodeId = `${n.assetId}-${Math.random().toString(36).slice(2, 9)}`
      const node: Node<AssetTypeNodeData> = {
        id: canvasNodeId,
        type: "assetType",
        position: n.position,
        data: {
          id: canvasNodeId,
          assetId: n.assetId,
          documentTypeId: n.documentTypeId,
          executionId: n.executionId,
          executionName: n.executionName,
          name: n.name,
          color: n.color,
          onLoadRelationships: (id: string) => handleLoadExecRelRef.current?.(id),
          onLoadRelationshipsCanvasOnly: (id: string) => handleLoadExecRelCanvasOnlyRef.current?.(id),
          onRemove: handleRemoveNode,
        },
      }
      return { canvasNodeId, node }
    })

    setNodes((nds) => [...nds, ...seeded.map((s) => s.node)])

    // Draw relationships between the seeded nodes in a single pass off `seeded`
    // (not react-flow's store, which hasn't caught up to the setNodes above yet).
    seedRelationshipEdges(seeded, relationships)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setNodes, handleRemoveNode, seedRelationshipEdges])

  // Guarded by a ref (not just the effect dep array) so it only seeds once even if
  // the parent re-renders and passes a new `initialNodes` array reference.
  const hasSeededInitialNodesRef = useRef(false)
  useEffect(() => {
    if (hasSeededInitialNodesRef.current || !initialNodes?.length) return
    hasSeededInitialNodesRef.current = true
    seedCanvasNodes(initialNodes, initialRelationships)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes])

  // Picking a Diagram from LoadDiagramSheet replaces the canvas contents and
  // switches the canvas into "editing" mode for that diagram.
  const handleDiagramLoaded = useCallback((diagram: Diagram, nodesToSeed: InitialCanvasNode[]) => {
    setNodes([])
    setEdges([])
    setSelectedEdgeId(null)
    setSelectedNodeId(null)
    setEditingDiagram({
      id: diagram.id,
      name: diagram.name,
      description: diagram.description,
      executionId: diagram.execution_id,
      snapshotMediaId: diagram.snapshot_media_id,
    })
    seedCanvasNodes(nodesToSeed, diagram.relationships)
  }, [seedCanvasNodes, setNodes, setEdges])

  const sourceDocType = pendingConnection ? docTypeMap.get(pendingConnection.sourceId) : undefined
  const targetDocType = pendingConnection ? docTypeMap.get(pendingConnection.targetId) : undefined

  const canSaveDiagram = isOrgAdmin || hasPermission(editingDiagram ? 'diagram:u' : 'diagram:c')
  const canLoadDiagram = isOrgAdmin || hasPermission('diagram:u')
  const hasValidDiagramNodes = nodes.some((n) => {
    const d = n.data as AssetTypeNodeData
    return !!d.assetId && !!d.executionId
  })

  return (
    <>
      <div ref={containerRef} className="flex h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          connectionMode={ConnectionMode.Loose}
          fitView
          deleteKeyCode="Delete"
          className="flex-1 h-full bg-muted/10"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(n) => (n.data as AssetTypeNodeData)?.color || "#94a3b8"}
            className="border rounded-lg shadow-sm"
          />

          {nodes.length > 0 && (
            <Panel position="top-right">
              <div className="flex items-center gap-2">
                {mode === 'execution' && canSaveDiagram && hasValidDiagramNodes && (
                  <button
                    onClick={() => setShowSaveDiagramDialog(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-background text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 hover:cursor-pointer transition-colors shadow-sm"
                  >
                    <Workflow className="h-3.5 w-3.5" />
                    {editingDiagram ? t("canvas.saveChanges") : t("canvas.saveAsDiagram")}
                  </button>
                )}
                <button
                  onClick={() => { setNodes([]); setSelectedEdgeId(null); setSelectedNodeId(null); setEditingDiagram(undefined) }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-background text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 hover:cursor-pointer transition-colors shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("canvas.clearAll")}
                </button>
              </div>
            </Panel>
          )}

          {nodes.length === 0 && mode === 'execution' && canLoadDiagram && (
            <Panel position="top-right">
              <button
                onClick={() => setShowLoadDiagramSheet(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-background text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 hover:cursor-pointer transition-colors shadow-sm"
              >
                <Workflow className="h-3.5 w-3.5" />
                {t("canvas.loadDiagram")}
              </button>
            </Panel>
          )}

          {nodes.length === 0 && (
            <Panel position="top-center">
              <div
                className={cn(
                  "mt-20 flex flex-col items-center gap-3 p-8",
                  "bg-background/80 backdrop-blur rounded-xl border border-dashed",
                  "text-center pointer-events-none",
                )}
              >
                <GitMerge className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("canvas.empty")}</p>
                <p className="text-xs text-muted-foreground/70">{t("canvas.connectHint")}</p>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {selectedEdgeId && (
          <RelationshipPanel
            selectedEdgeId={selectedEdgeId}
            canvasNodes={nodes as Node<AssetTypeNodeData>[]}
            edges={edges as Edge<RelationshipEdgeData>[]}
            onClose={() => setSelectedEdgeId(null)}
          />
        )}

        {selectedNodeId && (() => {
          const selectedNode = nodes.find((n) => n.id === selectedNodeId)
          const nodeData = selectedNode?.data as AssetTypeNodeData | undefined
          if (!nodeData) return null
          return (
            <NodePanel
              nodeId={nodeData.id}
              assetId={nodeData.assetId}
              nodeName={nodeData.name}
              nodeColor={nodeData.color}
              assetTypeName={
                mode === 'execution' && nodeData.documentTypeId
                  ? docTypeMap.get(nodeData.documentTypeId)?.name
                  : undefined
              }
              nodeActions={nodeActions}
              onLoadRelationships={nodeData.onLoadRelationships && (mode === 'execution' ? canListExecRelationships : canListRelationships) ? (mode === 'execution' ? handleLoadExecutionRelationships : handleLoadRelationships) : undefined}
              onLoadRelationshipsCanvasOnly={nodeData.onLoadRelationships && (mode === 'execution' ? canListExecRelationships : canListRelationships) ? (mode === 'execution' ? handleLoadExecRelCanvasOnly : handleLoadRelationshipsCanvasOnly) : undefined}
              onClose={() => setSelectedNodeId(null)}
              mode={mode}
              executionId={nodeData.executionId}
              organizationId={organizationId}
              onSelectExecution={handleSelectExecution}
            />
          )
        })()}
      </div>

      {/* Create relationship dialog — document-type mode */}
      {pendingConnection && mode === 'document-type' && (
        <RelationshipCreateDialog
          open={!!pendingConnection}
          onOpenChange={(o) => !o && setPendingConnection(null)}
          organizationId={organizationId}
          sourceDocumentTypeId={pendingConnection.sourceId}
          targetDocumentTypeId={pendingConnection.targetId}
          sourceDocumentType={sourceDocType}
          targetDocumentType={targetDocType}
          onCreated={handleRelationshipCreated}
        />
      )}

      {/* Create relationship dialog — execution mode */}
      {pendingConnection && mode === 'execution' &&
        pendingConnection.sourceDocumentTypeId &&
        pendingConnection.targetDocumentTypeId && (
        <ExecutionRelationshipCreateDialog
          open={!!pendingConnection}
          onOpenChange={(o) => !o && setPendingConnection(null)}
          organizationId={organizationId}
          source={{
            assetId: pendingConnection.sourceAssetId ?? pendingConnection.sourceId,
            name: pendingConnection.sourceName ?? pendingConnection.sourceId,
            color: pendingConnection.sourceColor,
            documentTypeId: pendingConnection.sourceDocumentTypeId,
            executionId: pendingConnection.sourceExecutionId,
          }}
          target={{
            assetId: pendingConnection.targetAssetId ?? pendingConnection.targetId,
            name: pendingConnection.targetName ?? pendingConnection.targetId,
            color: pendingConnection.targetColor,
            documentTypeId: pendingConnection.targetDocumentTypeId,
            executionId: pendingConnection.targetExecutionId,
          }}
          onCreated={handleExecutionRelationshipCreated}
        />
      )}

      {/* Edit relationship dialog — document-type mode */}
      <RelationshipEditDialog
        open={!!editingRelationship}
        onOpenChange={(o) => !o && setEditingRelationship(null)}
        organizationId={organizationId}
        relationship={editingRelationship}
        onUpdated={handleRelationshipUpdated}
      />

      {/* Execution version picker — shown when user triggers "Load relationships" without a stored executionId */}
      {pendingExecLoad && (() => {
        const pendingNode = nodes.find((n) => n.id === pendingExecLoad)
        const pendingData = pendingNode?.data as AssetTypeNodeData | undefined
        return (
          <ExecutionPickerDialog
            open={!!pendingExecLoad}
            onOpenChange={(o) => !o && setPendingExecLoad(null)}
            organizationId={organizationId}
            assetId={pendingData?.assetId ?? pendingExecLoad}
            assetName={pendingData?.name ?? pendingExecLoad}
            onSelect={(executionId) => {
              doLoadExecutionRelationships(pendingExecLoad, executionId)
              setPendingExecLoad(null)
            }}
          />
        )
      })()}

      {/* Execution version picker — shown when an asset is dropped on the canvas (execution mode) */}
      {pendingDrop && (
        <ExecutionPickerDialog
          open={!!pendingDrop}
          onOpenChange={(o) => !o && setPendingDrop(null)}
          organizationId={organizationId}
          assetId={pendingDrop.docType.id}
          assetName={pendingDrop.docType.name}
          excludeExecutionIds={nodes
            .filter((n) => {
              const d = n.data as AssetTypeNodeData
              return d.assetId === pendingDrop.docType.id && !!d.executionId
            })
            .map((n) => (n.data as AssetTypeNodeData).executionId as string)}
          onSelect={(executionId, executionName) => {
            createExecutionNode(pendingDrop.docType, pendingDrop.position, executionId, executionName)
            setPendingDrop(null)
          }}
        />
      )}

      {/* Create-asset dialog — shown when a connection is dropped on empty canvas (execution mode) */}
      {mode === 'execution' && (
        <CreateAssetSheet
          open={!!pendingNewAssetConnection}
          onOpenChange={(o) => !o && setPendingNewAssetConnection(null)}
          onAssetCreated={handleNewAssetCreated}
        />
      )}

      {/* Edit relationship dialog — execution mode */}
      <ExecutionRelationshipEditDialog
        open={!!editingExecRelationship}
        onOpenChange={(o) => !o && setEditingExecRelationship(null)}
        organizationId={organizationId}
        executionRelationship={editingExecRelationship}
        relationshipName={editingExecRelName}
        onUpdated={(updated) => {
          setEditingExecRelationship(updated)
        }}
      />

      {/* Delete exec relationship dialog */}
      <HuemulAlertDialog
        open={!!deletingExecRelId}
        onOpenChange={(o) => !o && setDeletingExecRelId(null)}
        title={t("delete.title")}
        description={t("delete.description", { name: deletingExecRelName })}
        actionLabel={t("delete.confirmLabel")}
        onAction={async () => {
          if (!deletingExecRelId) return
          await new Promise<void>((resolve, reject) => {
            deleteExecutionRelationship.mutate(deletingExecRelId, {
              onSuccess: () => {
                setEdges((eds) => eds.filter((e) => e.id !== `exec-rel-${deletingExecRelId}`))
                setSelectedEdgeId(null)
                setDeletingExecRelId(null)
                resolve()
              },
              onError: (err) => reject(err),
            })
          })
        }}
      />

      {/* Delete relationship dialog */}
      <RelationshipDeleteDialog
        open={!!deletingRelationship}
        onOpenChange={(o) => !o && setDeletingRelationship(null)}
        organizationId={organizationId}
        relationship={deletingRelationship}
        onDeleted={() => {
          if (deletingRelationship) {
            const configId = extractRelConfig(deletingRelationship).id
            setEdges((eds) => eds.filter((e) => e.id !== `rel-${configId}`))
          }
          setDeletingRelationship(null)
        }}
      />

      {/* Attributes management dialog */}
      {attributesRelationshipId && (
        <RelationshipAttributesDialog
          open={!!attributesRelationshipId}
          onOpenChange={(o) => !o && setAttributesRelationshipId(null)}
          organizationId={organizationId}
          relationshipId={attributesRelationshipId}
          relationshipName={attributesRelationshipName}
        />
      )}

      {/* Save current graph as a Diagram, or save changes to the diagram being edited (execution mode only) */}
      {mode === 'execution' && (
        <SaveAsDiagramSheet
          open={showSaveDiagramDialog}
          onOpenChange={setShowSaveDiagramDialog}
          organizationId={organizationId}
          nodes={nodes as Node<AssetTypeNodeData>[]}
          edges={edges as Edge<RelationshipEdgeData>[]}
          containerRef={containerRef}
          fitView={fitView}
          diagramId={editingDiagram?.id}
          initialValues={editingDiagram ? {
            name: editingDiagram.name,
            description: editingDiagram.description,
            executionId: editingDiagram.executionId,
            snapshotMediaId: editingDiagram.snapshotMediaId,
          } : undefined}
        />
      )}

      {/* Load an existing Diagram into the canvas to edit/update it (execution mode only) */}
      {mode === 'execution' && (
        <LoadDiagramSheet
          open={showLoadDiagramSheet}
          onOpenChange={setShowLoadDiagramSheet}
          organizationId={organizationId}
          onLoad={handleDiagramLoaded}
        />
      )}
    </>
  )
}
