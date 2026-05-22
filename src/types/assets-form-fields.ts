import type { FetchOptionsParams, FetchOptionsResult } from '@/huemul/components/huemul-field'

export interface AssetFormFieldsProps {
  name: string
  description: string
  internalCode: string
  templateId: string
  documentTypeId: string
  selectedDocTypeLabel?: string
  selectedDocTypeColor?: string
  createInitialVersion: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onInternalCodeChange: (value: string) => void
  onTemplateIdChange: (value: string) => void
  onDocumentTypeIdChange: (value: string) => void
  onCreateInitialVersionChange: (value: boolean) => void
  onCreateDocType?: () => void
  fetchTemplateOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>
  fetchDocumentTypeOptions: (params: FetchOptionsParams) => Promise<FetchOptionsResult>
  disabled?: boolean
}
