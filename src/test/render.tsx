/* eslint-disable react-refresh/only-export-components -- helper de tests, no participa de HMR */
/**
 * `renderWithProviders`: monta el árbol real de providers de la app
 * (`QueryClientProvider > MemoryRouter > AuthProvider > OrganizationProvider > PermissionsProvider`)
 * con una sesión opcional ya persistida.
 *
 * La sesión se escribe en localStorage Y en `httpClient` ANTES de renderizar,
 * porque `AuthProvider`/`OrganizationProvider` restauran en `useEffect` y
 * `httpClient` es estado de módulo hidratado al importar (ver http-client.ts).
 */
import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { AuthProvider } from '@/contexts/auth-context'
import { OrganizationProvider } from '@/contexts/organization-context'
import { PermissionsProvider } from '@/contexts/permissions-context'
import { httpClient } from '@/lib/http-client'
import type { User } from '@/types/users'

export interface TestSession {
  token: string
  user: User
}

export interface TestOrg {
  id: string
  token: string
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Ruta inicial del MemoryRouter. */
  route?: string
  /** Sesión de login ya persistida (token app + usuario). */
  session?: TestSession
  /** Organización seleccionada ya persistida (id + token de organización). */
  org?: TestOrg
  /** QueryClient propio; por defecto uno nuevo sin retries. */
  queryClient?: QueryClient
  /** Si es true, `ui` se monta como elemento de `<Route path="*">` y se expone `LocationSpy`. */
  withRoutes?: boolean
  /** Con `vi.useFakeTimers`, pasar `vi.advanceTimersByTime` para que user-event avance el reloj falso. */
  advanceTimers?: (ms: number) => void
}

export function persistSession(session?: TestSession, org?: TestOrg): void {
  if (session) {
    localStorage.setItem('auth_token', session.token)
    localStorage.setItem('auth_user', JSON.stringify(session.user))
    httpClient.setLoginToken(session.token)
  }
  if (org) {
    localStorage.setItem('selectedOrganizationId', org.id)
    localStorage.setItem('organizationToken', org.token)
    httpClient.setOrganizationId(org.id)
    httpClient.setOrganizationToken(org.token)
  }
}

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

/** Renderiza la URL actual del router para poder afirmar sobre navegación. */
export function LocationSpy() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { route = '/', session, org, queryClient = makeTestQueryClient(), withRoutes = false, advanceTimers, ...renderOptions } = options
  persistSession(session, org)

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>
            <OrganizationProvider>
              <PermissionsProvider>
                {withRoutes ? (
                  <>
                    <Routes>
                      <Route path="*" element={children} />
                    </Routes>
                    <LocationSpy />
                  </>
                ) : (
                  children
                )}
              </PermissionsProvider>
            </OrganizationProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  const user = userEvent.setup(advanceTimers ? { advanceTimers } : undefined)
  return { user, queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
