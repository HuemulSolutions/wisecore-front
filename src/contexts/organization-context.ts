import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationContextType {
  selectedOrganizationId: string | null;
  organizations: Organization[];
  setSelectedOrganizationId: (id: string) => void;
  setOrganizations: (organizations: Organization[]) => void;
  isLoading: boolean;
  requiresOrganizationSelection: boolean;
  setRequiresOrganizationSelection: (required: boolean) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [selectedOrganizationId, setSelectedOrganizationIdState] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresOrganizationSelection, setRequiresOrganizationSelection] = useState(false);

  // Cargar organización guardada en localStorage al iniciar
  useEffect(() => {
    const savedOrgId = localStorage.getItem('selectedOrganizationId');
    if (savedOrgId) {
      setSelectedOrganizationIdState(savedOrgId);
    }
    setIsLoading(false);
  }, []);

  // Guardar en localStorage cuando cambie la organización
  const setSelectedOrganizationId = (id: string) => {
    if (id === '') {
      setSelectedOrganizationIdState(null);
      localStorage.removeItem('selectedOrganizationId');
    } else {
      setSelectedOrganizationIdState(id);
      localStorage.setItem('selectedOrganizationId', id);
      setRequiresOrganizationSelection(false); // Ocultar dialog cuando se selecciona organización
    }
  };

  const value = {
    selectedOrganizationId,
    organizations,
    setSelectedOrganizationId,
    setOrganizations,
    isLoading,
    requiresOrganizationSelection,
    setRequiresOrganizationSelection,
  };

  return React.createElement(
    OrganizationContext.Provider,
    { value },
    children
  );
};