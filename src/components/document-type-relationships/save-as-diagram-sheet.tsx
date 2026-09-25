"use client"

import { useEffect, useState, type RefObject } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Pencil, Workflow } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAssetTreePickerField } from "@/huemul/components/huemul-asset-tree-picker"
import { useSaveDiagramGraph } from "@/hooks/useDiagrams"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { handleApiError } from "@/lib/error-utils"
import { getExecutionById } from "@/services/executions"
import type { Edge, Node } from "@xyflow/react"
import type { AssetTypeNodeData } from "./asset-type-node"
import type { CanvasElementNodeData } from "./text-node"
import type { RelationshipEdgeData } from "./relationship-edge"
import { executionLabel } from "./execution-relationship-dialogs"
import type { Diagram } from "@/types/diagrams"

// The canvas mixes asset nodes with free-standing text/container elements; this
// sheet only cares about telling them apart by `type` when building the save payload.
type CanvasNode = Node<AssetTypeNodeData | CanvasElementNodeData>

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
  /** `diagram:c`. Obligatoria: sin default, olvidarse de pasarla rompe el build. */
  canCreate: boolean
  /** `diagram:u`. Obligatoria: sin default, olvidarse de pasarla rompe el build. */
  canUpdate: boolean
  /**
   * Solo edita los datos del diagrama (nombre, descripción, ejecución principal):
   * salta el recentrado del canvas, la captura PNG y la subida de Media, y reusa
   * el snapshot existente. Requiere `diagramId`.
   */
  metadataOnly?: boolean
  /**
   * Se dispara al terminar un guardado exitoso (create o update) con el Diagram
   * resultante y el grafo EXACTO que se envió — el canvas lo usa para re-estampar
   * su línea base de "cambios sin guardar" (ver `useDiagramDirtyState`).
   */
  onSaved?: (diagram: Diagram, savedGraph: { nodes: CanvasNode[]; edges: Edge<RelationshipEdgeData>[] }) => void
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
  canCreate,
  canUpdate,
  metadataOnly = false,
  onSaved,
}: SaveAsDiagramSheetProps) {
  const { t } = useTranslation(['document-type-relationships', 'common'])
  const navigate = useOrgNavigate()
  const { saveDiagramGraph } = useSaveDiagramGraph(organizationId)
  const isEditing = !!diagramId
  // Guardar cambios escribe con PUT (diagram:u); guardar como nuevo, con POST
  // (diagram:c). El sheet no confía solo en que su trigger esté oculto.
  const canSave = isEditing ? canUpdate : canCreate

  // Tres modos sobre el mismo formulario: crear, guardar cambios del canvas y
  // editar solo los datos. Únicas diferencias visibles: título, botón y toast.
  const titleKey = metadataOnly
    ? 'saveAsDiagramDialog.editMetadataTitle'
    : isEditing ? 'saveAsDiagramDialog.updateTitle' : 'saveAsDiagramDialog.title'
  const saveLabelKey = metadataOnly
    ? 'saveAsDiagramDialog.editMetadata'
    : isEditing ? 'saveAsDiagramDialog.update' : 'saveAsDiagramDialog.save'
  const successMessage = t(
    metadataOnly
      ? 'saveAsDiagramDialog.metadataSuccessToast'
      : isEditing ? 'saveAsDiagramDialog.updateSuccessToast' : 'saveAsDiagramDialog.successToast',
  )

  const [name, setName] = useState(initialValues?.name ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [mainExecutionId, setMainExecutionId] = useState(initialValues?.executionId ?? "")
  // Solo guarda lo que el usuario eligió a mano en el picker. Para la ejecución que
  // viene del diagrama guardado el label se DERIVA de la query de abajo: si se
  // guardara en state habría que limpiarlo en cada reset y el picker mostraría el
  // UUID crudo (su fallback es `valueLabel || valueId`) hasta que la query resuelva.
  const [pickedExecutionLabel, setPickedExecutionLabel] = useState("")

  // Del diagrama guardado solo llega el executionId (sin label) — se resuelve para
  // mostrar algo legible en el picker. Cacheada por react-query, así que reabrir el
  // sheet no vuelve a pedirla.
  const { data: seedExecution } = useQuery({
    queryKey: ['save-as-diagram-main-execution', organizationId, mainExecutionId],
    queryFn: () => getExecutionById(mainExecutionId, organizationId),
    enabled: open && !!mainExecutionId && !pickedExecutionLabel,
  })

  const mainExecutionLabel = pickedExecutionLabel || (seedExecution ? executionLabel(seedExecution) : "")

  const reset = () => {
    setName(initialValues?.name ?? "")
    setDescription(initialValues?.description ?? "")
    setMainExecutionId(initialValues?.executionId ?? "")
    setPickedExecutionLabel("")
  }

  // The sheet stays mounted across multiple loads/saves in the same canvas session
  // (no remount), so `initialValues` can change while it's closed — resync on open
  // instead of relying only on the initial `useState` seed.
  useEffect(() => {
    if (open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Editar solo los datos no toca el dibujo: se reusa el snapshot ya subido en vez
  // de recentrar el canvas y regenerar el PNG (lo caro del guardado). Nota: si acá
  // se cambia la ejecución principal, el Media del snapshot sigue colgando de la
  // ejecución anterior (su `parent_id`). No rompe nada — el diagrama lo referencia
  // por `snapshot_media_id`, no por su padre.
  const handleSave = async () => {
    if (!canSave) throw new Error(`Missing diagram:${isEditing ? 'u' : 'c'} permission`)
    try {
      const saved = await saveDiagramGraph({
        diagramId,
        name,
        description,
        executionId: mainExecutionId,
        snapshotMediaId: initialValues?.snapshotMediaId,
        nodes,
        edges,
        containerRef,
        fitView,
        skipSnapshot: metadataOnly,
      })
      onSaved?.(saved, { nodes, edges })
      toast.success(successMessage, {
        action: {
          label: t('saveAsDiagramDialog.viewDiagrams'),
          onClick: () => navigate('/diagrams'),
        },
      })
    } catch (err) {
      handleApiError(err)
      throw err
    }
  }

  if (!canSave) return null

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}
      title={t(titleKey)}
      icon={metadataOnly ? Pencil : Workflow}
      // Cierra apenas responde el backend: con un retardo el sheet quedaba visible
      // mientras el padre ya había cambiado a modo edición, y se leía como si se
      // hubiera reabierto en blanco.
      closeDelay={0}
      saveAction={{
        label: t(saveLabelKey),
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
          onPick={(id, label) => { setMainExecutionId(id); setPickedExecutionLabel(label) }}
          onClear={() => { setMainExecutionId(""); setPickedExecutionLabel("") }}
          container="sheet"
        />
      </div>
    </HuemulSheet>
  )
}
