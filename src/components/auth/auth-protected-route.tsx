import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { AuthPage } from '@/pages/auth';
import { HuemulAppLoading } from '@/huemul/components/huemul-app-loading';
import { currentPath, saveReturnUrl } from '@/lib/return-url';
import type { BasicProtectedRouteProps as ProtectedRouteProps } from '@/types/auth'

export type { BasicProtectedRouteProps as ProtectedRouteProps } from '@/types/auth'

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Persist the intended URL so post-login flows can redirect back.
  // En un efecto (no en render): escribir storage durante el render es un
  // side effect que StrictMode duplica y que puede correr con datos a medias.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      saveReturnUrl(currentPath());
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return <HuemulAppLoading />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <>{children}</>;
}

/**
 * Variante layout-route de `ProtectedRoute`: se usa como `<Route element={<RequireAuth />}>`
 * para envolver a las rutas privadas y dejar hermanas públicas (`/auth/sso/callback`,
 * `/login`) fuera del guard. Sin sesión renderiza el login en la URL actual.
 */
export function RequireAuth() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}
