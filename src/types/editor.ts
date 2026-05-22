export interface EditorProps {
  sectionId: string
  content: string
  onSave: (sectionId: string, newContent: string) => void | Promise<void>
  onCancel: () => void
  isSaving?: boolean
}
