/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 4 · step-up AUTH_METHOD_REQUIRED.
 */
import { http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { AuthMethodRequiredDialog } from '@/components/auth/auth-method-required-dialog'
import { OrganizationSelectionDialog } from '@/components/organization/organization-selection-dialog'
import { authStepUpStore } from '@/lib/auth-step-up-store'
import { ssoNavigation } from '@/lib/sso-redirect'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { activeUser, microsoftSso, ORG_A_ID, ORG_B_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import { authMethodRequiredHandler } from '@/test/msw/handlers/organizations'
import { VALID_CODE, loginTokenFor } from '@/test/msw/handlers/auth'

let assignSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  authStepUpStore.reset()
  assignSpy = vi.spyOn(ssoNavigation, 'assign').mockImplementation(() => undefined)
})
afterEach(() => {
  assignSpy.mockRestore()
  authStepUpStore.reset()
})

const session = { token: makeLoginToken({ sub: activeUser.id, email: activeUser.email }), user: activeUser }

function otpInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"], input#otp, input[maxlength="6"]')
  if (!input) throw new Error('OTP input not found')
  return input
}

describe('Step-up desde el diálogo de organización', () => {
  it('un 403 AUTH_METHOD_REQUIRED (sso) abre el diálogo con la organización y el método; "Continuar" redirige al IdP con la org pendiente', async () => {
    server.use(authMethodRequiredHandler({ auth_flow: 'sso', sso: microsoftSso }, ORG_B_ID))
    const { user } = renderWithProviders(
      <>
        <OrganizationSelectionDialog open />
        <AuthMethodRequiredDialog />
      </>,
      { session },
    )

    const trigger = await screen.findByRole('combobox')
    await waitFor(() => expect(trigger).toBeEnabled())
    await user.click(trigger)
    await user.click(within(await screen.findByRole('listbox')).getByText('Org B'))
    await user.click(screen.getByRole('button', { name: 'Continue with Selected Organization' }))

    const dialog = await screen.findByTestId('auth-step-up')
    expect(dialog).toHaveTextContent('Org B requires signing in with Microsoft Contoso')
    expect(localStorage.getItem('organizationToken')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Continue with Microsoft Contoso' }))
    expect(assignSpy).toHaveBeenCalledWith(microsoftSso.authorize_url)
    const pending = JSON.parse(sessionStorage.getItem('sso.flow') ?? '{}')
    expect(pending.pendingOrganizationId).toBe(ORG_B_ID)
    expect(pending.email).toBe(activeUser.email)
    // Cambio de org desde el switcher: no se vuelve a la ruta (de la org anterior).
    expect(pending.returnUrl).toBeNull()
  })

  it('un step-up de deep link (orgsync) conserva la ruta actual como vuelta', async () => {
    window.history.pushState({}, '', `/${ORG_B_ID}/templates`)
    const { user } = renderWithProviders(<AuthMethodRequiredDialog />, { session })
    authStepUpStore.open({ organizationId: ORG_B_ID, organizationName: 'Org B', required: { auth_flow: 'sso', sso: microsoftSso }, source: 'orgsync' })

    await user.click(await screen.findByRole('button', { name: 'Continue with Microsoft Contoso' }))
    const pending = JSON.parse(sessionStorage.getItem('sso.flow') ?? '{}')
    expect(pending.returnUrl).toBe(`/${ORG_B_ID}/templates`)
    window.history.pushState({}, '', '/')
  })

  it('un segundo 403 con el mismo método en menos de 10 minutos pasa a modo manual (aviso, sin redirección automática)', async () => {
    authStepUpStore.open({ organizationId: ORG_B_ID, organizationName: 'Org B', required: { auth_flow: 'sso', sso: microsoftSso }, source: 'test' })
    authStepUpStore.close()
    renderWithProviders(<AuthMethodRequiredDialog />, { session })
    authStepUpStore.open({ organizationId: ORG_B_ID, organizationName: 'Org B', required: { auth_flow: 'sso', sso: microsoftSso }, source: 'test' })

    const dialog = await screen.findByTestId('auth-step-up')
    expect(within(dialog).getByRole('alert')).toHaveTextContent('still requires a different sign-in method')
    expect(assignSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Choose another organization' })).toBeInTheDocument()
    // El botón sigue disponible para intentarlo a mano.
    expect(screen.getByRole('button', { name: 'Continue with Microsoft Contoso' })).toBeInTheDocument()
  })

  it('"Cancelar" cierra el diálogo y la sesión previa sigue intacta', async () => {
    const { user } = renderWithProviders(<AuthMethodRequiredDialog />, { session })
    authStepUpStore.open({ organizationId: ORG_B_ID, organizationName: 'Org B', required: { auth_flow: 'internal_code' }, source: 'test' })
    await screen.findByTestId('auth-step-up')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByTestId('auth-step-up')).not.toBeInTheDocument())
    expect(localStorage.getItem('auth_token')).toBe(session.token)
    expect(localStorage.getItem('auth_user')).toBeTruthy()
  })
})

describe('Step-up con código (internal_code) sin cerrar sesión', () => {
  it('pide el código con el email fijo, verifica, obtiene el token de la organización objetivo y cierra el diálogo', async () => {
    const codesBodies: Array<Record<string, unknown>> = []
    const orgTokenRequests: string[] = []
    server.use(
      http.post(`${backendUrl}/auth/codes`, async ({ request }) => {
        codesBodies.push((await request.json()) as Record<string, unknown>)
        return respondOk({ auth_flow: 'internal_code', message: 'sent', expires_at: null })
      }),
      http.post(`${backendUrl}/auth/codes/verify`, () =>
        respondOk({ message: 'ok', user: activeUser, token: loginTokenFor({ login_org_id: ORG_A_ID }) }),
      ),
      http.post(`${backendUrl}/user_roles/user_token`, ({ request }) => {
        orgTokenRequests.push(request.headers.get('X-Org-Id') ?? '')
        return respondOk({ token: makeOrgToken({ sub: activeUser.id, org_id: ORG_A_ID, permissions: ['asset:r'] }) })
      }),
    )
    const { user } = renderWithProviders(<AuthMethodRequiredDialog />, {
      session: { token: makeLoginToken({ sub: activeUser.id, email: activeUser.email, auth_type_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }), user: activeUser },
    })
    authStepUpStore.open({ organizationId: ORG_A_ID, organizationName: 'Org A', required: { auth_flow: 'internal_code' }, source: 'test' })
    await screen.findByTestId('auth-step-up')

    const emailInput = screen.getByPlaceholderText('email@example.com')
    expect(emailInput).toHaveValue(activeUser.email)
    expect(emailInput).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Continue with Email' }))
    expect(await screen.findByText('Enter verification code')).toBeInTheDocument()
    expect(codesBodies).toEqual([{ email: activeUser.email, purpose: 'login' }])
    // Mientras tanto, la sesión anterior nunca se cerró.
    expect(localStorage.getItem('auth_token')).toBeTruthy()

    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: 'Verify Code' }))

    await waitFor(() => expect(screen.queryByTestId('auth-step-up')).not.toBeInTheDocument())
    expect(orgTokenRequests).toEqual([ORG_A_ID])
    expect(localStorage.getItem('selectedOrganizationId')).toBe(ORG_A_ID)
    expect(localStorage.getItem('organizationToken')).toBeTruthy()
    expect(sessionStorage.getItem('auth.stepUp')).toBeNull()
  })

  it('si la organización exige un método distinto tras verificar, el diálogo se reabre con ese método', async () => {
    server.use(
      http.post(`${backendUrl}/auth/codes`, () => respondOk({ auth_flow: 'internal_code', message: 'sent', expires_at: null })),
      http.post(`${backendUrl}/auth/codes/verify`, () =>
        respondOk({ message: 'ok', user: activeUser, token: loginTokenFor({ login_org_id: ORG_B_ID }) }),
      ),
      authMethodRequiredHandler({ auth_flow: 'sso', sso: microsoftSso }),
    )
    const { user } = renderWithProviders(<AuthMethodRequiredDialog />, { session })
    authStepUpStore.open({ organizationId: ORG_B_ID, organizationName: 'Org B', required: { auth_flow: 'internal_code' }, source: 'test' })
    await screen.findByTestId('auth-step-up')
    await user.click(screen.getByRole('button', { name: 'Continue with Email' }))
    await screen.findByText('Enter verification code')
    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: 'Verify Code' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue with Microsoft Contoso' })).toBeInTheDocument())
    expect(assignSpy).not.toHaveBeenCalled()
  })
})

describe('authStepUpStore', () => {
  it('cuenta intentos por organización + método y los limpia al resolver', () => {
    const required = { auth_flow: 'internal_code' as const }
    expect(authStepUpStore.open({ organizationId: ORG_A_ID, required, source: 'test' }).manual).toBe(false)
    expect(authStepUpStore.open({ organizationId: ORG_A_ID, required, source: 'test' }).manual).toBe(true)
    // Otra organización empieza de cero.
    expect(authStepUpStore.open({ organizationId: ORG_B_ID, required, source: 'test' }).manual).toBe(false)
    authStepUpStore.resolve()
    expect(authStepUpStore.getSnapshot()).toBeNull()
    expect(authStepUpStore.open({ organizationId: ORG_B_ID, required, source: 'test' }).manual).toBe(false)
  })
})
