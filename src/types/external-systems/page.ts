import type { ExternalSystem } from './core'
import type { ExternalFunctionality } from '@/types/external-functionalities'

export interface ExternalSystemsPageState {
  searchTerm: string
  isSearchOpen: boolean
  selectedSystem: ExternalSystem | null
  editingSystem: ExternalSystem | null
  deletingSystem: ExternalSystem | null
  showCreateDialog: boolean
  showCreateFunctionalityDialog: boolean
  createFunctionalitySystemId: string | null
  editingFunctionality: ExternalFunctionality | null
  editingFunctionalitySystemId: string | null
  deletingFunctionality: ExternalFunctionality | null
  deletingFunctionalitySystemId: string | null
  selectedFunctionality: ExternalFunctionality | null
}
