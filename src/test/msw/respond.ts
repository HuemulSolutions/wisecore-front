import { HttpResponse } from 'msw'

/**
 * Fábricas de respuestas con el formato real del backend:
 * - éxito: `ResponseSchema` `{ transaction_id, data, timestamp, ... }`
 * - error: `ApiErrorResponse` `{ transaction_id, status_code, timestamp, error: { code, message, detail, path } }`
 *   (`ApiError.isApiErrorResponse` exige los 4 campos de arriba + `error.code`/`error.message`).
 */
let counter = 0

function transactionId(): string {
  counter += 1
  return `tx-${counter.toString().padStart(6, '0')}`
}

export function respondOk<T>(data: T, extra: Record<string, unknown> = {}, status = 200) {
  return HttpResponse.json(
    {
      transaction_id: transactionId(),
      data,
      timestamp: new Date().toISOString(),
      page: null,
      page_size: null,
      has_next: null,
      total: null,
      ...extra,
    },
    { status },
  )
}

export function respondApiError(
  status: number,
  code: string,
  message: string,
  detail: unknown = message,
  path = '/api/v1/test',
) {
  return HttpResponse.json(
    {
      transaction_id: transactionId(),
      status_code: status,
      timestamp: new Date().toISOString(),
      error: { code, message, detail, path },
    },
    { status },
  )
}

/** Error 400 tal como lo emite el handler global de `HTTPException` del backend (`code: "ERROR"`). */
export function respondHttp400(message: string, detail: string = message) {
  return respondApiError(400, 'ERROR', message, detail)
}

/** Body que NO cumple `ApiErrorResponse` (rama "legacy" del http-client). */
export function respondLegacyError(status: number, body: Record<string, unknown>) {
  return HttpResponse.json(body, { status })
}
