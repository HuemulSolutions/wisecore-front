export interface TemplateConfigSheetProps {
  template: {
    id: string
    name: string
    description?: string
    template_sections?: any[]
  } | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}
