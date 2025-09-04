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
    setSelectedOrganizationIdState(id);
    localStorage.setItem('selectedOrganizationId', id);
  };

  const value = {
    selectedOrganizationId,
    organizations,
    setSelectedOrganizationId,
    setOrganizations,
    isLoading,
  };

  return React.createElement(
    OrganizationContext.Provider,
    { value },
    children
  );
};