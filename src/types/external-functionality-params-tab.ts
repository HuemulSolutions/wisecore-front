import type { ExternalParameterType } from '@/types/external-parameters'

export interface ExternalFunctionalityParamsTabProps {
  organizationId: string
  systemId: string
  functionalityId: string
}

export interface EditingState {
  id: string
  name: string
  value: string
  param_type: ExternalParameterType
}

export interface AddFormState {
  param_type: ExternalParameterType
  name: string
  value: string
}
