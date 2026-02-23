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
    setRequiresOrganizationSelection,
    isLoading 
  } = useOrganization();

  // Verificar si necesita mostrar el dialog de selección
  // Wait until org context finishes restoring from localStorage to avoid
  // flashing the dialog on page refresh.
  useEffect(() => {
    if (!isLoading && !selectedOrganizationId) {
      setRequiresOrganizationSelection(true);
    }
  }, [selectedOrganizationId, setRequiresOrganizationSelection, isLoading]);

  return {
    organizationId: selectedOrganizationId,
    hasOrganization: !!selectedOrganizationId,
  };
}

/**
 * Hook que retorna el ID de organización y activa el diálogo de selección si no hay una.
 * Útil para componentes que requieren una organización.
 * Retorna null mientras no haya organización seleccionada.
 */
export function useOrganizationId(): string | null {
  const { selectedOrganizationId, setRequiresOrganizationSelection, isLoading } = useOrganization();
  
  // Wait until org context finishes restoring from localStorage to avoid
  // flashing the dialog on page refresh.
  useEffect(() => {
    if (!isLoading && !selectedOrganizationId) {
      setRequiresOrganizationSelection(true);
    }
  }, [selectedOrganizationId, setRequiresOrganizationSelection, isLoading]);
  
  return selectedOrganizationId;
}