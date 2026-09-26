/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · error-utils.
 */
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'

import { handleApiError, isErrorCode, isStatusCode, parseErrorDetail } from '@/lib/error-utils'
import { ApiError } from '@/types/api-error'

function apiError(status: number, code: string, detail: unknown): ApiError {
  return new ApiError({
    transaction_id: 'tx-1',
    status_code: status,
    timestamp: '2026-01-01T00:00:00Z',
    error: { code, message: 'msg', detail: detail as string, path: '/x' },
  })
}

describe('error-utils', () => {
  it('parseErrorDetail devuelve el objeto cuando detail era JSON serializado', () => {
    const error = apiError(403, 'AUTH_METHOD_REQUIRED', { required_auth_flow: { auth_flow: 'internal_code' } })
    expect(parseErrorDetail<{ required_auth_flow: { auth_flow: string } }>(error)).toEqual({
      required_auth_flow: { auth_flow: 'internal_code' },
    })
  })

  it('parseErrorDetail devuelve null para detail de texto plano o errores no-API', () => {
    expect(parseErrorDetail(apiError(400, 'ERROR', 'Invalid code.'))).toBeNull()
    expect(parseErrorDetail(new Error('boom'))).toBeNull()
  })

  it('isStatusCode e isErrorCode distinguen ApiError de errores genéricos', () => {
    const error = apiError(429, 'RATE_LIMITED', 'slow down')
    expect(isStatusCode(error, 429)).toBe(true)
    expect(isStatusCode(error, 400)).toBe(false)
    expect(isErrorCode(error, 'RATE_LIMITED')).toBe(true)
    expect(isStatusCode(new Error('x'), 429)).toBe(false)
    expect(isErrorCode(new Error('x'), 'RATE_LIMITED')).toBe(false)
  })

  it('handleApiError muestra el mensaje traducido de los códigos de login/SSO en vez del texto del backend', () => {
    // Espía el `toast` real: el setup de tests ya cargó `sonner`, así que un vi.mock llega tarde.
    const toastError = vi.spyOn(toast, 'error').mockImplementation(() => '')
    handleApiError(apiError(403, 'ROOT_ADMIN_METHOD_RESTRICTED', 'raw backend detail'))
    handleApiError(apiError(400, 'ORGANIZATION_USER_LIMIT_REACHED', 'raw backend detail'))
    handleApiError(apiError(403, 'CONNECTION_DISABLED', 'raw backend detail'))

    expect(toastError.mock.calls.map(([message]) => message)).toEqual([
      'Only a root admin can change the sign-in method of a root admin.',
      'The organization has reached its user limit.',
      "Your organization's sign-in method is disabled. Contact your administrator.",
    ])
    toastError.mockRestore()
  })
})
