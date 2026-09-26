/**
 * En una ruta de organización, el guard evalúa permisos (incluido `isOrgAdmin`)
 * solo cuando el contexto activo es de ESA organización.
 */
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProtectedRoute } from '@/components/auth/auth-protected-route-with-permissions'
import { renderWithProviders } from '@/test/render'
import { activeUser, ORG_A_ID, ORG_B_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'

const orgAdminSession = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const orgAdminOfA = { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, is_org_admin: true, permissions: [] }) }

function renderAuthTypesRoute(urlOrgId: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/:orgId/auth-types"
        element={
          <ProtectedRoute requireOrgAdmin>
            <div>auth types page</div>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { session: orgAdminSession, org: orgAdminOfA, route: `/${urlOrgId}/auth-types` },
  )
}

describe('ProtectedRoute · contexto de organización', () => {
  it('el admin de la organización activa entra a su ruta', async () => {
    renderAuthTypesRoute(ORG_A_ID)
    expect(await screen.findByText('auth types page')).toBeInTheDocument()
  })

  it('con el token de otra organización (link pegado, OrgSync en curso) espera en vez de abrir la ruta', async () => {
    renderAuthTypesRoute(ORG_B_ID)
    // Se deja correr la carga de permisos: aun así la ruta no se abre con el token de Org A.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByText('auth types page')).not.toBeInTheDocument()
  })
})
