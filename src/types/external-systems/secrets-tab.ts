export interface ExternalSystemSecretsTabProps {
  organizationId: string
  systemId: string
}

export interface ExternalSystemSecretsEditingState {
  id: string
  secret_key: string
  name: string
  secret_value: string
}

export interface ExternalSystemSecretsAddFormState {
  secret_key: string
  name: string
  secret_value: string
}
