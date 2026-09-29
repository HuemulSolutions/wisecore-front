/**
 * Plan modo administrador (docs/sso-frontend.md, Fase 7, bloque A) · BASELINE · store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EXPIRY_MARGIN_MS, rootElevationStore } from '@/lib/root-elevation-store'
import { sessionEvents } from '@/lib/session-events'

const THIRTY_MINUTES = 30 * 60 * 1000

describe('rootElevationStore · token', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-28T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('el token vive solo en memoria: nunca se escribe en localStorage ni en sessionStorage', () => {
    rootElevationStore.setElevation('elev-token', Date.now() + THIRTY_MINUTES)

    expect(rootElevationStore.getToken()).toBe('elev-token')
    const dump = (storage: Storage) =>
      Array.from({ length: storage.length }, (_, i) => {
        const key = storage.key(i) ?? ''
        return `${key}=${storage.getItem(key) ?? ''}`
      }).join('|')
    expect(dump(localStorage)).not.toContain('elev-token')
    expect(dump(sessionStorage)).not.toContain('elev-token')
  })

  it('getToken() devuelve null desde el margen previo a expires_at', () => {
    rootElevationStore.setElevation('elev-token', Date.now() + THIRTY_MINUTES)

    vi.setSystemTime(Date.now() + THIRTY_MINUTES - EXPIRY_MARGIN_MS - 1)
    expect(rootElevationStore.getToken()).toBe('elev-token')

    vi.setSystemTime(Date.now() + 1)
    expect(rootElevationStore.getToken()).toBeNull()
    expect(rootElevationStore.isElevated()).toBe(false)
  })

  it('al vencer se limpia solo y notifica a los suscriptores', () => {
    const listener = vi.fn()
    rootElevationStore.subscribe(listener)
    rootElevationStore.setElevation('elev-token', Date.now() + THIRTY_MINUTES)
    expect(rootElevationStore.getSnapshot().expiresAt).not.toBeNull()
    listener.mockClear()

    vi.advanceTimersByTime(THIRTY_MINUTES)

    expect(listener).toHaveBeenCalled()
    expect(rootElevationStore.getSnapshot().expiresAt).toBeNull()
    expect(rootElevationStore.getToken()).toBeNull()
  })

  it('clear() sale del modo y cancela el timer de vencimiento', () => {
    rootElevationStore.setElevation('elev-token', Date.now() + THIRTY_MINUTES)

    rootElevationStore.clear()

    expect(rootElevationStore.getToken()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('el snapshot conserva la referencia mientras nada cambia', () => {
    const first = rootElevationStore.getSnapshot()
    expect(rootElevationStore.getSnapshot()).toBe(first)
    rootElevationStore.setElevation('elev-token', Date.now() + THIRTY_MINUTES)
    const second = rootElevationStore.getSnapshot()
    expect(second).not.toBe(first)
    expect(rootElevationStore.getSnapshot()).toBe(second)
  })
})

describe('rootElevationStore · pedido de código', () => {
  it('dos requestElevation en paralelo comparten la misma promesa (un solo diálogo)', async () => {
    const first = rootElevationStore.requestElevation('required')
    const second = rootElevationStore.requestElevation('expired')

    expect(second).toBe(first)
    // El motivo es el del pedido que abrió el diálogo.
    expect(rootElevationStore.getSnapshot().prompt).toMatchObject({ reason: 'required' })

    rootElevationStore.resolve('elev-token', Date.now() + THIRTY_MINUTES)

    await expect(first).resolves.toBe(true)
    expect(rootElevationStore.getSnapshot().prompt).toBeNull()
    expect(rootElevationStore.getToken()).toBe('elev-token')
  })

  it('cancel() resuelve false, cierra el pedido y no guarda token', async () => {
    const pending = rootElevationStore.requestElevation('manual')

    rootElevationStore.cancel()

    await expect(pending).resolves.toBe(false)
    expect(rootElevationStore.getSnapshot().prompt).toBeNull()
    expect(rootElevationStore.getToken()).toBeNull()
  })

  it('después de cerrar un pedido, uno nuevo abre otra promesa', async () => {
    const first = rootElevationStore.requestElevation('required')
    rootElevationStore.cancel()
    await first

    const second = rootElevationStore.requestElevation('manual')

    expect(second).not.toBe(first)
    expect(rootElevationStore.getSnapshot().prompt).toMatchObject({ reason: 'manual' })
  })

  it.each(['login', 'logout'] as const)('el evento de sesión %s limpia el token y cancela un pedido abierto', async (reason) => {
    rootElevationStore.setElevation('elev-token', Date.now() + THIRTY_MINUTES)
    const pending = rootElevationStore.requestElevation('required')

    sessionEvents.emitReset(reason)

    await expect(pending).resolves.toBe(false)
    expect(rootElevationStore.getToken()).toBeNull()
    expect(rootElevationStore.getSnapshot()).toEqual({ expiresAt: null, prompt: null })
  })
})
