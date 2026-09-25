import { useAuth } from '@/contexts/auth-context';
import { AuthPage } from '@/pages/auth';
import { HuemulAppLoading } from '@/huemul/components/huemul-app-loading';
import type { BasicProtectedRouteProps as ProtectedRouteProps } from '@/types/auth'

export type { BasicProtectedRouteProps as ProtectedRouteProps } from '@/types/auth'

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <HuemulAppLoading />;
  }

  if (!isAuthenticated) {
    // Persist the intended URL so post-login flows can redirect back
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== '/' && currentUrl !== '/home') {
      sessionStorage.setItem('returnUrl', currentUrl);
    }
    return <AuthPage />;
  }

  return <>{children}</>;
}