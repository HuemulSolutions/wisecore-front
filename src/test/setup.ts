/**
 * Setup global de vitest (ver `vite.config.ts` → `test.setupFiles`).
 *
 * - jest-dom para matchers (`toBeInTheDocument`, ...).
 * - i18n real en inglés: los tests afirman sobre textos traducidos, no sobre claves.
 * - msw: cualquier request sin handler es un error (nunca se llama al backend real).
 * - Polyfills que Radix/sonner necesitan en jsdom.
 * - `afterEach`: limpia DOM, storages, react-query y el estado de módulo de `httpClient`
 *   (se hidrata desde localStorage al importar y persiste entre tests).
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import i18n from '@/i18n'
import { httpClient } from '@/lib/http-client'
import { queryClient } from '@/lib/query-client'
import { server } from './msw/server'

// --- Polyfills jsdom -------------------------------------------------------
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

if (!globalThis.ResizeObserver) {
  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver
}

// input-otp usa elementFromPoint en un timer interno; jsdom no lo implementa.
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
// Radix Select/Popover llaman a estos en eventos de puntero; jsdom no los implementa.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}

// --- i18n ------------------------------------------------------------------
beforeAll(async () => {
  await i18n.changeLanguage('en')
})

// --- msw -------------------------------------------------------------------
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// --- Aislamiento entre tests ------------------------------------------------
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  queryClient.clear()
  httpClient.setLoginToken(null)
  httpClient.setOrganizationToken(null)
  httpClient.setOrganizationId(null)
  vi.useRealTimers()
})
