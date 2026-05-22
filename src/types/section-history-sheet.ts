export interface SectionHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionExecutionId: string
  sectionName?: string
}
