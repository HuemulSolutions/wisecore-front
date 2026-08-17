import type { SupportedProvider, CreateLLMProviderRequest, LLMProvider } from './core'

export interface CreateProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supportedProviders: SupportedProvider[]
  onSubmit: (data: CreateLLMProviderRequest) => void
  isCreating: boolean
  canCreate: boolean
}

export interface DeleteProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  onAction: () => Promise<void>
  canDelete: boolean
}

export interface EditProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: LLMProvider | null
  supportedProviders: SupportedProvider[]
  onSubmit: (data: CreateLLMProviderRequest) => void
  isUpdating: boolean
  canUpdate: boolean
}
