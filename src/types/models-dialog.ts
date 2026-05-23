import type { LLM } from '@/types/llm'

export interface ModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: LLM | null
  providerName?: string
  isCreating: boolean
  isUpdating: boolean
  onSubmit: (data: { name: string; internal_name: string; capabilities: string[] }) => void
}
