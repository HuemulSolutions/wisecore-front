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
  BackgroundVariant,
  Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useQueryClient } from "@tanstack/react-query"
import { GitMerge, Trash2 } from "lucide-react"
import { MemoizedAssetTypeNode, type AssetTypeNodeData } from "./asset-type-node"
import { MemoizedRelationshipEdge, type RelationshipEdgeData } from "./relationship-edge"
import { RelationshipCreateDialog, RelationshipEditDialog } from "./relationship-dialogs"
import { RelationshipDeleteDialog } from "./relationship-delete-dialog"
import { RelationshipAttributesDialog } from "./relationship-attributes-dialog"
import { RelationshipPanel } from "./relationship-panel"
import { documentTypeRelationshipQueryKeys } from "@/hooks/useDocumentTypeRelationships"
import { getDocumentTypeRelationships } from "@/services/document-type-relationships"
import type {
  DocumentTypeRelationship,
  PendingConnection,
  RelationshipsCanvasProps,
} from "@/types/document-type-relationships"
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

// The API can return either a nested format { document_type_relationship: { id, name, ... } }
// or a flat format where those fields sit directly on the root object.
// This helper normalises both shapes into a single config object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRelConfig(rel: DocumentTypeRelationship) {
  const nested = rel.document_type_relationship
  const flat = rel as unknown as Record<string, any>
  return {
    id: (nested?.id ?? flat.id ?? "") as string,
    name: (nested?.name ?? flat.name ?? "") as string,
    source_document_type_id: (nested?.source_document_type_id ?? flat.source_document_type_id ?? "") as string,
    target_document_type_id: (nested?.target_document_type_id ?? flat.target_document_type_id ?? "") as string,
    min_count: (nested?.min_count ?? flat.min_count ?? 0) as number,
    max_count: (nested?.max_count ?? flat.max_count ?? 0) as number,
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
}: RelationshipsCanvasProps) {
  const { t } = useTranslation("document-type-relationships")
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow()
  const queryClient = useQueryClient()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Dialog state
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null)
  const pendingConnectionRef = useRef<PendingConnection | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<DocumentTypeRelationship | null>(null)
  const [deletingRelationship, setDeletingRelationship] = useState<DocumentTypeRelationship | null>(null)
  const [attributesRelationshipId, setAttributesRelationshipId] = useState<string | null>(null)
  const [attributesRelationshipName, setAttributesRelationshipName] = useState("")

  // Right panel — tracks the clicked edge
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id)
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

  // ─── Load relationships for a specific document type ───────────────────────
  // Stable identity — reads latest data via refs, latest graph via getNodes/getEdges
  const handleLoadRelationships = useCallback(
    async (documentTypeId: string) => {
      const dtMap = docTypeMapRef.current
      const orgId = organizationIdRef.current

      const relData = await queryClient.fetchQuery({
        queryKey: documentTypeRelationshipQueryKeys.list(orgId, 1, 1000, undefined, documentTypeId),
        queryFn: () =>
          getDocumentTypeRelationships(orgId, {
            page: 1,
            page_size: 1000,
            document_type_id: documentTypeId,
          }),
        staleTime: 2 * 60 * 1000,
      })

      if (!relData?.data?.length) return

      // Use getNodes/getEdges to always read current graph state (no stale closure)
      const existingNodeIds = new Set(getNodes().map((n) => n.id))
      const existingEdges = getEdges()
      const existingEdgeIds = new Set(existingEdges.map((e) => e.id))
      const newNodes: Node<AssetTypeNodeData>[] = []
      const newEdges: Edge[] = []

      // Pre-count how many NEW edges will be added per pair in this batch
      const newEdgeCountPerPair = new Map<string, number>()
      relData.data.forEach((rel) => {
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

      relData.data.forEach((rel) => {
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
              onEdit: () => setEditingRelationship(rel),
              onDelete: () => setDeletingRelationship(rel),
              onManageAttributes: (id) => {
                setAttributesRelationshipId(id)
                setAttributesRelationshipName(cfg.name)
              },
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
    [queryClient, getNodes, getEdges, setNodes, setEdges],
  )

  // ─── Drag-and-drop onto canvas ──────────────────────────────────────────────
  const handleRemoveNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id))
    },
    [setNodes],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData("application/document-type")
      if (!raw) return

      let docType: { id: string; name: string; color: string }
      try {
        docType = JSON.parse(raw)
      } catch {
        return
      }

      // Avoid duplicates
      if (getNodes().some((n) => n.id === docType.id)) return

      // Use screenToFlowPosition to correctly account for pan and zoom
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })

      setNodes((nds) => [
        ...nds,
        {
          id: docType.id,
          type: "assetType",
          position,
          data: {
            id: docType.id,
            name: docType.name,
            color: docType.color,
            onLoadRelationships: handleLoadRelationships,
            onRemove: handleRemoveNode,
          },
        },
      ])
    },
    [getNodes, screenToFlowPosition, setNodes, handleLoadRelationships, handleRemoveNode],
  )

  // ─── Connect → open create dialog ──────────────────────────────────────────
  const onConnect: OnConnect = useCallback((params) => {
    if (!params.source || !params.target) return
    setPendingConnection({ sourceId: params.source, targetId: params.target })
  }, [])

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
              onEdit: () => setEditingRelationship(relationship),
              onDelete: () => setDeletingRelationship(relationship),
              onManageAttributes: (id) => {
                setAttributesRelationshipId(id)
                setAttributesRelationshipName(cfg.name)
              },
            } satisfies RelationshipEdgeData,
          },
          eds,
        )
      })
      setPendingConnection(null)
    },
    [setEdges],
  )

  // ─── Remove dangling edges when a node is removed from canvas ──────────────
  useEffect(() => {
    const nodeIds = new Set(nodes.map((n) => n.id))
    setEdges((eds) => eds.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)))
  }, [nodes, setEdges])

  const sourceDocType = pendingConnection ? docTypeMap.get(pendingConnection.sourceId) : undefined
  const targetDocType = pendingConnection ? docTypeMap.get(pendingConnection.targetId) : undefined

  return (
    <>
      <div className="flex h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
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
              <button
                onClick={() => { setNodes([]); setSelectedEdgeId(null) }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-background text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 hover:cursor-pointer transition-colors shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("canvas.clearAll")}
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
      </div>

      {/* Create relationship dialog */}
      {pendingConnection && (
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

      {/* Edit relationship dialog */}
      <RelationshipEditDialog
        open={!!editingRelationship}
        onOpenChange={(o) => !o && setEditingRelationship(null)}
        organizationId={organizationId}
        relationship={editingRelationship}
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
    </>
  )
}
