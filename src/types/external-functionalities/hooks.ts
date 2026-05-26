import type {
  ExternalFunctionalityHttpMethod,
  ExternalFunctionalityExecutionType,
  ExternalFunctionalityClass,
  ExternalFunctionalityObjective,
} from './core'

export interface UseExternalFunctionalitiesOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  httpMethod?: ExternalFunctionalityHttpMethod
  executionType?: ExternalFunctionalityExecutionType
  functionalityClass?: ExternalFunctionalityClass
  objective?: ExternalFunctionalityObjective
}
