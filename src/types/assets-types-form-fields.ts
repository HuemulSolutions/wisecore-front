export interface DocumentTypeFormFieldsProps {
  name: string
  color: string
  onNameChange: (value: string) => void
  onColorChange: (value: string) => void
  errors?: {
    name?: string
    color?: string
  }
  disabled?: boolean
}
