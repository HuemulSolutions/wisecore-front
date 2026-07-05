"use client"

import { useState, type RefObject } from "react"
import { toPng } from "html-to-image"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Workflow } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { useMediaMutations } from "@/hooks/useMedia"
import { useDiagramMutations } from "@/hooks/useDiagrams"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { handleApiError } from "@/lib/error-utils"
import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react"
import type { AssetTypeNodeData } from "./asset-type-node"
import type { DiagramDetailInput } from "@/types/diagrams"

// Fixed export canvas size used to frame the captured nodes (react-flow's official
// download-image recipe: https://reactflow.dev/examples/misc/download-image)
const SNAPSHOT_IMAGE_WIDTH = 1024
const SNAPSHOT_IMAGE_HEIGHT = 768

export interface SaveAsDiagramSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  nodes: Node<AssetTypeNodeData>[]
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

  const validNodes = nodes.filter((n) => n.data.assetId && n.data.executionId)

  const executionOptions = validNodes.map((n) => ({
    value: n.data.executionId as string,
    label: `${n.data.name} — ${n.data.executionName ?? n.data.executionId}`,
  }))

  const reset = () => {
    setName(initialValues?.name ?? "")
    setDescription(initialValues?.description ?? "")
    setMainExecutionId(initialValues?.executionId ?? "")
  }

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

          const body = {
            name,
            execution_id: mainExecutionId,
            description: description || undefined,
            snapshot_media_id: snapshotMediaId,
            details,
            texts: [],
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
        <HuemulField
          type="select"
          label={t('saveAsDiagramDialog.mainExecutionLabel')}
          placeholder={t('saveAsDiagramDialog.mainExecutionPlaceholder')}
          value={mainExecutionId}
          onChange={(v) => setMainExecutionId(String(v))}
          options={executionOptions}
          required
        />
      </div>
    </HuemulSheet>
  )
}
