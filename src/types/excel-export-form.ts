export interface TemplateSection {
  id: string
  name: string
  order: number
}

export interface StepHeaderProps {
  step: number
  label: string
}

export interface ExcelExportConfig {
  templateId: string
  templateSectionIds: string[]
}

export interface ExcelExportFormProps {
  onTemplateChange?: (templateId: string) => void
  onConfigChange?: (config: ExcelExportConfig) => void
}
