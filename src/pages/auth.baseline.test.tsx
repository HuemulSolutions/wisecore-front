/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · página de login.
 *
 * Login por código de un usuario en UNA organización: es el camino que hoy usa
 * todo el mundo y debe seguir idéntico después del SSO.
 */
import { http } from 'msw'
import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { AuthPage } from '@/pages/auth'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondApiError, respondHttp400, respondOk } from '@/test/msw/respond'
import { authFlow } from '@/test/fixtures'
import { VALID_CODE } from '@/test/msw/handlers/auth'

const EMAIL_PLACEHOLDER = 'email@example.com'
const CONTINUE_LABEL = 'Continue with Email'
const VERIFY_LABEL = 'Verify Code'
const REQUEST_FAILED = "We couldn't send the code. Please try again."
const TOO_MANY = 'Too many attempts. Please wait a moment before trying again.'
const INVALID_CODE = 'Incorrect or expired code. Please try again.'

function otpInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"], input#otp, input[maxlength="6"]')
  if (!input) throw new Error('OTP input not found')
  return input
}

async function requestCode(user: ReturnType<typeof renderWithProviders>['user'], email: string) {
  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), email)
  await user.click(screen.getByRole('button', { name: CONTINUE_LABEL }))
}

describe('AuthPage · login por código (una organización)', () => {
  it('email → código → token guardado y sesión iniciada', async () => {
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true })

    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()

    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: VERIFY_LABEL }))

    await waitFor(() => expect(localStorage.getItem('auth_token')).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('auth_user') ?? '{}').email).toBe('ada@example.com')
  })

  it('un email desconocido (404) y cualquier otro error muestran el MISMO mensaje genérico (anti-enumeración)', async () => {
    const { user } = renderWithProviders(<AuthPage />)

    await requestCode(user, 'nobody@unknown.example.com')
    expect(await screen.findByText(REQUEST_FAILED)).toBeInTheDocument()
    // No se filtra el texto del backend.
    expect(screen.queryByText(/user not found/i)).not.toBeInTheDocument()
  })

  it('un 500 también muestra el mensaje genérico', async () => {
    server.use(http.post(`${backendUrl}/auth/codes`, () => respondApiError(500, 'INTERNAL_ERROR', 'boom', 'boom')))
    const { user } = renderWithProviders(<AuthPage />)

    await requestCode(user, 'ada@example.com')
    expect(await screen.findByText(REQUEST_FAILED)).toBeInTheDocument()
  })

  it('429 muestra el mensaje de demasiados intentos', async () => {
    const { user } = renderWithProviders(<AuthPage />)

    await requestCode(user, 'ada@ratelimit.example.com')
    expect(await screen.findByText(TOO_MANY)).toBeInTheDocument()
  })

  it('un código inválido limpia el input y muestra el error; 429 en verify muestra demasiados intentos', async () => {
    const { user } = renderWithProviders(<AuthPage />)
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')

    await user.type(otpInput(), '000000')
    await user.click(screen.getByRole('button', { name: VERIFY_LABEL }))
    expect(await screen.findByText(INVALID_CODE)).toBeInTheDocument()
    expect(otpInput().value).toBe('')

    server.use(http.post(`${backendUrl}/auth/codes/verify`, () => respondApiError(429, 'RATE_LIMITED', 'slow', 'slow')))
    await user.type(otpInput(), '000000')
    await user.click(screen.getByRole('button', { name: VERIFY_LABEL }))
    expect(await screen.findByText(TOO_MANY)).toBeInTheDocument()
  })

  it('el reenvío queda deshabilitado 60 s, luego se habilita, reenvía y reinicia el cooldown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { user } = renderWithProviders(<AuthPage />, { advanceTimers: vi.advanceTimersByTime })
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')

    expect(screen.getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled()

    let calls = 0
    server.use(
      http.post(`${backendUrl}/auth/codes`, () => {
        calls += 1
        return respondOk(authFlow.internalCode)
      }),
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000)
    })
    const enabled = screen.getByRole('button', { name: 'Resend' })
    expect(enabled).toBeEnabled()

    await user.click(enabled)
    expect(await screen.findByText('Code sent successfully!')).toBeInTheDocument()
    expect(calls).toBe(1)
    expect(screen.getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled()
  })

  it('"Back" vuelve al formulario de email', async () => {
    const { user } = renderWithProviders(<AuthPage />)
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByPlaceholderText(EMAIL_PLACEHOLDER)).toBeInTheDocument()
  })

  it('tras el login navega a sessionStorage.returnUrl y la consume', async () => {
    sessionStorage.setItem('returnUrl', '/org-x/asset/42')
    const { user } = renderWithProviders(<AuthPage />, { withRoutes: true, route: '/org-x/asset/42' })
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')
    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: VERIFY_LABEL }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/org-x/asset/42'))
    await waitFor(() => expect(sessionStorage.getItem('returnUrl')).toBeNull())
  })

  it('un verify sin token en la respuesta se trata como código inválido (contrato actual)', async () => {
    server.use(http.post(`${backendUrl}/auth/codes/verify`, () => respondOk({ message: 'x' })))
    const { user } = renderWithProviders(<AuthPage />)
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')
    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: VERIFY_LABEL }))

    expect(await screen.findByText(INVALID_CODE)).toBeInTheDocument()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('un 400 del backend en verify muestra código inválido', async () => {
    server.use(http.post(`${backendUrl}/auth/codes/verify`, () => respondHttp400('The code has expired.')))
    const { user } = renderWithProviders(<AuthPage />)
    await requestCode(user, 'ada@example.com')
    await screen.findByText('Enter verification code')
    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: VERIFY_LABEL }))

    expect(await screen.findByText(INVALID_CODE)).toBeInTheDocument()
  })
})
