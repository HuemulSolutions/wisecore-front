export interface CustomFieldFormFieldsProps {
  name: string
  description: string
  dataType: string
  masc: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onDataTypeChange: (value: string) => void
  onMascChange: (value: string) => void
  dataTypes: string[]
  formatDataType: (dataType: string) => string
  errors?: {
    name?: string
    description?: string
    data_type?: string
  }
  disabled?: boolean
  loadingDataTypes?: boolean
}
