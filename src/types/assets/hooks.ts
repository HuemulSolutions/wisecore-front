import * as React from 'react'
import type { BreadcrumbItem, LibraryItem } from '@/components/assets'

export interface UseAssetNavigationProps {
  selectedOrganizationId: string | null
  organizationToken: string | null
  /**
   * Si el usuario puede listar la biblioteca (asset:l|r o folder:l|r). Sin esto
   * el hook no resuelve la jerarquía por URL: no dispara getLibraryContent.
   * Obligatorio a propósito — un default permisivo reabriría el hueco en
   * silencio (ver ia context/rbac-audit-guide.md, punto 3 del checklist).
   */
  canListLibrary: boolean
}

export interface UseAssetNavigationReturn {
  breadcrumb: BreadcrumbItem[]
  selectedFile: LibraryItem | null
  selectedExecutionId: string | null
  selectedSectionId: string | null
  isLoadingDocument: boolean
  isUpdatingUrl: boolean
  setBreadcrumb: React.Dispatch<React.SetStateAction<BreadcrumbItem[]>>
  setSelectedFile: React.Dispatch<React.SetStateAction<LibraryItem | null>>
  setSelectedExecutionId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedSectionId: React.Dispatch<React.SetStateAction<string | null>>
  currentFolderId: string | undefined
}

export interface UseCustomFieldMutationsProps {
  selectedFileId?: string
}

export interface UseDocumentMutationsProps {
  selectedFileId?: string
  selectedOrganizationId?: string
  onPreserveScroll?: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullDocument?: any
}

export interface ExpandedFoldersContextType {
  expandedFolders: Set<string>
  toggleFolder: (folderId: string) => void
  expandFolder: (folderId: string) => void
  collapseFolder: (folderId: string) => void
  isExpanded: (folderId: string) => boolean
  clearExpanded: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reExpandFolders: (folderIds: string[], loadChildren: (folderId: string) => Promise<any>, onChildrenLoaded?: (folderId: string, children: any[]) => void) => Promise<void>
  getExpandedFolderIds: () => string[]
  isReExpanding: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerChildrenLoadedCallback: (folderId: string, callback: (children: any[]) => void) => void
  unregisterChildrenLoadedCallback: (folderId: string) => void
}

export interface ExpandedFoldersProviderProps {
  children: React.ReactNode
}
