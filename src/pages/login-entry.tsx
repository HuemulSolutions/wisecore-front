/**
 * `/login`: punto de entrada público al login (docs/sso-frontend.md §2).
 *
 * Existe para los enlaces que llegan desde fuera de la app (el correo de
 * invitación del backend apunta a `/login?email=…`). Con sesión activa manda a
 * la raíz; sin sesión muestra la página de login con el email prellenado.
 */
import { Navigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '@/contexts/auth-context'
import { HuemulAppLoading } from '@/huemul/components/huemul-app-loading'
import { AuthPage } from '@/pages/auth'

export function LoginEntryPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [searchParams] = useSearchParams()

  if (isLoading) return <HuemulAppLoading />
  if (isAuthenticated) return <Navigate to="/" replace />

  return <AuthPage initialEmail={searchParams.get('email') ?? ''} />
}

export default LoginEntryPage
