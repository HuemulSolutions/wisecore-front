import { setupServer } from 'msw/node'

import { authHandlers } from './handlers/auth'
import { organizationHandlers } from './handlers/organizations'

/**
 * Servidor msw compartido por toda la suite. `setup.ts` lo arranca con
 * `onUnhandledRequest: 'error'`: una request sin handler es un fallo, no un
 * silencio. Cada test puede sobreescribir handlers con `server.use(...)`;
 * `resetHandlers()` en `afterEach` vuelve a los de aquí.
 */
export const server = setupServer(...authHandlers, ...organizationHandlers)
