import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { httpClient } from '@/lib/http-client';
import { queryClient } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import { sessionEvents } from '@/lib/session-events';
import type { UserOrganization } from '@/types/users';
import type { OrganizationContextType, OrganizationProviderProps } from '@/types/organizations'
export type { OrganizationContextType }

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [selectedOrganizationId, setSelectedOrganizationIdState] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [organizationToken, setOrganizationTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresOrganizationSelection, setRequiresOrganizationSelection] = useState(false);
  // Set right before setSelectedOrganizationId during an org switch, so the
  // 1s auth-token poll below can't call resetOrganizationContext() (and its
  // queryClient.clear()) in the middle of that transition — see setter below.
  const isSwitchingOrgRef = useRef(false);

  const resetOrganizationContext = () => {
    setSelectedOrganizationIdState(null);
    setOrganizations([]);
    setOrganizationTokenState(null);
    setRequiresOrganizationSelection(true);
    localStorage.removeItem('selectedOrganizationId');
    localStorage.removeItem('organizationToken');
    httpClient.setOrganizationToken(null);
    httpClient.setOrganizationId(null);
    // This path runs on logout (detected via storage event / polling) — purge
    // cached data so it doesn't leak into whatever session comes next in this tab.
    queryClient.clear();
  };

  const setOrganizationToken = (token: string | null) => {
    logger.log('OrganizationContext: Setting organization token:', token?.substring(0, 10) + '...');
    setOrganizationTokenState(token);
    httpClient.setOrganizationToken(token);
    if (token) {
      localStorage.setItem('organizationToken', token);
      logger.log('OrganizationContext: Organization token saved to localStorage');
    } else {
      localStorage.removeItem('organizationToken');
      logger.log('OrganizationContext: Organization token removed from localStorage');
    }
    logger.log('OrganizationContext: Current httpClient tokens state:', httpClient.getTokensState());
  };

  // Cargar organización y token guardados en localStorage al iniciar
  useEffect(() => {
    const savedOrgId = localStorage.getItem('selectedOrganizationId');
    const savedOrgToken = localStorage.getItem('organizationToken');
    
    if (savedOrgId && savedOrgToken) {
      logger.log('OrganizationContext: Restoring organization from localStorage:', savedOrgId);
      logger.log('OrganizationContext: Restoring organization token:', savedOrgToken.substring(0, 10) + '...');
      setSelectedOrganizationIdState(savedOrgId);
      setOrganizationTokenState(savedOrgToken);
      setRequiresOrganizationSelection(false);
      // Configurar httpClient con la organización y token guardados
      httpClient.setOrganizationId(savedOrgId);
      httpClient.setOrganizationToken(savedOrgToken);
      logger.log('OrganizationContext: httpClient configured with org token');
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
      if (isSwitchingOrgRef.current) return; // an org switch is landing right now, don't race it
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

  // Reset explícito en transiciones de sesión (login/logout) en ESTA pestaña.
  // Necesario junto con el reset de PermissionsProvider: refreshPermissions(true)
  // pone hasLoadedPermissionsOnce en false, y ese flag se usa como
  // "permissionsNeverLoaded" solo si organizationToken sigue truthy — sin
  // limpiar también el organizationToken de este contexto, las rutas
  // org-scoped mostrarían un skeleton en vez de la pantalla de login durante
  // el ~1s que tarda el poll de auth_token en notarlo.
  useEffect(() => {
    return sessionEvents.subscribe(() => {
      logger.log('Session reset, clearing organization context...');
      resetOrganizationContext();
    });
  }, []);

  // Guardar en localStorage cuando cambie la organización
  const setSelectedOrganizationId = (id: string) => {
    if (id === '') {
      setSelectedOrganizationIdState(null);
      localStorage.removeItem('selectedOrganizationId');
      httpClient.setOrganizationId(null);
    } else {
      // Guard the 1s auth-token poll above from firing resetOrganizationContext()
      // (and its queryClient.clear()) while this switch is still landing —
      // auth_token/organizationToken can briefly look inconsistent mid-switch.
      isSwitchingOrgRef.current = true;
      setTimeout(() => { isSwitchingOrgRef.current = false; }, 2000);

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