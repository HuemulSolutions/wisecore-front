export interface TemplateSection {
  id: string
  name: string
  order: number
}

export interface StepHeaderProps {
  step: number
  label: string
}

export type ExportType = "excel" | "word"

export type DocxSource = "asset" | "template"

export interface CombinedExportConfig {
  type: ExportType
  templateId: string
  templateSectionIds: string[]
  docxSource: DocxSource | null
  docxTemplateId: string | null
  file: File | null
}

export interface CombinedExportFormProps {
  canAccessExcelExport: boolean
  canAccessWordExport: boolean
  /** `template:l|r` — sin esto el formulario no dispara GET /templates/. Obligatoria, sin default. */
  canListTemplates: boolean
  onTemplateChange?: (templateId: string) => void
  onConfigChange?: (config: CombinedExportConfig | null) => void
}
