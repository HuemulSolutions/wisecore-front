/**
 * Plan modo administrador (docs/sso-frontend.md, Fase 7) · BASELINE · permisos.
 *
 * Ser root admin no da permisos sobre el contenido de una organización: solo el
 * org admin tiene bypass (igual que `require_permissions` del backend). El claim
 * `is_root_admin` es una pista de UI para mostrar lo de root.
 */
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useUserPermissions } from '@/hooks/useUserPermissions'
import { renderWithProviders } from '@/test/render'
import { activeUser, ORG_A_ID, rootAdmin } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'

function Probe() {
  const { isRootAdmin, isOrgAdmin, hasPermission, canCreate, hasLoadedPermissionsOnce } = useUserPermissions()
  return (
    <dl>
      <dt>loaded</dt>
      <dd data-testid="loaded">{String(hasLoadedPermissionsOnce)}</dd>
      <dt>root</dt>
      <dd data-testid="root">{String(isRootAdmin)}</dd>
      <dt>orgAdmin</dt>
      <dd data-testid="org-admin">{String(isOrgAdmin)}</dd>
      <dt>user:c</dt>
      <dd data-testid="user-c">{String(hasPermission('user:c'))}</dd>
      <dt>canCreate user</dt>
      <dd data-testid="can-create-user">{String(canCreate('user'))}</dd>
      <dt>asset:r</dt>
      <dd data-testid="asset-r">{String(hasPermission('asset:r'))}</dd>
    </dl>
  )
}

async function waitLoaded() {
  await waitFor(() => expect(screen.getByTestId('loaded')).toHaveTextContent('true'))
}

describe('permisos · el root admin no tiene bypass de contenido', () => {
  it('root sin permisos en su token de organización: hasPermission y canCreate dan false', async () => {
    renderWithProviders(<Probe />, {
      session: { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin },
      org: { id: ORG_A_ID, token: makeOrgToken({ sub: rootAdmin.id, is_root_admin: true, permissions: [] }) },
    })
    await waitLoaded()

    expect(screen.getByTestId('root')).toHaveTextContent('true')
    expect(screen.getByTestId('user-c')).toHaveTextContent('false')
    expect(screen.getByTestId('can-create-user')).toHaveTextContent('false')
  })

  it('root con permisos de su membresía los tiene como cualquier miembro', async () => {
    renderWithProviders(<Probe />, {
      session: { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin },
      org: { id: ORG_A_ID, token: makeOrgToken({ sub: rootAdmin.id, is_root_admin: true, permissions: ['asset:r'] }) },
    })
    await waitLoaded()

    expect(screen.getByTestId('asset-r')).toHaveTextContent('true')
    expect(screen.getByTestId('user-c')).toHaveTextContent('false')
  })

  it('el org admin tiene bypass de todos los permisos de su organización', async () => {
    renderWithProviders(<Probe />, {
      session: { token: makeLoginToken({ sub: activeUser.id }), user: activeUser },
      org: { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, is_org_admin: true, permissions: [] }) },
    })
    await waitLoaded()

    expect(screen.getByTestId('org-admin')).toHaveTextContent('true')
    expect(screen.getByTestId('root')).toHaveTextContent('false')
    expect(screen.getByTestId('user-c')).toHaveTextContent('true')
    expect(screen.getByTestId('can-create-user')).toHaveTextContent('true')
  })

  it('isRootAdmin sale del token de login aunque el de organización diga false', async () => {
    renderWithProviders(<Probe />, {
      session: { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin },
      org: { id: ORG_A_ID, token: makeOrgToken({ sub: rootAdmin.id, is_root_admin: false, permissions: [] }) },
    })
    await waitLoaded()

    expect(screen.getByTestId('root')).toHaveTextContent('true')
  })

  it('un usuario común no es root ni org admin', async () => {
    renderWithProviders(<Probe />, {
      session: { token: makeLoginToken({ sub: activeUser.id }), user: activeUser },
      org: { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, permissions: ['asset:r'] }) },
    })
    await waitLoaded()

    expect(screen.getByTestId('root')).toHaveTextContent('false')
    expect(screen.getByTestId('org-admin')).toHaveTextContent('false')
    expect(screen.getByTestId('user-c')).toHaveTextContent('false')
  })
})
