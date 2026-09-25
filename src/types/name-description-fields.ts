export interface NameDescriptionFieldsProps {
  name: string
  description?: string
  onNameChange: (name: string) => void
  onDescriptionChange?: (description: string) => void
  nameLabel?: string
  descriptionLabel?: string
  namePlaceholder?: string
  descriptionPlaceholder?: string
  includeDescription?: boolean
  useTextarea?: boolean
  nameRequired?: boolean
  descriptionRequired?: boolean
  disabled?: boolean
  nameError?: string
  descriptionError?: string
}
