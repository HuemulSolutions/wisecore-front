import type { ElementType } from 'react'

export type EditType = "execute-ai" | "edit-ai" | "manual"
export type ExecutionMode = "single" | "from" | "review" | "save"

export interface MassExecutionConfig {
  templateId: string
  sectionId: string
  editType: EditType
  llmId: string
  instructions: string
  executionMode: ExecutionMode
}

export interface TemplateSection {
  id: string
  name: string
  order: number
}

export interface StepHeaderProps {
  step: number
  label: string
}

export interface SelectionCardProps {
  selected: boolean
  onClick: () => void
  icon: ElementType
  title: string
  description: string
}
