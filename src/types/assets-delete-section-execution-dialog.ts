export interface DeleteSectionExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionExecution: {
    name?: string
  }
  onAction: () => Promise<void>
}
