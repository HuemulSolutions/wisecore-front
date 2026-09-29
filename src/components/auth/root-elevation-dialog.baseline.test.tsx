/**
 * Plan modo administrador (docs/sso-frontend.md, Fase 7, bloque C) · BASELINE · diálogo del código.
 */
import { StrictMode } from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { RootElevationDialog } from '@/components/auth/root-elevation-dialog'
import { rootElevationStore, type RootElevationReason } from '@/lib/root-elevation-store'
import { server } from '@/test/msw/server'
import { respondApiError, respondOk } from '@/test/msw/respond'
import { ROOT_ELEVATION_TOKEN, VALID_CODE } from '@/test/msw/handlers/auth'
import { renderWithProviders } from '@/test/render'
import { rootAdmin } from '@/test/fixtures'
import { makeLoginToken } from '@/test/jwt'

const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, email: rootAdmin.email, is_root_admin: true }), user: rootAdmin }

function otpInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input#root-elevation-otp, input[maxlength="6"]')
  if (!input) throw new Error('OTP input not found')
  return input
}

function renderDialog(options: { advanceTimers?: (ms: number) => void } = {}) {
  return renderWithProviders(<RootElevationDialog />, { session: rootSession, ...options })
}

function openPrompt(reason: RootElevationReason = 'required'): Promise<boolean> {
  let pending!: Promise<boolean>
  act(() => {
    pending = rootElevationStore.requestElevation(reason)
  })
  return pending
}

function countCodeRequests() {
  const counter = { calls: 0 }
  server.use(
    http.post(`${backendUrl}/auth/root-elevation/code`, () => {
      counter.calls += 1
      return respondOk({ message: 'Verification code sent to your email.', email: rootAdmin.email, expires_at: '2026-01-01T00:15:00Z' })
    }),
  )
  return counter
}

describe('RootElevationDialog', () => {
  it('sin pedido abierto no se muestra', () => {
    renderDialog()
    expect(screen.queryByTestId('root-elevation-dialog')).not.toBeInTheDocument()
  })

  it('al abrirse pide el código una sola vez y muestra el email de destino', async () => {
    const counter = countCodeRequests()
    renderDialog()
    void openPrompt('required')

    expect(
      await screen.findByText(`This action requires admin mode. Enter the 6-digit code we sent to ${rootAdmin.email}.`),
    ).toBeInTheDocument()
    expect(counter.calls).toBe(1)
  })

  it('en StrictMode (como en desarrollo) pide el código una sola vez y muestra el formulario', async () => {
    // Regresión: con una mutación disparada en un efecto, el desmontaje simulado de
    // StrictMode desenganchaba la respuesta y el diálogo quedaba en "Sending a code...".
    const counter = countCodeRequests()
    renderWithProviders(
      <StrictMode>
        <RootElevationDialog />
      </StrictMode>,
      { session: rootSession },
    )
    void openPrompt('required')

    expect(await screen.findByText(/Enter the 6-digit code we sent to/)).toBeInTheDocument()
    expect(screen.queryByText('Sending a code to your email...')).not.toBeInTheDocument()
    expect(counter.calls).toBe(1)
  })

  it('un código correcto guarda el token con su vencimiento, resuelve el pedido y cierra el diálogo', async () => {
    const { user } = renderDialog()
    const pending = openPrompt('required')
    await screen.findByText(/Enter the 6-digit code we sent to/)

    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: 'Enter admin mode' }))

    await expect(pending).resolves.toBe(true)
    expect(rootElevationStore.getToken()).toBe(ROOT_ELEVATION_TOKEN)
    expect(rootElevationStore.getSnapshot().expiresAt).toBeGreaterThan(Date.now() + 29 * 60 * 1000)
    await waitFor(() => expect(screen.queryByTestId('root-elevation-dialog')).not.toBeInTheDocument())
  })

  it('un código inválido limpia el input y muestra el error; el diálogo sigue abierto', async () => {
    const { user } = renderDialog()
    void openPrompt('required')
    await screen.findByText(/Enter the 6-digit code we sent to/)

    await user.type(otpInput(), '000000')
    await user.click(screen.getByRole('button', { name: 'Enter admin mode' }))

    expect(await screen.findByText('Incorrect or expired code. Please try again.')).toBeInTheDocument()
    expect(otpInput().value).toBe('')
    expect(rootElevationStore.getToken()).toBeNull()
    expect(screen.getByTestId('root-elevation-dialog')).toBeInTheDocument()
  })

  it('un 429 en el verify muestra el mensaje de demasiados intentos', async () => {
    server.use(
      http.post(`${backendUrl}/auth/root-elevation/verify`, () => respondApiError(429, 'RATE_LIMITED', 'Too many requests')),
    )
    const { user } = renderDialog()
    void openPrompt('required')
    await screen.findByText(/Enter the 6-digit code we sent to/)

    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: 'Enter admin mode' }))

    expect(await screen.findByText('Too many attempts. Please wait a moment before trying again.')).toBeInTheDocument()
  })

  it('reenviar queda deshabilitado 60 s, luego reenvía y reinicia el cooldown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const counter = countCodeRequests()
    const { user } = renderDialog({ advanceTimers: vi.advanceTimersByTime })
    void openPrompt('manual')
    await screen.findByText(/Enter the 6-digit code we sent to/)

    expect(screen.getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000)
    })
    const enabled = screen.getByRole('button', { name: 'Resend' })
    expect(enabled).toBeEnabled()

    await user.click(enabled)
    expect(await screen.findByText('Code sent successfully!')).toBeInTheDocument()
    expect(counter.calls).toBe(2)
    expect(screen.getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled()
  })

  it.each([
    ['required', `This action requires admin mode. Enter the 6-digit code we sent to ${rootAdmin.email}.`],
    ['expired', `Your admin mode expired. Enter the 6-digit code we sent to ${rootAdmin.email} to continue.`],
    ['manual', `Enter the 6-digit code we sent to ${rootAdmin.email} to use admin mode for 30 minutes.`],
  ] as const)('el texto cambia según el motivo: %s', async (reason, text) => {
    renderDialog()
    void openPrompt(reason)

    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it('ROOT_ADMIN_REQUIRED al pedir el código muestra el mensaje y cancelar resuelve false', async () => {
    server.use(
      http.post(`${backendUrl}/auth/root-elevation/code`, () =>
        respondApiError(403, 'ROOT_ADMIN_REQUIRED', 'Root admin mode is not available for this user'),
      ),
    )
    const { user } = renderDialog()
    const pending = openPrompt('manual')

    expect(await screen.findByText('Admin mode is not available for your account.')).toBeInTheDocument()
    expect(document.querySelector('input#root-elevation-otp')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await expect(pending).resolves.toBe(false)
    await waitFor(() => expect(screen.queryByTestId('root-elevation-dialog')).not.toBeInTheDocument())
  })

  it('cancelar sin verificar no guarda token y la sesión sigue intacta', async () => {
    const { user } = renderDialog()
    const pending = openPrompt('required')
    await screen.findByText(/Enter the 6-digit code we sent to/)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await expect(pending).resolves.toBe(false)
    expect(rootElevationStore.getToken()).toBeNull()
    expect(localStorage.getItem('auth_token')).toBe(rootSession.token)
  })
})
