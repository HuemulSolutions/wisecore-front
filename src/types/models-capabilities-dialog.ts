import type { LLM } from '@/types/llm'

export interface ModelCapabilitiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: LLM | null
  isUpdating: boolean
  onSubmit: (model: LLM, capabilities: string[]) => void
}
