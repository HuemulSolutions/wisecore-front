/**
 * Plan SSO frontend (docs/sso-frontend.md) · TARGET.
 *
 * Comportamiento objetivo por fase. Cada caso queda como `it.todo` hasta que la
 * fase lo implemente: entonces se escribe completo (en su archivo definitivo o
 * aquí) y se quita el `todo`. Un `todo` no ejecuta ni falla, así que la suite
 * bloquea el deploy solo por regresiones reales, nunca por trabajo pendiente.
 *
 * Los casos están redactados como aserciones para que sirvan de especificación.
 */
import { describe, it } from 'vitest'

// Fase 2: implementada; sus casos viven en src/pages/sso-callback.test.tsx, src/pages/login-entry.test.tsx y src/App.routing.test.tsx.

// Fase 3: implementada; sus casos viven en src/pages/auth.flow.test.tsx.

// Fase 4: implementada; sus casos viven en src/components/auth/auth-method-required-dialog.test.tsx y src/pages/sso-callback.test.tsx.

// Fase 5: implementada; sus casos viven en src/components/auth-types/auth-types.test.tsx y src/lib/auth-type-form.test.ts.

describe('Baseline pendiente de infraestructura', () => {
  it.todo('AppLayout OrgSync: URL con :orgId distinto al contexto dispara user_token y ante fallo vuelve a la org previa (requiere montar AppLayout con sus providers)')
})
