/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · error-utils.
 */
import { describe, expect, it } from 'vitest'

import { isErrorCode, isStatusCode, parseErrorDetail } from '@/lib/error-utils'
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
})
