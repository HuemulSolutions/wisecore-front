/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 3 · máquina de estados del login.
 */
import { http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { AuthPage } from '@/pages/auth'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { activeUser, authFlow, googleSso, microsoftSso, ORG_A_ID, ORG_B_ID, rootAdmin } from '@/test/fixtures'
import { VALID_CODE, loginTokenFor } from '@/test/msw/handlers/auth'
import { authMethodRequiredHandler } from '@/test/msw/handlers/organizations'
import { authStepUpStore } from '@/lib/auth-step-up-store'
import { ssoNavigation } from '@/lib/sso-redirect'

const EMAIL_PLACEHOLDER = 'email@example.com'
const CONTINUE_LABEL = 'Continue with Email'
const VERIFY_LABEL = 'Verify Code'
const PREAUTH_TOKEN = 'preauth-token-1'

function otpInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"], input#otp, input[maxlength="6"]')
  if (!input) throw new Error('OTP input not found')
  return input
}

async function requestCode(user: ReturnType<typeof renderWithProviders>['user'], email: string) {
  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), email)
  await user.click(screen.getByRole('button', { name: CONTINUE_LABEL }))
}

async function verify(user: ReturnType<typeof renderWithProviders>['user'], code = VALID_CODE) {
  await user.type(otpInput(), code)
  await user.click(screen.getByRole('button', { name: VERIFY_LABEL }))
}

function useCodesFlow(payload: unknown) {
  server.use(http.post(`${backendUrl}/auth/codes`, () => respondOk(payload)))
}

function useVerifyChooseOrganization() {
  server.use(http.post(`${backendUrl}/auth/codes/verify`, () => respondOk(authFlow.chooseOrganization(PREAUTH_TOKEN))))
}

let assignSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  assignSpy = vi.spyOn(ssoNavigation, 'assign').mockImplementation(() => undefined)
})
afterEach(() => {
  assignSpy.mockRestore()
  authStepUpStore.reset()
})

describe('AuthPage · caso C (varias organizaciones)', () => {
  it('preauth_code muestra el OTP de verificación; verify → selector con badges por organización', async () => {
    useCodesFlow(authFlow.preauthCode)
    useVerifyChooseOrganization()
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })

    await requestCode(user, 'ada@example.com')
    expect(await screen.findByText("Verify it's you")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled()

    await verify(user)
    const list = await screen.findByRole('list', { name: 'Choose an organization' })
    const items = within(list).getAllByRole('button')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Org A')).toBeInTheDocument()
    expect(within(items[0]).getByText('Internal Authentication')).toBeInTheDocument()
    expect(within(items[1]).getByText('Org B')).toBeInTheDocument()
    expect(within(items[1]).getByText('Microsoft Contoso')).toBeInTheDocument()
    // El usuario no elige método: no hay ningún control para cambiarlo.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('elegir una organización con método interno devuelve el token y auto-selecciona la organización sin diálogo', async () => {
    useCodesFlow(authFlow.preauthCode)
    useVerifyChooseOrganization()
    const selectBodies: Array<Record<string, unknown>> = []
    const orgTokenRequests: string[] = []
    server.use(
      http.post(`${backendUrl}/auth/login/select`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        selectBodies.push(body)
        return respondOk({ message: 'ok', user: activeUser, token: loginTokenFor({ login_org_id: ORG_A_ID }), organization: { id: ORG_A_ID, name: 'Org A' } })
      }),
      http.post(`${backendUrl}/user_roles/user_token`, ({ request }) => {
        orgTokenRequests.push(request.headers.get('X-Org-Id') ?? '')
        return respondOk({ token: loginTokenFor() })
      }),
    )
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })
    await requestCode(user, 'ada@example.com')
    await screen.findByText("Verify it's you")
    await verify(user)
    const list = await screen.findByRole('list', { name: 'Choose an organization' })

    await user.click(within(list).getByText('Org A'))

    await waitFor(() => expect(localStorage.getItem('selectedOrganizationId')).toBe(ORG_A_ID))
    expect(selectBodies).toEqual([{ preauth_token: PREAUTH_TOKEN, organization_id: ORG_A_ID }])
    expect(orgTokenRequests).toEqual([ORG_A_ID])
    expect(localStorage.getItem('auth_token')).toBeTruthy()
    expect(localStorage.getItem('organizationToken')).toBeTruthy()
  })

  it('elegir una organización con método SSO redirige al IdP y guarda el estado pendiente', async () => {
    useCodesFlow(authFlow.preauthCode)
    useVerifyChooseOrganization()
    server.use(
      http.post(`${backendUrl}/auth/login/select`, () =>
        respondOk({ auth_flow: 'sso', message: 'go', sso: microsoftSso, organization: { id: ORG_B_ID, name: 'Org B' } }),
      ),
    )
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })
    await requestCode(user, 'ada@example.com')
    await screen.findByText("Verify it's you")
    await verify(user)
    const list = await screen.findByRole('list', { name: 'Choose an organization' })

    await user.click(within(list).getByText('Org B'))

    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith(microsoftSso.authorize_url))
    expect(await screen.findByRole('status')).toHaveTextContent('Redirecting to Microsoft Contoso')
    const pending = JSON.parse(sessionStorage.getItem('sso.flow') ?? '{}')
    expect(pending.pendingOrganizationId).toBe(ORG_B_ID)
    expect(pending.email).toBe('ada@example.com')
    expect(localStorage.getItem('auth_token')).toBeNull()

    // Si el navegador bloqueó la redirección, "Continue" la repite.
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(assignSpy).toHaveBeenCalledTimes(2)
  })

  it('"Back" desde el selector vuelve al email', async () => {
    useCodesFlow(authFlow.preauthCode)
    useVerifyChooseOrganization()
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })
    await requestCode(user, 'ada@example.com')
    await screen.findByText("Verify it's you")
    await verify(user)
    await screen.findByRole('list', { name: 'Choose an organization' })

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByPlaceholderText(EMAIL_PLACEHOLDER)).toHaveValue('ada@example.com')
  })

  it('root admin: pasa por el mismo caso C con SOLO sus membresías y el login_org_id del token auto-selecciona', async () => {
    useCodesFlow(authFlow.preauthCode)
    server.use(
      http.post(`${backendUrl}/auth/codes/verify`, () =>
        respondOk({
          auth_flow: 'choose_organization',
          preauth_token: PREAUTH_TOKEN,
          // El backend lista solo las organizaciones donde el root admin es miembro
          // (el token de organización exige membresía): nada de organizaciones ajenas.
          organizations: [
            { id: ORG_A_ID, name: 'Org A', method: { kind: 'internal_code', type: 'internal', name: null } },
            { id: ORG_B_ID, name: 'Org B', method: { kind: 'internal_code', type: 'internal', name: null } },
          ],
        }),
      ),
      http.post(`${backendUrl}/auth/login/select`, () =>
        respondOk({ message: 'ok', user: rootAdmin, token: loginTokenFor({ sub: rootAdmin.id, is_root_admin: true, login_org_id: ORG_B_ID }), organization: { id: ORG_B_ID, name: 'Org B' } }),
      ),
    )
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })
    await requestCode(user, 'root@example.com')
    await screen.findByText("Verify it's you")
    await verify(user)
    const list = await screen.findByRole('list', { name: 'Choose an organization' })
    expect(within(list).getAllByRole('button')).toHaveLength(2)
    expect(within(list).getAllByText('Email code')).toHaveLength(2)

    await user.click(within(list).getByText('Org B'))
    await waitFor(() => expect(localStorage.getItem('selectedOrganizationId')).toBe(ORG_B_ID))
  })
})

describe('AuthPage · SSO y flujos no soportados', () => {
  it('/codes → sso redirige al IdP con el email como estado pendiente', async () => {
    useCodesFlow({ ...authFlow.sso, sso: googleSso })
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })

    await requestCode(user, 'ada@example.com')

    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith(googleSso.authorize_url))
    expect(await screen.findByRole('status')).toHaveTextContent('Redirecting to Google Workspace')
    const pending = JSON.parse(sessionStorage.getItem('sso.flow') ?? '{}')
    expect(pending.connectionId).toBe(googleSso.connection_id)
    expect(pending.pendingOrganizationId).toBeNull()
  })

  it('un auth_flow desconocido (p. ej. saml2 de un backend viejo) muestra el error genérico', async () => {
    useCodesFlow({ auth_flow: 'saml2', message: 'legacy', auth_type: { params: { request_url: 'https://idp.example.com' } } })
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })

    await requestCode(user, 'ada@example.com')
    expect(await screen.findByText("We couldn't send the code. Please try again.")).toBeInTheDocument()
    expect(assignSpy).not.toHaveBeenCalled()
  })

  it('verify sin login_org_id deja la organización sin seleccionar (el diálogo aparece como hoy)', async () => {
    server.use(
      http.post(`${backendUrl}/auth/codes/verify`, () =>
        respondOk({ message: 'ok', user: activeUser, token: loginTokenFor({ login_org_id: null }) }),
      ),
    )
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')
    await verify(user)

    await waitFor(() => expect(localStorage.getItem('auth_token')).toBeTruthy())
    expect(localStorage.getItem('selectedOrganizationId')).toBeNull()
  })

  it('verify con login_org_id pide el token de esa organización y la deja seleccionada', async () => {
    const orgTokenRequests: string[] = []
    server.use(
      http.post(`${backendUrl}/user_roles/user_token`, ({ request }) => {
        orgTokenRequests.push(request.headers.get('X-Org-Id') ?? '')
        return respondOk({ token: loginTokenFor() })
      }),
    )
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')
    await verify(user)

    await waitFor(() => expect(localStorage.getItem('selectedOrganizationId')).toBe(ORG_A_ID))
    expect(orgTokenRequests).toEqual([ORG_A_ID])
  })

  it('si la organización del token exige otro método, abre el step-up para esa organización', async () => {
    const required = { auth_flow: 'sso', sso: microsoftSso }
    server.use(authMethodRequiredHandler(required, ORG_A_ID))
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')
    await verify(user)

    await waitFor(() => expect(authStepUpStore.getSnapshot()).not.toBeNull())
    expect(authStepUpStore.getSnapshot()?.request).toMatchObject({ organizationId: ORG_A_ID, required, source: 'dialog' })
    expect(localStorage.getItem('selectedOrganizationId')).toBeNull()
  })
})
