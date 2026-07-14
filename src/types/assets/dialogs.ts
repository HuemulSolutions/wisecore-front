// Dialog component props for the assets module
import type { ReactNode } from 'react'
import type { AddSectionExecutionRequest } from '@/services/section_execution'
import type { CustomFieldDocument } from '@/types/custom-fields'

// ----------------------------------------
// Add Custom Field
// ----------------------------------------

export interface AddCustomFieldDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  onAdd: (data: any) => Promise<any>
  onImageUploadStart?: (fieldId: string) => void
  onImageUploadComplete?: () => void
}

// ----------------------------------------
// Add Section (shared Section type used across section dialogs)
// ----------------------------------------

export interface Section {
  id: string
  name: string
  prompt: string
  dependencies: string[]
  document_id?: string
  template_id?: string
  type?: string
}

export interface AddSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  sectionInsertPosition?: number
  existingSections: Section[]
  onSubmit: (values: any) => void
  isPending: boolean
}

export interface AddSectionFormProps {
  documentId: string
  onSubmit: (values: any) => void
  onCancel: () => void
  isPending: boolean
  existingSections?: Section[]
}

// ----------------------------------------
// Add Section Execution
// ----------------------------------------

export interface SectionOption {
  id: string
  name: string
}

export interface AddSectionExecutionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  afterFromSectionId: string | null
  existingSections: SectionOption[]
  onSubmit: (values: AddSectionExecutionRequest) => void
  isPending: boolean
  onClose: () => void
  defaultType?: 'ai' | 'manual' | 'reference'
  defaultManualInput?: string
}

// ----------------------------------------
// AI Edit Section
// ----------------------------------------

export interface AiEditSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (prompt: string) => void
  isProcessing?: boolean
}

// ----------------------------------------
// AI Suggestion Diff
// ----------------------------------------

export interface AiSuggestionDiffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionOutput: string
  aiSuggestionInstruction?: string | null
  aiSuggestionContent?: string | null
  aiPreview: string | null
  onAccept: () => Promise<void>
  onReject: () => Promise<void>
}

// ----------------------------------------
// Assign Version
// ----------------------------------------

export interface AssignVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (version: { major: number; minor: number; patch: number }) => void
  isProcessing?: boolean
}

// ----------------------------------------
// Create Folder
// ----------------------------------------

export interface CreateFolderLegacyProps {
  trigger: ReactNode
  parentFolder?: string
  onFolderCreated?: () => void
}

// ----------------------------------------
// Create Template
// ----------------------------------------

export interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description?: string }) => void
  isPending: boolean
}

// ----------------------------------------
// Create Template from Document
// ----------------------------------------

export interface CreateTemplateFromDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  organizationId: string | null
  onTemplateCreated: (template: { id: string; name: string }) => void
}

// ----------------------------------------
// Delete Section
// ----------------------------------------

export interface DeleteSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => Promise<void>
}

// ----------------------------------------
// Delete Section Execution
// ----------------------------------------

export interface DeleteSectionExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionExecution: {
    name?: string
  }
  onAction: () => Promise<void>
}

// ----------------------------------------
// Edit Custom Field
// ----------------------------------------

export interface EditCustomFieldAssetDialogProps {
  isOpen: boolean
  onClose: () => void
  customFieldDocument: CustomFieldDocument | null
  onUpdate: (id: string, data: any) => void
  mode?: 'content' | 'configuration'
}

// ----------------------------------------
// Import from File
// ----------------------------------------

export interface ImportAssetFromFileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId?: string
  onAssetCreated?: (asset: { id: string; name: string; type: string }) => void
}

// ----------------------------------------
// Import Configuration (JSON migration)
// ----------------------------------------

export interface ImportConfigSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: () => void
}

// ----------------------------------------
// Rename Version
// ----------------------------------------

export interface RenameVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => void
  currentName: string
  isProcessing?: boolean
}

// ----------------------------------------
// Image Preview
// ----------------------------------------

export interface ImagePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  image: { url: string; name: string } | null
}

// ----------------------------------------
// Content Delete (combined document / execution)
// ----------------------------------------

export interface ContentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deleteType: 'document' | 'execution' | null
  documentName?: string
  executionFormattedDate?: string
  onAction: () => Promise<void>
}

// ----------------------------------------
// Clone Execution
// ----------------------------------------

export interface CloneExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  executionName?: string
  onAction: () => Promise<void>
}

// ----------------------------------------
// Clone Asset Type
// ----------------------------------------

export interface CloneAssetTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetTypeName?: string
  onConfirm: (includeRelationships: boolean) => Promise<void>
}

// ----------------------------------------
// Approve Execution
// ----------------------------------------

export interface ApproveExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  executionName?: string
  onAction: () => Promise<void>
}

// ----------------------------------------
// Disapprove Execution
// ----------------------------------------

export interface DisapproveExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  executionName?: string
  onAction: () => Promise<void>
}

// ----------------------------------------
// Delete Custom Field (document)
// ----------------------------------------

export interface DeleteCustomFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldName?: string
  onAction: () => Promise<void>
}
