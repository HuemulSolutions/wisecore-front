import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { httpClient } from '@/lib/http-client';
import type { UserOrganization } from '@/types/users';

interface OrganizationContextType {
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
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [organizationToken, setOrganizationTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresOrganizationSelection, setRequiresOrganizationSelection] = useState(false);

  const resetOrganizationContext = () => {
    setSelectedOrganizationIdState(null);
    setOrganizations([]);
    setOrganizationTokenState(null);
    setRequiresOrganizationSelection(true);
    localStorage.removeItem('selectedOrganizationId');
    localStorage.removeItem('organizationToken');
    httpClient.setOrganizationToken(null);
    httpClient.setOrganizationId(null);
  };

  const setOrganizationToken = (token: string | null) => {
    console.log('OrganizationContext: Setting organization token:', token?.substring(0, 10) + '...');
    setOrganizationTokenState(token);
    httpClient.setOrganizationToken(token);
    if (token) {
      localStorage.setItem('organizationToken', token);
      console.log('OrganizationContext: Organization token saved to localStorage');
    } else {
      localStorage.removeItem('organizationToken');
      console.log('OrganizationContext: Organization token removed from localStorage');
    }
    console.log('OrganizationContext: Current httpClient tokens state:', httpClient.getTokensState());
  };

  // Cargar organización y token guardados en localStorage al iniciar
  useEffect(() => {
    const savedOrgId = localStorage.getItem('selectedOrganizationId');
    const savedOrgToken = localStorage.getItem('organizationToken');
    
    if (savedOrgId && savedOrgToken) {
      console.log('OrganizationContext: Restoring organization from localStorage:', savedOrgId);
      console.log('OrganizationContext: Restoring organization token:', savedOrgToken.substring(0, 10) + '...');
      setSelectedOrganizationIdState(savedOrgId);
      setOrganizationTokenState(savedOrgToken);
      setRequiresOrganizationSelection(false);
      // Configurar httpClient con la organización y token guardados
      httpClient.setOrganizationId(savedOrgId);
      httpClient.setOrganizationToken(savedOrgToken);
      console.log('OrganizationContext: httpClient configured with org token');
    } else {
      // Si no hay organización o token guardado, mostrar el dialog de selección
      setRequiresOrganizationSelection(true);
    }
    setIsLoading(false);
  }, []);

  // Escuchar cambios en el localStorage para detectar logout
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && e.newValue === null) {
        // Token removido = logout
        resetOrganizationContext();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente si el token fue removido
    const checkAuthToken = () => {
      const token = localStorage.getItem('auth_token');
      if (!token && selectedOrganizationId) {
        resetOrganizationContext();
      }
    };

    const interval = setInterval(checkAuthToken, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedOrganizationId]);

  // Guardar en localStorage cuando cambie la organización
  const setSelectedOrganizationId = (id: string) => {
    if (id === '') {
      setSelectedOrganizationIdState(null);
      localStorage.removeItem('selectedOrganizationId');
      httpClient.setOrganizationId(null);
    } else {
      setSelectedOrganizationIdState(id);
      localStorage.setItem('selectedOrganizationId', id);
      httpClient.setOrganizationId(id);
      setRequiresOrganizationSelection(false); // Ocultar dialog cuando se selecciona organización
    }
  };

  const value = {
    selectedOrganizationId,
    organizations,
    organizationToken,
    setSelectedOrganizationId,
    setOrganizations,
    setOrganizationToken,
    isLoading,
    requiresOrganizationSelection,
    setRequiresOrganizationSelection,
    resetOrganizationContext,
  };

  return React.createElement(
    OrganizationContext.Provider,
    { value },
    children
  );
};