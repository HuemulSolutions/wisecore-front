import type { ElementType } from 'react'
import type { ChildDocumentFolder, ChildDocument, ChildDocumentExecution } from '@/services/templates'

export interface AssetSelectionPanelProps {
  templateId: string
  onExecute?: (executionIds: string[]) => void
  isExecuting?: boolean
  executeDisabled?: boolean
  selectionKey?: number
  actionLabel?: string
  actionLoadingLabel?: string
  ActionIcon?: ElementType
}

export interface FolderGroupProps {
  folder: ChildDocumentFolder
  expanded: boolean
  expandedDocs: Set<string>
  selectedExecutions: Set<string>
  onToggleFolder: () => void
  onToggleFolderSelection: () => void
  isFolderAllSelected: boolean
  isFolderSomeSelected: boolean
  onToggleDocExpand: (docId: string) => void
  onToggleExecution: (executionId: string) => void
  onToggleDocAllExecutions: (doc: ChildDocument) => void
  isAllDocExecutionsSelected: (doc: ChildDocument) => boolean
  isSomeDocExecutionsSelected: (doc: ChildDocument) => boolean
  onNavigateToDoc: (docId: string, executionId?: string) => void
}

export interface DocumentRowProps {
  doc: ChildDocument
  expandedDocs: Set<string>
  selectedExecutions: Set<string>
  onToggleDocExpand: (docId: string) => void
  onToggleExecution: (executionId: string) => void
  onToggleDocAllExecutions: (doc: ChildDocument) => void
  isAllSelected: boolean
  isSomeSelected: boolean
  onNavigateToDoc: (docId: string, executionId?: string) => void
}

export interface ExecutionRowProps {
  execution: ChildDocumentExecution
  selected: boolean
  onToggle: () => void
  isLatest?: boolean
  onNavigate: () => void
}
