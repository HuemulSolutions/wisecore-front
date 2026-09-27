# Wisecore — Guía de pruebas automatizadas

Cómo escribir y correr tests en `wisecore-front`. El stack es `vitest` + `jsdom` +
`@testing-library/react` + `@testing-library/user-event` + `msw`. La infraestructura vive en
`src/test/` y la configuración en el bloque `test` de `vite.config.ts`.

## 0. Árbol de decisión

```
¿Qué estoy probando?
├─ Una función pura (lib/, utils)            → test unitario, sin providers ni msw
├─ Un servicio (services/*.ts)               → test con msw: assert sobre la request y el parseo
├─ Un componente que llama al backend         → renderWithProviders + handlers msw (server.use)
├─ Un flujo con navegación                    → renderWithProviders({ withRoutes: true }) y LocationSpy
└─ Comportamiento que TODAVÍA no existe       → it.todo en un *.target.test.tsx (ver §5)
```

## 1. Comandos

```
npm run test          # corre todo una vez (es lo que corre CI; un fallo bloquea el deploy)
npm run test:watch    # modo watch
npx vitest run src/pages/auth.baseline.test.tsx   # un archivo
```

Los tests entran en `tsc -b` (`tsconfig.app.json` incluye `src`), así que deben tipar limpio, y
eslint aplica `no-console: error` también a los tests.

## 2. Reglas

- **Nunca se llama al backend real.** `src/test/setup.ts` arranca msw con `onUnhandledRequest: 'error'`:
  una request sin handler es un fallo. Los handlers por defecto están en `src/test/msw/handlers/`;
  cada test sobreescribe lo que necesita con `server.use(...)` y `afterEach` los resetea.
- **Las respuestas usan el formato real del backend.** `respondOk(data)` arma `ResponseSchema`
  (`transaction_id`, `data`, `timestamp`, ...) y `respondApiError(status, code, message, detail)` arma
  `ApiErrorResponse` (lo que `ApiError.isApiErrorResponse` exige). `respondHttp400` imita el handler
  global de `HTTPException` del backend (`code: "ERROR"`).
- **Los asserts van sobre textos traducidos en inglés**, no sobre claves de i18n: el setup carga el
  i18n real y fija `en`. Si cambia un texto, cambia el test.
- **La sesión se persiste antes de renderizar.** `renderWithProviders({ session, org })` escribe
  localStorage y llama a `httpClient.set*` antes del `render`, porque los providers restauran en
  `useEffect` y `httpClient` es estado de módulo hidratado al importar.
- **Los JWT son falsos.** `makeLoginToken`/`makeOrgToken` (`src/test/jwt.ts`) generan
  `header.payload.firma-falsa`; `decodeJWT` no verifica firma.
- **Aislamiento:** `afterEach` limpia DOM, `localStorage`, `sessionStorage`, el `queryClient` global y
  los tokens de `httpClient`, y restaura timers reales. No dejar `vi.useFakeTimers` sin `afterEach`.
- **Temporizadores falsos:** `vi.useFakeTimers({ shouldAdvanceTime: true })` antes de renderizar, pasar
  `advanceTimers: vi.advanceTimersByTime` a `renderWithProviders`, y avanzar dentro de `act`
  (`await act(async () => { await vi.advanceTimersByTimeAsync(61_000) })`). `OrganizationProvider` y
  `PermissionsProvider` tienen polling de 1 s y 2 s: el `shouldAdvanceTime` los mantiene vivos.
- **Radix/input-otp en jsdom:** el setup ya polyfillea `matchMedia`, `ResizeObserver`, `scrollIntoView`,
  `hasPointerCapture` y `document.elementFromPoint`. Si un componente nuevo necesita otro, agregarlo al
  setup, no al test.
- **Dependencias que importan CSS** (p. ej. `react-tweet`) van en `test.server.deps.inline` de
  `vite.config.ts`; Node no puede cargar `.css` fuera de Vite.

## 3. Helpers (`src/test/`)

| Archivo | Qué da |
|---|---|
| `render.tsx` | `renderWithProviders(ui, { route, session, org, withRoutes, advanceTimers })` → `{ user, queryClient, ...render }`. `LocationSpy` renderiza `pathname + search` en `data-testid="location"`. |
| `jwt.ts` | `makeJwt`, `makeLoginToken`, `makeOrgToken`, `makeExpiredLoginToken`. |
| `fixtures.ts` | Usuarios, organizaciones, conexiones SSO y payloads `authFlow.*` con ids estables. |
| `msw/server.ts` | `server` compartido. |
| `msw/handlers/auth.ts` | `/auth/codes`, `/auth/codes/verify` (`VALID_CODE`), `/auth/login/select`, `/auth/sso/exchange` (`VALID_HANDOFF_CODE`, un solo uso). |
| `msw/handlers/organizations.ts` | `/users/organizations`, `/user_roles/user_token`, `/auth_types/*`, `/auth-sso/identities/me`, y `authMethodRequiredHandler(required)` para el 403 de step-up. |
| `msw/respond.ts` | `respondOk`, `respondApiError`, `respondHttp400`, `respondLegacyError`. |

## 4. Ejemplo mínimo

```tsx
import { http } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { backendUrl } from '@/config'
import { AuthPage } from '@/pages/auth'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondApiError } from '@/test/msw/respond'

describe('AuthPage', () => {
  it('muestra el mensaje genérico ante un 500', async () => {
    server.use(http.post(`${backendUrl}/auth/codes`, () => respondApiError(500, 'INTERNAL_ERROR', 'boom')))
    const { user } = renderWithProviders(<AuthPage />)
    await user.type(screen.getByPlaceholderText('email@example.com'), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue with Email' }))
    expect(await screen.findByText("We couldn't send the code. Please try again.")).toBeInTheDocument()
  })
})
```

## 5. Baseline vs target

- `*.baseline.test.ts(x)`: comportamiento actual que debe conservarse. Sin marcadores. Si uno falla
  durante una implementación, se rompió un contrato: arreglar el código, no el test.
- `*.target.test.tsx`: comportamiento objetivo de un plan por fases (ver `docs/sso-frontend.md`).
  Cada caso nace como `it.todo('…')` redactado como aserción; cuando la fase lo implementa, se escribe
  completo (en su archivo definitivo o ahí mismo) y se quita el `todo`. Un `todo` no ejecuta, así que
  CI solo bloquea por regresiones reales.

## 6. Errores comunes

- Usar `getByLabelText` con `HuemulField`: el label puede no estar asociado al input; preferir
  `getByPlaceholderText` o `getByRole('textbox', { name })` verificando el DOM real.
- Afirmar sobre claves (`auth:errors.invalidCode`) en vez de texto: el i18n real está cargado.
- Olvidar `withRoutes: true` cuando el componente usa `useNavigate` y se quiere afirmar sobre la URL.
- Dejar un `server.use` sin respuesta para un endpoint que el componente llama al montar
  (`/users/organizations`, `/user_roles/user_token`): msw lo reporta como error de request no manejada.
- Mockear `sonner` parcialmente sin `importOriginal`: rompe el `Toaster`.

## 7. Checklist final

- [ ] `npm run test` verde, `npm run build` y `npm run lint` limpios.
- [ ] Ningún test llama al backend real ni depende del reloj real para cooldowns.
- [ ] Los textos afirmados existen en `src/i18n/locales/*` en inglés.
- [ ] Los `it.todo` implementados en esta tarea perdieron el `todo`.


## Timeouts

El `testTimeout` global es 20 s (`vite.config.ts`): vitest levanta un worker por archivo y, con 16 archivos a la vez, un test con varios `user.type` supera los 5 s por defecto aunque en aislamiento tarde menos de 1 s. No bajar el valor por test ni "arreglar" un timeout intermitente agregando `waitFor` extra: si un test falla solo en la suite completa y pasa solo, es carga, no lógica.
