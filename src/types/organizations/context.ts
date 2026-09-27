import type { ReactNode } from 'react'
import type { UserOrganization } from '@/types/users'

export interface OrganizationContextType {
  selectedOrganizationId: string | null;
  organizations: UserOrganization[];
  organizationToken: string | null;
  setSelectedOrganizationId: (id: string) => void;
  setOrganizations: (organizations: UserOrganization[]) => void;
  setOrganizationToken: (token: string | null) => void;
  isLoading: boolean;
  requiresOrganizationSelection: boolean;
  setRequiresOrganizationSelection: (required: boolean) => void;
  resetOrganizationContext: () => void;
}

export interface OrganizationProviderProps {
  children: ReactNode;
}
