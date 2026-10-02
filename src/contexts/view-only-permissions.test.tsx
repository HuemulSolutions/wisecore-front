/**
 * "Solo visualización" de una colección: quien mira conserva lectura y listado, pero ninguna
 * acción de escritura, ni siquiera el org admin (que en el resto de la app lo bypassea todo).
 */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ViewOnlyPermissionsProvider, usePermissions } from '@/contexts/permissions-context'
import { renderWithProviders } from '@/test/render'
import { activeUser, ORG_A_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'

function Probe() {
  const { hasPermission, hasAnyPermission, isOrgAdmin, permissions } = usePermissions()
  return (
    <ul>
      <li>read:{String(hasPermission('asset:r'))}</li>
      <li>update:{String(hasPermission('asset:u'))}</li>
      <li>any-write:{String(hasAnyPermission(['asset:u', 'version:c']))}</li>
      <li>org-admin:{String(isOrgAdmin)}</li>
      <li>list:{permissions.join(',')}</li>
    </ul>
  )
}

const session = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const org = (isOrgAdmin: boolean) => ({
  id: ORG_A_ID,
  token: makeOrgToken({
    sub: activeUser.id,
    is_org_admin: isOrgAdmin,
    permissions: ['asset:r', 'asset:u', 'version:c', 'discussion:l'],
  }),
})

describe('ViewOnlyPermissionsProvider', () => {
  it('deja solo los permisos de lectura y listado', async () => {
    renderWithProviders(
      <ViewOnlyPermissionsProvider>
        <Probe />
      </ViewOnlyPermissionsProvider>,
      { session, org: org(false) },
    )
    expect(await screen.findByText('read:true')).toBeInTheDocument()
    expect(screen.getByText('update:false')).toBeInTheDocument()
    expect(screen.getByText('any-write:false')).toBeInTheDocument()
    expect(screen.getByText('list:asset:r,discussion:l')).toBeInTheDocument()
  })

  it('también para un org admin: lee todo, no escribe nada', async () => {
    renderWithProviders(
      <ViewOnlyPermissionsProvider>
        <Probe />
      </ViewOnlyPermissionsProvider>,
      { session, org: org(true) },
    )
    expect(await screen.findByText('read:true')).toBeInTheDocument()
    expect(screen.getByText('update:false')).toBeInTheDocument()
    expect(screen.getByText('org-admin:false')).toBeInTheDocument()
  })

  it('sin enabled no cambia nada', async () => {
    renderWithProviders(
      <ViewOnlyPermissionsProvider enabled={false}>
        <Probe />
      </ViewOnlyPermissionsProvider>,
      { session, org: org(false) },
    )
    expect(await screen.findByText('update:true')).toBeInTheDocument()
  })
})
