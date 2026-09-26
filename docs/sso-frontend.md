# SSO corporativo en el frontend: plan de implementación y de pruebas

> Espejo, del lado del frontend, de `docs/sso.md` en `wisecore-backend` (rama `seba-sso`). Revisión
> contra el código: 2026-09-25 (rama `feature/sso-login`, base `dev` `f2c3141c`). El estado por fase se
> lleva en el registro de cambios del final.

## 1. Contexto

El backend cambió el contrato de login: el método de autenticación de cada persona en cada
organización está asignado por membresía (`user_organizations.auth_type_id`), el flujo es org-first
(código de verificación inicial cuando hay 2+ organizaciones, luego elegir organización), existe login
federado OpenID Connect con Microsoft Entra ID y Google (`/api/v1/auth/sso/*`) y el token de
organización exige el método asignado (`403 AUTH_METHOD_REQUIRED`, step-up). `auth_flow="saml2"`
desapareció y `auth_types` pasó a ser un catálogo de conexiones por organización.

Hoy el frontend solo hace login por email + código de seis dígitos, no lee `auth_flow`, no tiene
rutas públicas (todo vive bajo `ProtectedRoute`) y no tenía ninguna prueba automatizada.

**Compatibilidad:** el backend nuevo rompe al frontend actual para todo usuario con 2+ organizaciones
y para root admins (`/codes/verify` responde `choose_organization` sin `token`). El frontend nuevo sí
funciona contra el backend viejo. Orden de despliegue: **frontend primero** (§7).

## 2. Contrato del backend que consume el front

```
POST /auth/codes {email, purpose:"login"} → data.auth_flow:
  internal_code {expires_at}                      (como hoy)
  preauth_code  {expires_at}                      (usuario con 2+ membresías; el root admin, solo las suyas)
  sso           {sso:{connection_id,name,type:'microsoft'|'google',authorize_url}}
  404 User not found.                             (email desconocido)
POST /auth/codes/verify {email,code}
  → {message,user,token}                          (caso B)
  → {auth_flow:"choose_organization", preauth_token, organizations:[{id,name,method:{kind,type,name,connection_id?}}]}   (caso C)
POST /auth/login/select {preauth_token, organization_id}
  → {message,user,token,organization} (membresía por código: el preauth ya verificó) | {auth_flow:"sso",sso,organization}
GET  /auth/sso/{connection_id}/start → 302 al IdP → vuelve al backend → redirige a
  {URL_FRONTEND}/auth/sso/callback?code=<handoff>[&return_to=/ruta]  |  ?error=<código>  |  ?linked=1
POST /auth/sso/exchange {code} → {message,user,token,return_to}       (un solo uso, 60 s)
Token app: claims auth_type_id (conexión usada; INTERNAL en código) y login_org_id
POST /user_roles/user_token → 403 {error:{code:"AUTH_METHOD_REQUIRED",
  detail:{message, required_auth_flow:{auth_flow:"internal_code"} | {auth_flow:"sso", sso:{...}}}}}
GET/POST/PUT/DELETE /auth_types  (internal|microsoft|google; organization_id, is_active, email_domains,
  has_client_secret, is_sso; client_secret write-only; lectura para todos, escritura root u org admin)
POST /auth-sso/{connection_id}/link → {authorize_url}; GET /auth-sso/identities/me
```

Códigos de error del callback SSO (`?error=`): `invalid_state`, `idp_error`, `token_exchange_failed`,
`invalid_id_token`, `tenant_not_allowed`, `domain_not_allowed`, `email_missing`, `email_not_verified`,
`account_conflict`, `identity_taken`, `user_not_found`, `user_not_active`, `connection_disabled`,
`sso_disabled`, `discovery_failed`, `handoff_invalid`.

## 3. Qué se conserva (baseline)

- Anti-enumeración: `LoginForm` muestra el mismo mensaje genérico para 404 y cualquier error (429 aparte).
- OTP: cooldown de reenvío de 60 s, limpieza del código en error, mensajes `invalidCode`/`tooManyRequests`.
- `sessionStorage.returnUrl` como mecanismo de vuelta tras login (se centraliza y sanea en la Fase 1).
- Tokens en `localStorage` (`auth_token`, `auth_user`, `organizationToken`, `selectedOrganizationId`) y
  la selección de token por URL en `http-client.ts` (`/auth/` → login token sin `X-Org-Id`).
- 401 real → toast + logout; 401 de permisos y 403 no cierran sesión.
- Diálogo de selección de organización y `OrganizationSwitcher`.

## 4. Fases

| Fase | Contenido | Cierra cuando |
|---|---|---|
| 0 | Infraestructura de tests (vitest + Testing Library + msw), helpers en `src/test/`, suite baseline, suite target con `it.todo`, este documento y `ia context/testing-guide.md`. | `npm run test` verde, `npm run build` y `npm run lint` limpios. |
| 1 | Cimientos sin cambio visible: tipos discriminados por `auth_flow`, `authService` lee el body, `selectLoginOrganization`, `exchangeSsoCode`, `services/auth-sso.ts`, claims nuevos del JWT, `lib/return-url.ts` (saneo de `returnUrl`), `lib/sso-redirect.ts`, toast de sesión expirada por i18n, escape hatch de `Authorization` en `http-client`. | Baseline sigue verde. |
| 2 | Router público: `RequireAuth` como layout route, `/auth/sso/callback` (`SsoCallbackPage`) y `/login` fuera del guard. | Bloque "Fase 2" del target sin `todo`. |
| 3 | Máquina de estados del login (`useLoginFlow`), `useCompleteLogin` (auto-selección por `login_org_id`), selector de organización con badges, pantalla de redirección al IdP. | Bloque "Fase 3". |
| 4 | Step-up `AUTH_METHOD_REQUIRED`: store + `AuthMethodRequiredDialog`, captura en el diálogo de organización y en el OrgSync de `AppLayout`, anti-loop. | Bloque "Fase 4". |
| 5 | Admin de conexiones: tipos `microsoft`/`google`, formulario por tipo, tabla, eje `requireOrgAdmin` en RBAC. | Bloque "Fase 5". |
| 6 | Método de autenticación por membresía: `MembershipAuthMethodSelect` (badge o select de conexiones elegibles por organización), select por miembro en el tab Usuarios de `/organizations` y `/global-admin` (root o admin de esa org), método para nuevos miembros al agregar, `default_auth_type_id` en el tab Detalles (root), método por organización en el tab Organizaciones de `/users` (root). Backend: `GET /users/organizations` con `auth_type` por membresía. | Tests de `organization-detail-users-tab`, `organization-detail-details-tab` y `users-detail-organizations-tab`. |
| Iteración 3 | Invitaciones por correo, sheet "Cuentas vinculadas". | — |

## 5. Plan de pruebas

### 5.1 Infraestructura

- Runner: `vitest` con `jsdom`; `@testing-library/react` + `user-event`; `msw` en Node con
  `onUnhandledRequest: 'error'` (una request sin handler es un fallo).
- `vite.config.ts` → bloque `test`; `src/test/setup.ts` (jest-dom, i18n en inglés, polyfills de Radix e
  input-otp, limpieza de storages/react-query/`httpClient` entre tests).
- Helpers: `src/test/render.tsx` (`renderWithProviders` con el árbol real de providers y sesión
  persistida antes de renderizar), `src/test/jwt.ts` (JWT falsos: `decodeJWT` no verifica firma),
  `src/test/fixtures.ts`, `src/test/msw/handlers/*` (`/auth/*`, `user_token`, `users/organizations`,
  `auth_types`), `src/test/msw/respond.ts` (formato real `ResponseSchema` / `ApiErrorResponse`).
- Convención: `*.baseline.test.ts(x)` = comportamiento que se conserva (sin marcador, debe pasar
  siempre); `*.target.test.tsx` = comportamiento objetivo, `it.todo` hasta que su fase lo implemente
  (al implementarlo se escribe completo y se quita el `todo`). Un `todo` no ejecuta, así que la suite
  bloquea el deploy solo por regresiones reales.
- CI: los workflows de Azure corren `npm run test --if-present`; con el script `test` un fallo bloquea
  el deploy a dev/qa/main. `deploy-front-dev-003.yml` solo hace build.

### 5.2 Comando y resultado esperado

```
npm run test          # una vez
npm run test:watch    # desarrollo
```

Esperado en cada fase: todos los `baseline` PASSED, los `target` de fases futuras en `todo`, cero FAILED.

### 5.3 Casos BASELINE (archivos)

- `src/lib/http-client.baseline.test.ts`: `/auth/` usa login token sin `X-Org-Id`; `user_token` respeta
  `X-Org-Id` explícito; org-scoped usa org token con fallback; 401 real → `onUnauthorized` + `handled`;
  401 `FORBIDDEN` y 403 no cierran sesión; `detail` objeto se serializa; body no estándar → `Error`.
- `src/lib/error-utils.baseline.test.ts`: `parseErrorDetail`, `isStatusCode`, `isErrorCode`.
- `src/lib/jwt-utils.baseline.test.ts`: `decodeJWT`, `isTokenExpired`, `isRootAdmin`/`isOrgAdmin`, claims nuevos.
- `src/pages/auth.baseline.test.tsx`: email → código → token; anti-enumeración (404 y 500 mismo
  mensaje); 429; código inválido limpia y muestra error; reenvío con cooldown de 60 s; "Back";
  `returnUrl` consumida; verify sin token = código inválido; 400 en verify.
- `src/components/auth/auth-protected-route.baseline.test.tsx`: sin sesión login en la URL y
  `returnUrl` guardada (no en `/` ni `/home`); con sesión children.
- `src/contexts/auth-context.baseline.test.tsx`: restore, logout (4 claves + evento), 401 → toast +
  logout + `returnUrl`.
- `src/components/organization/organization-selection-dialog.baseline.test.tsx`: lista, no-miembro
  deshabilitado, continuar → `user_token` con `X-Org-Id` y persistencia; Global Admin solo root.

### 5.4 Casos TARGET

Están redactados como aserciones en `src/components/auth/sso-plan.target.test.tsx`, agrupados por
fase (2: router/callback; 3: máquina de estados; 4: step-up; 5: admin de conexiones y RBAC), más un
baseline pendiente de infraestructura (OrgSync de `AppLayout`, que requiere montar el layout completo).

## 6. Ajustes que el frontend necesita del backend

Implementados en la rama `seba-sso` del backend además de redactarse como pedido:

1. `GET /organizations/{id}/users` devuelve `auth_type_id` y `auth_type {id,name,type}` por miembro.
2. `GET /organizations/{id}/users` accesible a org admin, no solo root.
3. `GET /organizations/{id}` expone `default_auth_type_id`.
4. El correo de invitación apunta a `{URL_FRONTEND}/login?email=…` (ruta creada en la Fase 2).

## 7. Orden de despliegue

1. Front Fases 0-1 → dev/qa (cero cambio visible).
2. Front Fases 2-5 → dev/qa → main (compatible con el backend viejo: `internal_code` sigue igual y un
   `auth_flow` desconocido cae al mensaje genérico).
3. Backend `seba-sso` con `SSO_ENABLED=false`; verificar login interno y multi-org con el front nuevo.
4. `SSO_ENABLED=true`; configurar conexiones desde `/auth-types`; prueba manual con Entra y Google.
5. Iteración 2.

## 8. Registro de cambios

| Fecha | Fase | Estado |
|---|---|---|
| 2026-09-25 | 0 | Infraestructura, helpers, 7 archivos baseline (verdes) y target con `todo`. |
| 2026-09-25 | 1 | Tipos discriminados por `auth_flow`, `authService` lee el body y suma `selectLoginOrganization`/`exchangeSsoCode`, `services/auth-sso.ts`, claims `auth_type_id`/`login_org_id`, `lib/return-url.ts` (saneo), `lib/sso-redirect.ts`, toast de sesión expirada por i18n. |
| 2026-09-25 | 2 | `RequireAuth` como layout route; rutas públicas `/auth/sso/callback` (`SsoCallbackPage`) y `/login` (`LoginEntryPage`); `useCompleteLogin`. Tests en `pages/sso-callback.test.tsx`, `pages/login-entry.test.tsx`, `App.routing.test.tsx`. |
| 2026-09-25 | 3 | `useLoginFlow` (casos A/B/C), `AuthOrganizationPicker`, `AuthMethodBadge`, `AuthSsoRedirect`, `OTPForm`/`LoginForm` adaptados. Tests en `pages/auth.flow.test.tsx`. |
| 2026-09-25 | 4 | `auth-step-up-store` (anti-loop), `AuthMethodRequiredDialog` (SSO → IdP; código → login inline sin logout), captura en el diálogo de organización y en el OrgSync de `AppLayout`. Tests en `components/auth/auth-method-required-dialog.test.tsx`. |
| 2026-09-25 | 5 | Tipos `microsoft`/`google`, `AuthTypeFormDialog` único, tabla con ámbito/dominios/estado/secreto, eje `requireOrgAdmin` (matriz, `usePageAccess`, guard, menú), traducciones. Tests en `components/auth-types/auth-types.test.tsx` y `lib/auth-type-form.test.ts`. Suite: 85 PASSED, 1 `todo` (OrgSync). |
| 2026-09-25 | 6 | Método por membresía: `membership-auth-method-select.tsx`, `useSetMembershipAuthMethod`, `useEligibleAuthTypes({organizationId})`, `setMembershipAuthMethod`, `default_auth_type_id` en `useOrganizationDetailsForm`/`updateOrganization`, `auth_type_id` al agregar miembro, eje `canEditAuthMethod`/`canManageDefaultAuthMethod` en `OrganizationDetailPanel`. Backend `seba-sso` `2ee6b8b`. 11 tests nuevos. |
| 2026-09-25 | fix | Cambio de org con SSO volvía a la org anterior: el step-up del switcher guardaba la URL de la org vieja como vuelta y el OrgSync de `AppLayout` la re-seleccionaba. Ahora el switcher no guarda vuelta (va a `/<orgNueva>/home`), solo el deep link (`source: 'orgsync'`) la conserva, y `SsoCallbackPage` descarta cualquier destino de otra organización (`pathBelongsToOtherOrg`). Microsoft sigue mostrando el selector de cuenta (`prompt=select_account`, decisión de backend). Suite: 104 PASSED. |
