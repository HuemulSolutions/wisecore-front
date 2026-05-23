import type { SupportedProvider, CreateLLMProviderRequest } from '@/types/llm-provider'

export interface EditProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  supportedProviders: SupportedProvider[]
  onSubmit: (data: CreateLLMProviderRequest) => void
  isUpdating: boolean
}
