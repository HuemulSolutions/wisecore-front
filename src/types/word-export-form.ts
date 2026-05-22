export interface StepHeaderProps {
  step: number
  label: string
}

export interface WordExportConfig {
  templateId: string
  file: File | null
}

export interface WordExportFormProps {
  onTemplateChange?: (templateId: string) => void
  onConfigChange?: (config: WordExportConfig) => void
}
