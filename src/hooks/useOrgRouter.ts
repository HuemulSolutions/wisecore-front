import { useNavigate, useParams } from 'react-router-dom';
import { useOrganization } from '@/contexts/organization-context';
import { useCallback } from 'react';
import type { NavigateOptions, To } from 'react-router-dom';

/**
 * Returns the effective organization ID from either URL params or context.
 * Useful when you need the orgId outside of navigation.
 */
export function useEffectiveOrgId(): string {
  const { orgId } = useParams<{ orgId: string }>();
  const { selectedOrganizationId } = useOrganization();
  return orgId || selectedOrganizationId || '_';
}

/**
 * A wrapper around useNavigate that auto-prefixes absolute paths with /:orgId.
 * Drop-in replacement for useNavigate().
 *
 * - Numeric deltas (e.g., -1) are passed through unchanged.
 * - Relative paths are passed through unchanged.
 * - Absolute paths starting with "/" are prefixed with /:orgId UNLESS
 *   they already start with the current orgId prefix (to avoid double-prefixing
 *   when navigating with location.pathname).
 */
export function useOrgNavigate() {
  const navigate = useNavigate();
  const effectiveOrgId = useEffectiveOrgId();

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        return navigate(to);
      }

      if (typeof to === 'string') {
        if (to.startsWith('/')) {
          // Don't double-prefix if path already starts with /:orgId/
          if (
            to.startsWith(`/${effectiveOrgId}/`) ||
            to === `/${effectiveOrgId}`
          ) {
            return navigate(to, options);
          }
          return navigate(`/${effectiveOrgId}${to}`, options);
        }
        return navigate(to, options);
      }

      // Object form: { pathname, search, hash }
      if (to.pathname?.startsWith('/')) {
        if (
          to.pathname.startsWith(`/${effectiveOrgId}/`) ||
          to.pathname === `/${effectiveOrgId}`
        ) {
          return navigate(to, options);
        }
        return navigate(
          { ...to, pathname: `/${effectiveOrgId}${to.pathname}` },
          options
        );
      }
      return navigate(to, options);
    },
    [navigate, effectiveOrgId]
  );
}

/**
 * Returns a function that builds org-prefixed paths.
 * Useful for Link `to` props and other places where you need a path string.
 *
 * Usage:
 *   const buildPath = useOrgPath();
 *   <Link to={buildPath('/home')} />
 */
export function useOrgPath() {
  const effectiveOrgId = useEffectiveOrgId();

  return useCallback(
    (path: string) => {
      if (path.startsWith('/')) {
        if (
          path.startsWith(`/${effectiveOrgId}/`) ||
          path === `/${effectiveOrgId}`
        ) {
          return path;
        }
        return `/${effectiveOrgId}${path}`;
      }
      return path;
    },
    [effectiveOrgId]
  );
}

/**
 * Strips the org prefix from a pathname, returning the path as if there were no org segment.
 * e.g., "/abc123/asset/folder1" → "/asset/folder1"
 */
export function stripOrgPrefix(pathname: string): string {
  // Remove the first path segment (the orgId)
  return pathname.replace(/^\/[^/]+/, '');
}
