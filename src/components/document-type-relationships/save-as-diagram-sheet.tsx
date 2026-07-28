"use client"

import { useEffect, useState, type RefObject } from "react"
import { useQuery } from "@tanstack/react-query"
import { toPng } from "html-to-image"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Workflow } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAssetTreePickerField } from "@/huemul/components/huemul-asset-tree-picker"
import { useMediaMutations } from "@/hooks/useMedia"
import { useDiagramMutations } from "@/hooks/useDiagrams"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { handleApiError } from "@/lib/error-utils"
import { getExecutionById } from "@/services/executions"
import { getNodesBounds, getViewportForBounds, type Edge, type Node } from "@xyflow/react"
import type { AssetTypeNodeData } from "./asset-type-node"
import type { CanvasElementNodeData } from "./text-node"
import type { RelationshipEdgeData } from "./relationship-edge"
import { executionLabel } from "./execution-relationship-dialogs"
import type { DiagramDetailInput, DiagramRelationshipInput, DiagramTextInput } from "@/types/diagrams"

// The canvas mixes asset nodes with free-standing text/container elements; this
// sheet only cares about telling them apart by `type` when building the save payload.
type CanvasNode = Node<AssetTypeNodeData | CanvasElementNodeData>

// Fixed export canvas size used to frame the captured nodes (react-flow's official
// download-image recipe: https://reactflow.dev/examples/misc/download-image)
const SNAPSHOT_IMAGE_WIDTH = 1024
const SNAPSHOT_IMAGE_HEIGHT = 768

export interface SaveAsDiagramSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  nodes: CanvasNode[]
  edges: Edge<RelationshipEdgeData>[]
  containerRef: RefObject<HTMLDivElement | null>
  fitView: () => void
  /** When set, the sheet updates this existing diagram (PUT) instead of creating a new one (POST). */
  diagramId?: string
  initialValues?: {
    name: string
    description?: string | null
    executionId: string
    snapshotMediaId?: string | null
  }
}

export function SaveAsDiagramSheet({
  open,
  onOpenChange,
  organizationId,
  nodes,
  edges,
  containerRef,
  fitView,
  diagramId,
  initialValues,
}: SaveAsDiagramSheetProps) {
  const { t } = useTranslation(['document-type-relationships', 'common'])
  const navigate = useOrgNavigate()
  const { uploadMedia, uploadMediaVersion } = useMediaMutations(organizationId)
  const { createDiagram, updateDiagram } = useDiagramMutations(organizationId)
  const isEditing = !!diagramId

  const [name, setName] = useState(initialValues?.name ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [mainExecutionId, setMainExecutionId] = useState(initialValues?.executionId ?? "")
  const [mainExecutionLabel, setMainExecutionLabel] = useState("")

  const validNodes = nodes.filter((n) => n.data.assetId && n.data.executionId)
  const validNodeIds = new Set(validNodes.map((n) => n.id))

  // When editing an existing diagram we only have the executionId (no label) —
  // fetch it once to seed a readable label in the tree picker field.
  const { data: seedExecution } = useQuery({
    queryKey: ['save-as-diagram-main-execution', organizationId, initialValues?.executionId],
    queryFn: () => getExecutionById(initialValues!.executionId, organizationId),
    enabled: open && !!initialValues?.executionId && !mainExecutionLabel,
  })

  useEffect(() => {
    if (seedExecution) setMainExecutionLabel(executionLabel(seedExecution))
  }, [seedExecution])

  const reset = () => {
    setName(initialValues?.name ?? "")
    setDescription(initialValues?.description ?? "")
    setMainExecutionId(initialValues?.executionId ?? "")
    setMainExecutionLabel("")
  }

  // The sheet stays mounted across multiple loads/saves in the same canvas session
  // (no remount), so `initialValues` can change while it's closed — resync on open
  // instead of relying only on the initial `useState` seed.
  useEffect(() => {
    if (open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = () =>
    new Promise<void>((resolve, reject) => {
      const run = async () => {
        try {
          fitView()
          // Give React Flow a moment to settle the viewport before capturing.
          await new Promise((r) => setTimeout(r, 150))

          const viewportEl = containerRef.current?.querySelector<HTMLElement>('.react-flow__viewport')
          if (!viewportEl) throw new Error('Canvas not ready')

          // Frame just the nodes (excludes Controls/MiniMap/Panel and the side panels,
          // which live outside .react-flow__viewport) — same recipe as react-flow's docs.
          const bounds = getNodesBounds(nodes)
          const viewport = getViewportForBounds(
            bounds,
            SNAPSHOT_IMAGE_WIDTH,
            SNAPSHOT_IMAGE_HEIGHT,
            0.5,
            2,
            0.1,
          )

          const dataUrl = await toPng(viewportEl, {
            backgroundColor: '#ffffff',
            width: SNAPSHOT_IMAGE_WIDTH,
            height: SNAPSHOT_IMAGE_HEIGHT,
            style: {
              width: `${SNAPSHOT_IMAGE_WIDTH}px`,
              height: `${SNAPSHOT_IMAGE_HEIGHT}px`,
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            },
          })
          const blob = await (await fetch(dataUrl)).blob()
          const file = new File([blob], 'diagram-snapshot.png', { type: 'image/png' })

          let snapshotMediaId: string
          if (diagramId && initialValues?.snapshotMediaId) {
            // Editing a diagram that already has a snapshot → add a new version to the same Media
            await uploadMediaVersion.mutateAsync({
              mediaId: initialValues.snapshotMediaId,
              body: { file },
            })
            snapshotMediaId = initialValues.snapshotMediaId
          } else {
            // First save (create), or editing a diagram that somehow has no snapshot yet
            const media = await uploadMedia.mutateAsync({
              file,
              level: 'execution',
              parent_id: mainExecutionId,
              name: `${name} - snapshot`,
              origin: 'diagram_snapshot',
            })
            snapshotMediaId = media.id
          }

          const details: DiagramDetailInput[] = validNodes.map((n) => ({
            execution_id: n.data.executionId as string,
            document_id: n.data.assetId as string,
            position: {
              x: n.position.x,
              y: n.position.y,
              width: n.measured?.width ?? 180,
              height: n.measured?.height ?? 80,
            },
          }))

          // Only edges whose both ends are in `details` survive — the backend rejects
          // edges "hanging" off a box that isn't part of the same request (DIAGRAM_RELATIONSHIP_EXECUTION_NOT_IN_DETAILS).
          const relIds = new Set<string>()
          for (const e of edges) {
            if (!e.id.startsWith('exec-rel-')) continue
            if (!validNodeIds.has(e.source) || !validNodeIds.has(e.target)) continue
            const relId = (e.data as RelationshipEdgeData | undefined)?.relationshipId
            if (relId) relIds.add(relId)
          }
          const relationships: DiagramRelationshipInput[] = Array.from(relIds).map((id) => ({
            execution_relationship_id: id,
          }))

          // Free-standing text/container elements → Diagram `texts`. `kind` is stashed
          // in `position` so the exact element type is reconstructed on reload. A blank
          // `content` is filtered out — the backend rejects it (422 VALIDATION_ERROR).
          const elementNodes = nodes.filter((n) => n.type === 'text' || n.type === 'container')
          const texts: DiagramTextInput[] = elementNodes
            .filter((n) => String((n.data as CanvasElementNodeData).content ?? '').trim())
            .map((n) => {
              const data = n.data as CanvasElementNodeData
              const isContainer = n.type === 'container'
              return {
                content: data.content.trim(),
                position: {
                  x: n.position.x,
                  y: n.position.y,
                  width: n.measured?.width ?? n.width ?? 160,
                  height: n.measured?.height ?? n.height ?? 80,
                  kind: n.type,
                },
                has_border: isContainer,
                border_type: isContainer ? 'solid' : undefined,
                border_color: isContainer ? data.color : undefined,
                font_color: !isContainer ? data.color : undefined,
              }
            })

          const body = {
            name,
            execution_id: mainExecutionId,
            description: description || undefined,
            snapshot_media_id: snapshotMediaId,
            details,
            texts,
            relationships,
          }

          if (diagramId) {
            await updateDiagram.mutateAsync({ diagramId, body })
          } else {
            await createDiagram.mutateAsync(body)
          }

          toast.success(
            isEditing ? t('saveAsDiagramDialog.updateSuccessToast') : t('saveAsDiagramDialog.successToast'),
            {
              action: {
                label: t('saveAsDiagramDialog.viewDiagrams'),
                onClick: () => navigate('/diagrams'),
              },
            },
          )
          reset()
          resolve()
        } catch (err) {
          handleApiError(err)
          reject(err)
        }
      }
      run()
    })

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}
      title={isEditing ? t('saveAsDiagramDialog.updateTitle') : t('saveAsDiagramDialog.title')}
      icon={Workflow}
      closeDelay={800}
      saveAction={{
        label: isEditing ? t('saveAsDiagramDialog.update') : t('saveAsDiagramDialog.save'),
        onClick: handleSave,
        disabled: !name.trim() || !mainExecutionId,
      }}
    >
      <div className="space-y-4">
        <HuemulField
          type="text"
          label={t('saveAsDiagramDialog.nameLabel')}
          placeholder={t('saveAsDiagramDialog.namePlaceholder')}
          value={name}
          onChange={(v) => setName(String(v))}
          required
        />
        <HuemulField
          type="textarea"
          label={t('saveAsDiagramDialog.descriptionLabel')}
          value={description}
          onChange={(v) => setDescription(String(v))}
        />
        <HuemulAssetTreePickerField
          mode="execution"
          organizationId={organizationId}
          label={t('saveAsDiagramDialog.mainExecutionLabel')}
          placeholder={t('saveAsDiagramDialog.mainExecutionPlaceholder')}
          valueId={mainExecutionId || undefined}
          valueLabel={mainExecutionLabel || undefined}
          onPick={(id, label) => { setMainExecutionId(id); setMainExecutionLabel(label) }}
          onClear={() => { setMainExecutionId(""); setMainExecutionLabel("") }}
        />
      </div>
    </HuemulSheet>
  )
}
