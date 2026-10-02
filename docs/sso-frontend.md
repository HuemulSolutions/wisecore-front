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

**Compatibilidad:** front y backend se despliegan juntos, **backend primero** (§7). El frontend no
mantiene compatibilidad con el backend anterior al SSO: el backend migra los datos (`ENTRA` →
`MICROSOFT`, `users.auth_type_id` → INTERNAL) y siempre informa los campos nuevos (`auth_type` de la
membresía, `default_auth_type_id`), así que el front no contempla respuestas sin ellos.

## 2. Contrato del backend que consume el front

```
POST /auth/codes {email, purpose:"login"} → data.auth_flow:
  internal_code {expires_at}                      (como hoy)
  preauth_code  {expires_at}                      (usuario con 2+ membresías; el root admin, solo las suyas)
  sso           {sso:{connection_id,name,type:'microsoft'|'google',authorize_url}}
  404 User not found.                             (email desconocido)
  400 CONNECTION_DISABLED                         (la conexión SSO de la membresía está desactivada)
  authorize_url lleva un contexto firmado `ctx` (org, email, conexión): el front navega a la URL tal cual
POST /auth/codes/verify {email,code}
  → {message,user,token}                          (caso B)
  → {auth_flow:"choose_organization", preauth_token, organizations:[{id,name,method:{kind,type,name,connection_id?}}]}   (caso C)
POST /auth/login/select {preauth_token, organization_id}
  → {message,user,token,organization} (membresía por código: el preauth ya verificó) | {auth_flow:"sso",sso,organization}
  400 CONNECTION_DISABLED
GET  /auth/sso/{connection_id}/start → 302 al IdP → vuelve al backend → redirige a
  {URL_FRONTEND}/auth/sso/callback?code=<handoff>[&return_to=/ruta]  |  ?error=<código>  |  ?linked=1
POST /auth/sso/exchange {code} → {message,user,token,return_to}       (un solo uso, 60 s)
Token app: claims auth_type_id (conexión usada; INTERNAL en código) y login_org_id
POST /user_roles/user_token → 403 {error:{code:"AUTH_METHOD_REQUIRED",
  detail:{message, required_auth_flow:{auth_flow:"internal_code"} | {auth_flow:"sso", sso:{...}}}}}
  (internal_code: el login vino de la conexión de otra org; el sso.authorize_url trae la org destino en `ctx`)
  403 CONNECTION_DISABLED (sin step-up: lo resuelve un admin)
  403 USER_NOT_ACTIVE → el front cierra la sesión con el mensaje de cuenta inactiva
GET/POST/PUT/DELETE /auth_types  (internal|microsoft|google; organization_id, is_active, email_domains,
  has_client_secret, is_sso; client_secret write-only; lectura para todos, escritura root u org admin;
  siempre las de la organización del token de organización, también para el root admin: sin org, ninguna)
POST /auth-sso/{connection_id}/link → {authorize_url}; GET /auth-sso/identities/me
```

Códigos de error del callback SSO (`?error=`): `invalid_state`, `idp_error`, `token_exchange_failed`,
`invalid_id_token`, `tenant_not_allowed`, `domain_not_allowed`, `email_missing`, `email_not_verified`,
`account_conflict`, `identity_taken`, `user_not_found`, `user_not_active`, `connection_disabled`,
`sso_disabled`, `discovery_failed`, `handoff_invalid`, `organization_full`, `link_scope_required`.

Mensajes traducidos en `handleApiError` para `CONNECTION_DISABLED`, `ROOT_ADMIN_METHOD_RESTRICTED` (un
no-root intenta pasar a SSO a un root admin) y `ORGANIZATION_USER_LIMIT_REACHED` (alta en una org llena).

### 2.1 Modo administrador (backend `seba-root-elevation`, docs/sso.md §4.5)

Ningún token de sesión autoriza acciones de root. El claim `is_root_admin` es solo una pista de UI
(viaja con el valor de la base sea cual sea el método de login, también por SSO).

```
POST /auth/root-elevation/code   (Bearer de login u organización)
  → {message, email, expires_at}          403 ROOT_ADMIN_REQUIRED si no es root activo
POST /auth/root-elevation/verify {code}
  → {elevation_token, expires_at}         400 código inválido/vencido/sin intentos
GET  /auth/root-elevation/status  → {is_root_admin, elevated, expires_at}
Header en toda acción de root: X-Root-Elevation: <elevation_token>   (30 min absolutos, no se renueva)
403 ROOT_ELEVATION_REQUIRED   ruta de root sin header
403 ROOT_ELEVATION_EXPIRED    header vencido (también en rutas de org admin que resuelven root primero)
403 ROOT_ELEVATION_INVALID    firma, propósito o usuario distinto
403 ROOT_ADMIN_REQUIRED       el usuario ya no es root activo
```

Rutas que lo exigen: `/users` (listar, crear, aprobar, rechazar, borrar, root-admin; y leer/editar a
otro usuario), `/organizations` (crear, editar, borrar, miembros, admins; listar y miembros admiten
también al org admin), telemetría diaria, audit log, `/job/retry-shutdown`, escritura de providers
`is_managed` y bypass de tier. `require_permissions` ya no tiene excepción de root: un root sin permisos
en una organización recibe `INSUFFICIENT_PERMISSIONS` como cualquier miembro.

## 3. Qué se conserva (baseline)

- Anti-enumeración: `LoginForm` muestra el mismo mensaje genérico para 404 y cualquier error (429 aparte).
- OTP: cooldown de reenvío de 60 s, limpieza del código en error, mensajes `invalidCode`/`tooManyRequests`.
- `sessionStorage.returnUrl` como mecanismo de vuelta tras login (se centraliza y sanea en la Fase 1).
- Tokens en `localStorage` (`auth_token`, `auth_user`, `organizationToken`, `selectedOrganizationId`) y
  la selección de token por URL en `http-client.ts` (`/auth/` → login token sin `X-Org-Id`).
- 401 real → toast + logout; 401 de permisos y 403 no cierran sesión.
- Diálogo de selección de organización y `OrganizationSwitcher`.
- Permisos: solo el org admin tiene bypass; el root admin no (`permissions-context.baseline`).
- `requireRootAdmin` abre la ruta con la pista `is_root_admin` del login; el org admin no entra.
- Menú del avatar de un usuario común: perfil, preferencias, notificaciones y suscripciones según gate,
  cerrar sesión (`header-user-menu.baseline`).
- `httpClient`: un 403 que no es de elevación se lanza una vez, sin reintento ni `handled`; los bodies
  JSON y `FormData` llegan intactos; sin modo administrador nunca se manda `X-Root-Elevation`.

## 4. Fases

| Fase | Contenido | Cierra cuando |
|---|---|---|
| 0 | Infraestructura de tests (vitest + Testing Library + msw), helpers en `src/test/`, suite baseline, suite target con `it.todo`, este documento y `ia context/testing-guide.md`. | `npm run test` verde, `npm run build` y `npm run lint` limpios. |
| 1 | Cimientos sin cambio visible: tipos discriminados por `auth_flow`, `authService` lee el body, `selectLoginOrganization`, `exchangeSsoCode`, `services/auth-sso.ts`, claims nuevos del JWT, `lib/return-url.ts` (saneo de `returnUrl`), `lib/sso-redirect.ts`, toast de sesión expirada por i18n, escape hatch de `Authorization` en `http-client`. | Baseline sigue verde. |
| 2 | Router público: `RequireAuth` como layout route, `/auth/sso/callback` (`SsoCallbackPage`) y `/login` fuera del guard. | Bloque "Fase 2" del target sin `todo`. |
| 3 | Máquina de estados del login (`useLoginFlow`), `useCompleteLogin` (auto-selección por `login_org_id`), selector de organización con badges, pantalla de redirección al IdP. | Bloque "Fase 3". |
| 4 | Step-up `AUTH_METHOD_REQUIRED`: store + `AuthMethodRequiredDialog`, captura en el diálogo de organización y en el OrgSync de `AppLayout`, anti-loop. | Bloque "Fase 4". |
| 5 | Admin de conexiones: tipos `microsoft`/`google`, formulario por tipo, tabla, eje `requireOrgAdmin` en RBAC. Desde el backend #343 toda conexión es de una organización, y desde `seba-auth-types-root-scope` el alcance es la organización activa para todos, también para el root admin: la página exige organización activa (sin ella muestra "Organización requerida" y el menú no la ofrece), no hay selector "Todas las organizaciones" ni columna de ámbito, la conexión se crea en la org activa sin elegirla, y `MembershipAuthMethodSelect` queda en solo lectura cuando la organización mostrada no es la activa; la `internal` de cada org aparece como "Integrada", sin editar ni borrar. | Bloque "Fase 5". |
| 6 | Método de autenticación por membresía: `MembershipAuthMethodSelect` (badge o select de conexiones elegibles por organización), select por miembro en el tab Usuarios de `/organizations` y `/global-admin` (root o admin de esa org), método para nuevos miembros al agregar, `default_auth_type_id` en el tab Detalles (root), método por organización en el tab Organizaciones de `/users` (root). Backend: `GET /users/organizations` con `auth_type` por membresía. | Tests de `organization-detail-users-tab`, `organization-detail-details-tab` y `users-detail-organizations-tab`. |
| 7 | Modo administrador (§2.1): store en memoria (`lib/root-elevation-store.ts`), `X-Root-Elevation` y reintento en `httpClient` (A, B), `RootElevationDialog` con `OtpCodeInput` (C), ítem en el menú del avatar, badge con minutos restantes y `/global-admin` que pide el código antes de cargar (D), integración en las pantallas de root (E). El token no se persiste: un F5 sale del modo. | `root-elevation-plan.target.test.tsx` sin `todo` (sus casos pasan a `*.baseline`) y borrado. |
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
  401 `FORBIDDEN` y 403 no cierran sesión; `detail` objeto se serializa; body no estándar → `Error`;
  403 `INSUFFICIENT_PERMISSIONS` una sola vez sin `handled` (también root); header explícito no se
  pisa; body JSON intacto y `FormData` pasado tal cual a `fetch`; sin modo administrador no hay
  `X-Root-Elevation`.
- `src/contexts/permissions-context.baseline.test.tsx`: root sin permisos → `hasPermission`/`canCreate`
  false; root con permisos de su membresía; org admin con bypass; `isRootAdmin` sale del login.
- `src/components/auth/auth-protected-route-with-permissions.baseline.test.tsx`: `requireOrgAdmin` solo
  con el token de ESA org (root incluido, sin org no entra); `requireRootAdmin` abre con el login del
  root y redirige al usuario común y al org admin.
- `src/components/layout/header-user-menu.baseline.test.tsx`: ítems exactos del usuario común según
  organización activa y permiso de notificaciones; cerrar sesión.
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

Fase 7 (modo administrador): nació como `src/components/auth/root-elevation-plan.target.test.tsx`
con los bloques A (store), B (`httpClient`), C (diálogo), D (puntos de entrada) y E (integración) en
`todo`. Implementados los cinco, sus casos viven como contrato en:

- A → `src/lib/root-elevation-store.baseline.test.ts`: solo en memoria, margen de 5 s antes del
  vencimiento, limpieza sola al vencer, un pedido compartido, login/logout lo limpian.
- B → `src/lib/http-client.baseline.test.ts` ("modo administrador") y
  `src/lib/error-utils.baseline.test.ts`: header con token vigente, reintento único tras verificar
  (misma request y body), `expired` para `EXPIRED`/`INVALID`, cancelar → `handled` sin toast, sin loop,
  nunca en `/auth/root-elevation/*`, no-root sin diálogo, varios 403 → un diálogo, un 403 atrasado no
  borra el token nuevo, `ROOT_ADMIN_REQUIRED` limpia, mensajes traducidos.
- C → `src/components/auth/root-elevation-dialog.baseline.test.tsx`: un envío al abrir, verificar,
  código inválido / 429, cooldown de 60 s, texto por motivo, `ROOT_ADMIN_REQUIRED`, cancelar.
- D → `src/components/layout/header-user-menu.baseline.test.tsx`,
  `src/components/layout/header-admin-mode-badge.baseline.test.tsx` y
  `src/pages/global-admin.baseline.test.tsx`: ítem del menú solo root, badge con minutos que desaparece
  al vencer, `/global-admin` pide el código antes de cargar y no hace requests sin él.
- E → `src/components/organization/organization-detail-users-tab.root-elevation.baseline.test.tsx`:
  agregar miembro con 403 → diálogo → reintento y alta con el token.
- Además `src/lib/jwt-utils.baseline.test.ts`: los helpers de permisos no dan bypass al root.

El target se borró al quedar vacío.

## 6. Ajustes que el frontend necesita del backend

Implementados en la rama `seba-sso` del backend además de redactarse como pedido:

1. `GET /organizations/{id}/users` devuelve `auth_type_id` y `auth_type {id,name,type}` por miembro.
2. `GET /organizations/{id}/users` accesible a org admin, no solo root.
3. `GET /organizations/{id}` expone `default_auth_type_id`.
4. El correo de invitación apunta a `{URL_FRONTEND}/login?email=…` (ruta creada en la Fase 2).

Pendiente para el modo administrador (`seba-root-elevation`): `require_admin_scope`, la escritura de
`/auth_types` y `GET/PUT /users/{id}` de otro usuario responden a un root sin `X-Root-Elevation` con
un 403 genérico, no con `ROOT_ELEVATION_REQUIRED`. El front solo abre el diálogo ante los códigos de
elevación, así que en esas rutas (listar organizaciones, miembros de una org de la que el root no es
admin, conexiones, invitaciones, cambiar el método de un miembro) el root ve el error y tiene que
entrar al modo desde el menú del avatar. `/global-admin` no lo sufre porque pide el código antes de
cargar. Pedido: que esas rutas respondan `ROOT_ELEVATION_REQUIRED` cuando el usuario es root en la base
y no mandó el header.

## 7. Orden de despliegue

1. Backend (wisecore-backend#342) con `SSO_ENABLED=false` y `upgrade_bd` (migraciones admin del SSO).
2. Front (este PR, wisecore-front#256) inmediatamente después: no hay convivencia con el backend viejo.
3. Verificar login interno y multi-org (código preauth → elegir organización).
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
| 2026-09-25 | fix | Orden de despliegue: backend primero y sin compatibilidad con el backend anterior al SSO (§1, §7). El login sigue el contrato final del backend: caso C siempre con preauth, `select` responde `token`/`sso`, el root admin solo ve sus membresías. |
| 2026-09-26 | fix | Contrato del backend tras su auditoría: `CONNECTION_DISABLED` con mensaje propio (login, selector y toasts), `USER_NOT_ACTIVE` cierra la sesión (`onUnauthorized('inactive')`), callback `organization_full`/`link_scope_required`, mapa central de mensajes en `handleApiError`. `ctx` en `authorize_url` y step-up `internal_code` ya estaban soportados. |
| 2026-09-28 | 7 · 0 | Plan del modo administrador (backend `seba-root-elevation`): §2.1 con el contrato, baselines nuevos (`permissions-context`, `header-user-menu`, guard renombrado a `.baseline`, casos de `http-client`) verdes contra el código previo y target `root-elevation-plan.target.test.tsx` con los bloques A–E en `todo`. |
| 2026-09-28 | 7 | Modo administrador implementado: `lib/root-elevation-store.ts` (en memoria, pedido compartido), `X-Root-Elevation` y reintento único en `httpClient` (`discard` evita que un 403 atrasado borre el token nuevo), `services/auth-root-elevation.ts`, `RootElevationDialog` con `OtpCodeInput` + `useOtpResend` (extraídos de `OTPForm` sin cambiar su DOM), ítem en el menú del avatar, `HeaderAdminModeBadge`, `/global-admin` pide el código antes de cargar, mensajes dedicados (sin toast si el error llegó `handled`), helpers de `jwt-utils` sin bypass de root. Casos A–E pasados a `*.baseline` y target borrado. Pendiente de backend en §6. |
| 2026-09-28 | 7 · manual | Prueba en navegador contra `seba-root-elevation` (base admin local aislada): login del root, `/global-admin` pide el código y carga con `X-Root-Elevation`, crear organización, badge y menú, salir, F5 pierde el modo, 403 → diálogo → reintento al agregar un miembro, usuario común sin opción. Dos bugs arreglados con su regresión: en StrictMode el envío inicial del código (mutación en un efecto) nunca resolvía y el diálogo quedaba en "Sending a code..." (ahora `useQuery` por pedido); `/global-admin` montada ya en modo volvía a pedir el código sola al salir (ahora decide una vez por montaje). |
