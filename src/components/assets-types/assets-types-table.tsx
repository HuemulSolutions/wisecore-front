import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Trash2, FileStack, Copy, GitMerge, Settings2, ChevronRight, Folder, FolderOpen, FolderPen, FolderMinus, GripVertical } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction } from "@/huemul/components/huemul-table"
import type { AssetTypeTableProps } from '@/types/assets'
import type { AssetTypeTreeRow } from '@/types/assets'
import { ASSET_TYPE_ROW_PREFIX, FOLDER_ROW_PREFIX, assetTypeRowId } from "./asset-type-tree-utils"

export type { AssetTypeTableProps } from '@/types/assets'

// Helper functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ─── Celda de nombre de una fila de carpeta (droppable) ────────────────────

function FolderNameCell({
  folderId,
  name,
  isExpanded,
  canManageFolders,
  onToggle,
  typesCountLabel,
}: {
  folderId: string
  name: string
  isExpanded: boolean
  canManageFolders: boolean
  onToggle: () => void
  typesCountLabel: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${FOLDER_ROW_PREFIX}${folderId}`,
    disabled: !canManageFolders,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded px-1 -mx-1 py-0.5 transition-colors",
        isOver && "ring-1 ring-inset ring-primary bg-primary/10"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
      </button>
      {isExpanded ? (
        <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
      ) : (
        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <span className="text-xs font-medium text-foreground">{name}</span>
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
        {typesCountLabel}
      </Badge>
    </div>
  )
}

// ─── Celda de nombre de una fila de tipo de documento (draggable) ──────────

function AssetTypeNameCell({
  assetTypeId,
  name,
  depth,
  canManageFolders,
  dragHandleLabel,
}: {
  assetTypeId: string
  name: string
  depth: 0 | 1
  canManageFolders: boolean
  dragHandleLabel: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: assetTypeRowId(assetTypeId),
    disabled: !canManageFolders,
  })

  return (
    <div
      className={cn("flex items-center gap-1.5", depth === 1 && "pl-6")}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {canManageFolders && (
        <button
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          type="button"
          aria-label={dragHandleLabel}
          className="flex h-5 w-5 items-center justify-center text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <span className="text-xs font-medium text-foreground">{name}</span>
    </div>
  )
}

export default function AssetTypeTable({
  rows,
  expandedFolderIds,
  onExpandedFolderIdsChange,
  onConfigureAssetType,
  onDeleteAssetType,
  onCloneAssetType,
  onViewRelationships,
  onEditFolder,
  onRemoveFromFolder,
  onMoveAssetTypesToFolder,
  pagination,
  canConfigure = false,
  canDelete = false,
  canViewRelationships = false,
  canClone = false,
  canManageFolders = false,
  isLoading = false,
  isFetching = false,
  selectedIds,
  onSelectionChange,
}: AssetTypeTableProps) {
  const { t } = useTranslation('asset-types')
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [activeDrag, setActiveDrag] = useState<{ id: string; name: string; color: string } | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const toggleFolder = (folderId: string) => {
    const next = new Set(expandedFolderIds)
    if (next.has(folderId)) next.delete(folderId)
    else next.add(folderId)
    onExpandedFolderIdsChange(next)
  }

  // Define columns
  const columns: HuemulTableColumn<AssetTypeTreeRow>[] = [
    {
      key: "color",
      label: t('columns.color'),
      render: (row) =>
        row.kind === 'assetType' ? (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border border-border"
              style={{ backgroundColor: row.assetType.document_type_color }}
            />
          </div>
        ) : null
    },
    {
      key: "name",
      label: t('columns.name'),
      render: (row) =>
        row.kind === 'folder' ? (
          <FolderNameCell
            folderId={row.folder.id}
            name={row.folder.name}
            isExpanded={expandedFolderIds.has(row.folder.id)}
            canManageFolders={canManageFolders}
            onToggle={() => toggleFolder(row.folder.id)}
            typesCountLabel={t('folders.typesCount', { count: row.itemCount })}
          />
        ) : (
          <AssetTypeNameCell
            assetTypeId={row.assetType.document_type_id}
            name={row.assetType.document_type_name}
            depth={row.depth}
            canManageFolders={canManageFolders}
            dragHandleLabel={t('folders.dragHandle')}
          />
        )
    },
    {
      key: "count",
      label: t('columns.assetCount'),
      render: (row) =>
        row.kind === 'assetType' ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            {t('columns.assets', { count: row.assetType.document_count || 0 })}
          </Badge>
        ) : null
    },
    {
      key: "created",
      label: t('columns.created'),
      render: (row) =>
        row.kind === 'assetType' ? (
          <span className="text-xs text-foreground">{formatDate(row.assetType.document_type_created_date)}</span>
        ) : null
    }
  ]

  // Define actions - construir condicionalmente
  const actions: HuemulTableAction<AssetTypeTreeRow>[] = [
    ...(canManageFolders ? [{
      key: "editFolder" as const,
      label: t('folders.rename'),
      icon: FolderPen,
      show: (row: AssetTypeTreeRow) => row.kind === 'folder',
      onClick: (row: AssetTypeTreeRow) => { if (row.kind === 'folder') onEditFolder(row.folder) }
    }] : []),
    ...(canConfigure ? [{
      key: "configure" as const,
      label: t('actions.configureAssetType'),
      icon: Settings2,
      show: (row: AssetTypeTreeRow) => row.kind === 'assetType',
      onClick: (row: AssetTypeTreeRow) => { if (row.kind === 'assetType') onConfigureAssetType(row.assetType) }
    }] : []),
    ...(canViewRelationships ? [{
      key: "viewRelationships" as const,
      label: t('actions.viewRelationships'),
      icon: GitMerge,
      show: (row: AssetTypeTreeRow) => row.kind === 'assetType',
      onClick: (row: AssetTypeTreeRow) => { if (row.kind === 'assetType') onViewRelationships(row.assetType) }
    }] : []),
    ...(canClone ? [{
      key: "clone" as const,
      label: t('actions.cloneAssetType'),
      icon: Copy,
      show: (row: AssetTypeTreeRow) => row.kind === 'assetType',
      onClick: (row: AssetTypeTreeRow) => { if (row.kind === 'assetType') onCloneAssetType(row.assetType) }
    }] : []),
    ...(canManageFolders ? [{
      key: "removeFromFolder" as const,
      label: t('folders.removeFromFolder'),
      icon: FolderMinus,
      show: (row: AssetTypeTreeRow) => row.kind === 'assetType' && row.folderId !== null,
      onClick: (row: AssetTypeTreeRow) => { if (row.kind === 'assetType' && row.folderId) onRemoveFromFolder(row.assetType, row.folderId) }
    }] : []),
    ...(canDelete ? [{
      key: "delete" as const,
      label: t('actions.deleteAssetType'),
      icon: Trash2,
      show: (row: AssetTypeTreeRow) => row.kind === 'assetType',
      onClick: (row: AssetTypeTreeRow) => { if (row.kind === 'assetType') onDeleteAssetType(row.assetType) },
      destructive: true,
      separator: true
    }] : [])
  ]

  const handleSelectionChange = (keys: Set<string>) => {
    // Las filas de carpeta también muestran checkbox (HuemulTable no permite
    // excluirlas por fila) pero no participan de la selección para exportar.
    onSelectionChange(new Set([...keys].filter((k) => k.startsWith(ASSET_TYPE_ROW_PREFIX))))
  }

  const handleDragStart = (event: DragStartEvent) => {
    const row = rows.find((r) => r.id === event.active.id)
    if (row?.kind === 'assetType') {
      setActiveDrag({
        id: row.assetType.document_type_id,
        name: row.assetType.document_type_name,
        color: row.assetType.document_type_color,
      })
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id
    setDragOverFolderId(typeof overId === 'string' && overId.startsWith(FOLDER_ROW_PREFIX) ? overId : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null)
    setDragOverFolderId(null)

    const overId = event.over?.id
    const activeRow = rows.find((r) => r.id === event.active.id)
    if (typeof overId !== 'string' || !overId.startsWith(FOLDER_ROW_PREFIX) || activeRow?.kind !== 'assetType') return

    const targetFolderId = overId.slice(FOLDER_ROW_PREFIX.length)
    if (activeRow.folderId === targetFolderId) return

    // Si la fila arrastrada está entre las seleccionadas, mover todo el grupo junto.
    const selectedAssetTypeIds = [...selectedIds]
      .filter((k) => k.startsWith(ASSET_TYPE_ROW_PREFIX))
      .map((k) => k.slice(ASSET_TYPE_ROW_PREFIX.length))
    const idsToMove = selectedAssetTypeIds.includes(activeRow.assetType.document_type_id)
      ? selectedAssetTypeIds
      : [activeRow.assetType.document_type_id]

    onMoveAssetTypesToFolder(idsToMove, targetFolderId)
  }

  return (
    <DndContext
      sensors={canManageFolders ? sensors : []}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <HuemulTable
        data={rows}
        columns={columns}
        actions={actions}
        getRowKey={(row) => row.id}
        getRowClassName={(row) => {
          if (row.kind === 'folder' && dragOverFolderId === `${FOLDER_ROW_PREFIX}${row.folder.id}`) {
            return "ring-1 ring-inset ring-primary bg-primary/5"
          }
          return selectedIds.has(row.id) ? "bg-primary/5 hover:bg-primary/10" : ""
        }}
        emptyState={{
          icon: FileStack,
          title: t('emptyState.noAssetTypesFound'),
          description: t('emptyState.noResultsDescription')
        }}
        pagination={pagination}
        isLoading={isLoading}
        isFetching={isFetching}
        selectable
        selectedKeys={selectedIds}
        onSelectionChange={handleSelectionChange}
      />
      <DragOverlay>
        {activeDrag && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 shadow-lg">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeDrag.color }} />
            <span className="text-xs font-medium text-foreground">{activeDrag.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
