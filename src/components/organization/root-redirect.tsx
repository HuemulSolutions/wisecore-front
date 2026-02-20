import { Navigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/organization-context';

/**
 * Redirects the user to /:orgId/home when they hit the root path "/".
 * If no org is selected yet, uses "_" as a placeholder — the org-selection
 * dialog will still appear because the context flags it.
 */
export function RootRedirect() {
  const { selectedOrganizationId } = useOrganization();

  if (selectedOrganizationId) {
    return <Navigate to={`/${selectedOrganizationId}/home`} replace />;
  }

  // No org selected — use placeholder; the org-selection dialog will open.
  return <Navigate to="/_/home" replace />;
}
