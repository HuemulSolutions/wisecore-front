import type { ExternalParameterType } from '@/types/external-parameters'

export interface ExternalSystemParamsTabProps {
  organizationId: string
  systemId: string
}

export interface ExternalSystemParamsEditingState {
  id: string
  name: string
  value: string
  param_type: ExternalParameterType
}

export interface ExternalSystemParamsAddFormState {
  param_type: ExternalParameterType
  name: string
  value: string
}
