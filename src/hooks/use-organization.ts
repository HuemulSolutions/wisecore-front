import { useOrganization } from "@/contexts/organization-context";
import { useEffect } from "react";

/**
 * Hook que garantiza que hay una organización seleccionada.
 * Si no la hay, activa el dialog de selección.
 * Retorna el ID de la organización seleccionada o null si aún no hay una.
 */
export function useRequiredOrganization() {
  const { 
    selectedOrganizationId, 
    setRequiresOrganizationSelection 
  } = useOrganization();

  // Verificar si necesita mostrar el dialog de selección
  useEffect(() => {
    if (!selectedOrganizationId) {
      setRequiresOrganizationSelection(true);
    }
  }, [selectedOrganizationId, setRequiresOrganizationSelection]);

  return {
    organizationId: selectedOrganizationId,
    hasOrganization: !!selectedOrganizationId,
  };
}

/**
 * Hook que retorna el ID de organización y lanza error si no hay una seleccionada.
 * Útil para componentes que requieren una organización.
 */
export function useOrganizationId(): string {
  const { selectedOrganizationId } = useOrganization();
  
  if (!selectedOrganizationId) {
    throw new Error("Organization ID is required but not available");
  }
  
  return selectedOrganizationId;
}