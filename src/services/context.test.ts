import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '@/lib/http-client'
import { ApiError } from '@/types/api-error'
import { FakeXhr } from '@/test/fake-xhr'
import { addDocumentContextWithProgress } from './context'

const file = new File(['contenido'], 'manual.pdf', { type: 'application/pdf' })

describe('addDocumentContextWithProgress', () => {
  beforeEach(() => {
    FakeXhr.reset()
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    httpClient.setOrganizationToken('org-token')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envía el archivo a add_file con los headers de organización', () => {
    void addDocumentContextWithProgress('doc-1', file, 'org-1')

    const xhr = FakeXhr.last
    expect(xhr.method).toBe('POST')
    expect(xhr.url).toMatch(/\/context\/doc-1\/add_file$/)
    expect(xhr.headers.Authorization).toBe('Bearer org-token')
    expect(xhr.headers['X-Org-Id']).toBe('org-1')
    expect((xhr.body as FormData).get('file')).toBe(file)
  })

  it('reporta el porcentaje y resuelve con `data` al terminar', async () => {
    const onProgress = vi.fn()
    const promise = addDocumentContextWithProgress('doc-1', file, 'org-1', { onProgress })

    FakeXhr.last.emitProgress(40, 100)
    expect(onProgress).toHaveBeenLastCalledWith(40)

    FakeXhr.last.respond(200, { data: { id: 'ctx-1' } })
    await expect(promise).resolves.toEqual({ id: 'ctx-1' })
    expect(onProgress).toHaveBeenLastCalledWith(100)
  })

  it('rechaza con ApiError cuando el backend responde con el formato estandarizado', async () => {
    const promise = addDocumentContextWithProgress('doc-1', file, 'org-1')

    FakeXhr.last.respond(413, {
      transaction_id: 'tx-1',
      status_code: 413,
      timestamp: new Date().toISOString(),
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Archivo muy grande', detail: 'Archivo muy grande', path: '/x' },
    })

    await expect(promise).rejects.toBeInstanceOf(ApiError)
  })

  it('al abortar rechaza con AbortError y corta la subida', async () => {
    const controller = new AbortController()
    const promise = addDocumentContextWithProgress('doc-1', file, 'org-1', { signal: controller.signal })

    controller.abort()

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(FakeXhr.last.aborted).toBe(true)
  })

  it('no envía nada si la señal ya estaba abortada', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      addDocumentContextWithProgress('doc-1', file, 'org-1', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(FakeXhr.instances).toHaveLength(0)
  })
})
