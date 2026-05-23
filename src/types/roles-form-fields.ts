export interface RoleFormFieldsProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  nameLabel?: string
  descriptionLabel?: string
  includeTextarea?: boolean
}
