/**
 * Compatibilidad con la auditoría de autorización del backend (PR #355).
 *
 * - Los SSE de la IA de secciones van con el token de organización y no reintentan un 403.
 * - Los nombres de otros miembros salen del directorio `/user_roles/members`.
 * - Wisy se muestra solo con `chatbot:c`.
 * - Las rutas de la base admin (`/users/organizations`, `/organizations`) no llevan el
 *   `X-Org-Id` de la org activa.
 */
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import { useWisyAccess } from '@/hooks/useWisyAccess'
import { fixSection } from '@/services/generate'
import { getOrganizationMembers } from '@/services/users'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { activeUser, ORG_A_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'

function useTokens() {
  httpClient.setLoginToken('login-token')
  httpClient.setOrganizationToken('org-token')
  httpClient.setOrganizationId('org-1')
}

describe('IA de secciones (SSE)', () => {
  it('usa el token de organización y no reintenta un 403', async () => {
    useTokens()
    const seen: string[] = []
    server.use(
      http.post(`${backendUrl}/generation/fix_section`, ({ request }) => {
        seen.push(request.headers.get('Authorization') ?? '')
        return HttpResponse.json(
          { error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Forbidden', detail: 'section_execution:u' } },
          { status: 403 },
        )
      }),
    )
    const onError = vi.fn()
    const onClose = vi.fn()

    await fixSection({
      instructions: 'mejorar',
      content: 'texto',
      organizationId: 'org-1',
      onData: vi.fn(),
      onError,
      onClose,
    })

    expect(onError).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
    // Esperar un ciclo de reintento de fetchEventSource: no debe haber un segundo pedido.
    await new Promise((resolve) => setTimeout(resolve, 1200))
    expect(seen).toEqual(['Bearer org-token'])
  })
})

describe('directorio de miembros', () => {
  it('pide /user_roles/members con la organización indicada', async () => {
    useTokens()
    let url: URL | null = null
    let orgId: string | null = null
    server.use(
      http.get(`${backendUrl}/user_roles/members`, ({ request }) => {
        url = new URL(request.url)
        orgId = request.headers.get('X-Org-Id')
        return HttpResponse.json({ data: [{ id: 'u1', name: 'Ada', last_name: 'L', email: 'a@x.com', photo_url: null }], has_next: false })
      }),
    )

    const response = await getOrganizationMembers('org-2', 1, 50, ' ada ')

    expect(response.data[0].name).toBe('Ada')
    expect(orgId).toBe('org-2')
    expect(url!.searchParams.get('search')).toBe('ada')
    expect(url!.searchParams.get('page_size')).toBe('50')
  })
})

describe('X-Org-Id en rutas de la base admin', () => {
  function capture(path: string) {
    const seen = { orgId: 'unset' as string | null }
    server.use(
      http.get(`${backendUrl}${path}`, ({ request }) => {
        seen.orgId = request.headers.get('X-Org-Id')
        return HttpResponse.json({ data: [] })
      }),
    )
    return seen
  }

  it('no se manda a /users/organizations ni a la colección /organizations', async () => {
    useTokens()
    const userOrgs = capture('/users/organizations')
    const orgs = capture('/organizations/')

    await httpClient.get(`${backendUrl}/users/organizations?user_id=u1`)
    await httpClient.get(`${backendUrl}/organizations/?page=1`)

    expect(userOrgs.orgId).toBeNull()
    expect(orgs.orgId).toBeNull()
  })

  it('se sigue mandando a las rutas de la organización', async () => {
    useTokens()
    const docs = capture('/documents/')

    await httpClient.get(`${backendUrl}/documents/`)

    expect(docs.orgId).toBe('org-1')
  })
})

describe('Wisy', () => {
  function Probe() {
    const { canUseWisy, isLoading } = useWisyAccess()
    return <span data-testid="wisy">{isLoading ? 'loading' : String(canUseWisy)}</span>
  }

  async function render(permissions: string[], isOrgAdmin = false) {
    renderWithProviders(<Probe />, {
      session: { token: makeLoginToken({ sub: activeUser.id }), user: activeUser },
      org: { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, permissions, is_org_admin: isOrgAdmin }) },
    })
    await waitFor(() => expect(screen.getByTestId('wisy')).not.toHaveTextContent('loading'))
  }

  it('un lector sin chatbot:c no lo ve', async () => {
    await render(['asset:l', 'asset:r'])
    expect(screen.getByTestId('wisy')).toHaveTextContent('false')
  })

  it('con chatbot:c sí', async () => {
    await render(['chatbot:c'])
    expect(screen.getByTestId('wisy')).toHaveTextContent('true')
  })

  it('el org admin tiene bypass', async () => {
    await render([], true)
    expect(screen.getByTestId('wisy')).toHaveTextContent('true')
  })
})
