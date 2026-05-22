export interface ExternalSystemSecretsTabProps {
  organizationId: string
  systemId: string
}

export interface EditingState {
  id: string
  secret_key: string
  name: string
  secret_value: string
}

export interface AddFormState {
  secret_key: string
  name: string
  secret_value: string
}
