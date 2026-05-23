import type { SupportedProvider, CreateLLMProviderRequest } from '@/types/llm-provider'

export interface CreateProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supportedProviders: SupportedProvider[]
  onSubmit: (data: CreateLLMProviderRequest) => void
  isCreating: boolean
}
