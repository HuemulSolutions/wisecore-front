// Tipos del panel derecho de detalle del activo (rail Índice/Campos/Archivos/Vínculos).
// Ver src/components/assets/content/detail-panel/ y ia context/list-detail-panel-guide.md.
import type React from 'react'
import type { CustomFieldDocument } from '@/types/custom-fields'
import type { MediaScope, MediaScopeExecutionOption } from '@/types/media'
import type { TocItem } from '@/types/table-of-contents'

export type AssetDetailPanelTab = 'index' | 'fields' | 'files' | 'links'

/** Marca de tiempo de "última actualización" por tab, para el footer del panel. */
export type AssetDetailPanelTimestamps = Partial<Record<AssetDetailPanelTab, number>>

export interface AssetDetailPanelPermissions {
  canListCustomFields: boolean
  canCreateFields: boolean
  canUpdateFields: boolean
  canDeleteFields: boolean
  canCreateMedia: boolean
  canUpdateMedia: boolean
  canDeleteMedia: boolean
  canListExecutionRelationships: boolean
  canOpenDiagrams: boolean
  canListAssetTypes: boolean
  canDeleteRelationship: boolean
}

export interface AssetDetailPanelProps extends AssetDetailPanelPermissions {
  organizationId: string
  documentId: string
  executionId?: string
  versionLabel?: string

  /** Controlado por el caller — la query de custom fields se gatea con el mismo valor. */
  activeTab: AssetDetailPanelTab
  onActiveTabChange: (tab: AssetDetailPanelTab) => void

  // Índice
  tocItems: TocItem[]
  canAddSection: boolean
  onAddSection?: () => void
  /** Recarga el contenido del documento (misma fuente que tocItems). */
  onRefreshIndex?: () => void | Promise<unknown>

  // Campos — `customFields` trae TODOS los campos (fetch sin paginar server-side,
  // ver assets-content.tsx); `customFieldsPage`/`customFieldsPageSize` paginan en
  // el cliente, sin ir al backend.
  customFields: CustomFieldDocument[]
  isLoadingCustomFields: boolean
  isRefreshingCustomFields: boolean
  customFieldsPage: number
  customFieldsPageSize: number
  uploadingImageFieldId?: string | null
  onCustomFieldsPageChange: (page: number) => void
  onAddCustomField: () => void
  onEditCustomField: (field: CustomFieldDocument) => void
  onEditCustomFieldContent: (field: CustomFieldDocument) => void
  onDeleteCustomField: (field: CustomFieldDocument) => void
  onRefreshCustomFields: () => void | Promise<void>

  // Archivos — versiones disponibles para el selector de alcance, y apertura de la vista completa (MediaListSheet)
  executions: MediaScopeExecutionOption[]
  onOpenMediaSheet: (scope?: MediaScope) => void

  /** Colapso a solo-rail (53px), controlado por el `ResizablePanel` que envuelve este componente. */
  isCollapsed: boolean
  onToggleCollapse: () => void

  className?: string
}

/** Ítem del rail vertical — uno por tab, con visibilidad gateada por permiso. */
export interface AssetDetailPanelRailItem {
  key: AssetDetailPanelTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  visible: boolean
}
