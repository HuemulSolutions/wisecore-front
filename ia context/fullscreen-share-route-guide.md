# Wisecore — Guía de rutas compartidas a pantalla completa

Patrón para un botón "Compartir" que genera una URL: quien la abre inicia sesión (flujo normal) y cae en una vista sin header/nav, mostrando solo el contenido puntual (un formulario, un documento, un wizard). Primer caso: `/workflow/share/*` (ver `workflow-fill.tsx`, `workflow-detail-panel.tsx`, `workflow-share-dialog.tsx`, `workflow-share-url.ts`).

## 0. Árbol de decisión

```
¿Se necesita un link que otra persona abra y vea SOLO una pieza de contenido,
sin el header/nav de la app?
├─ ¿La persona NO tiene por qué tener cuenta en la org? → fuera de alcance de
│  esta guía (requiere endpoint público nuevo en backend + revisión de seguridad).
└─ ¿La persona YA pertenece a la organización?
    └─ Usar este patrón: ruta bajo /:orgId, AppLayout en "modo bare",
       reutilizar el componente de contenido existente con props para
       apagar las affordances de contexto completo (cerrar, editar, lifecycle...).
```

## 1. Por qué la ruta vive dentro de `AppLayout`, no al lado

`AppLayout` (`src/components/layout/app-layout.tsx`) es quien:
- Sincroniza el `orgId` de la URL con el contexto y genera el `organizationToken` de esa org (bloque "Sync URL orgId → organization context", `app-layout.tsx:244-328`).
- Monta los providers de los que dependen los componentes de contenido reales (`ChatbotProvider`, `GlobalPanelProvider`, `EditingGuardProvider`, `NavKnowledgeProvider`, `app-layout.tsx:570-573` en el árbol normal). No hay `TooltipProvider`: los tooltips son `title=` nativo, ver `ia context/tooltip-guide.md`.

Una ruta hermana (fuera de `<Route path="/:orgId" element={<AppLayout />}>`) quedaría sin token de org y sin esos providers. La solución es un **modo "bare"** dentro del mismo `AppLayout`: mismos hooks/efectos, pero sin `<header>`, sin `LlmConfigBanner` y sin `GlobalPanelOutlet`.

```tsx
// app-layout.tsx, después de TODOS los hooks, antes del return normal
const isBareRoute = /^\/workflow\/share\//.test(stripOrgPrefix(location.pathname))
if (isBareRoute) {
  return (
    <ChatbotProvider resetKey={selectedOrganizationId ?? 'no-org'}>
      <GlobalPanelProvider>
        <EditingGuardProvider>
          <NavKnowledgeProvider>
            <div className="flex flex-col h-screen overflow-hidden">
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </div>
          </NavKnowledgeProvider>
        </EditingGuardProvider>
      </GlobalPanelProvider>
    </ChatbotProvider>
  )
}
```

Un nuevo caso de uso (assets, diagramas, etc.) suma su propio prefijo al regex — no dupliques el bloque `if`.

## 2. El prefijo de ruta y `scripts/validate-rbac.mjs`

`scripts/validate-rbac.mjs` mapea cada `<Route>` de `App.tsx` a una entrada de `RBAC_PAGES` **por el primer segmento del path** (`spec.route.replace(/^\//, '').split('/')[0]`). Una ruta `workflow/share/template/:documentTypeId/:templateId` cae bajo la misma entrada `RBAC_PAGES.workflow` que `workflow` — cero cambios en la matriz.

Reglas duras:
- El primer segmento de la ruta compartida **debe** coincidir con el segmento del módulo dueño del contenido (`workflow/share/...`, nunca `share/workflow/...` ni una ruta top-level nueva).
- `path` en `<Route>` va como **string literal**, nunca como template literal (`path={\`${CONST}/...\`}`). El validador solo reconoce rutas reales cuando `ts.isStringLiteral(pathAttr.initializer)` — una expresión queda invisible para el chequeo (no falla, pero tampoco verifica nada).
- Definí las constantes de path en un helper de `src/lib/` (ver `workflow-share-url.ts`) para que quien construye el link y quien declara la ruta no se desincronicen — pero usalas solo para *construir URLs*, no dentro del JSX de `App.tsx`.
- Corré `npm run rbac:check` después de agregar la ruta.

## 3. El flujo de autenticación no se toca

Ya funciona sin cambios para cualquier deep link:
1. Sin sesión → `<ProtectedRoute>` (`src/App.tsx:43`) guarda `sessionStorage.returnUrl` (pathname + search) y renderiza `<AuthPage />` **en el sitio**, sin navegar a un `/login` (no existe esa ruta).
2. Tras el login/OTP, `pages/auth.tsx` navega al `returnUrl` guardado.
3. El link ya trae `orgId` en la URL → se suprime el diálogo de selección de organización (`shouldShowDialog` en `app-layout.tsx:389-393`) y el efecto de OrgSync genera el token de esa org.
4. Si la persona no pertenece a esa organización, `generateOrganizationToken` falla y el mismo efecto la rebota a su org actual (`app-layout.tsx:304-315`) — no hace falta ningún chequeo manual extra en la página compartida.

No inventes un flujo de "acceso público": si la pieza de contenido debe ser visible sin cuenta de la org, este patrón no aplica (ver §0).

## 4. El componente de contenido: parametrizar, no duplicar

No crear una copia del componente para la vista compartida. Sumar props opcionales con default = comportamiento actual, para que el uso existente (columna del panel, tab, etc.) quede intacto:

```ts
variant?: "panel" | "fullscreen"   // default "panel"
showClose?: boolean                // default true — en fullscreen no hay contenedor que cerrar
// + una prop por cada affordance que no aplica a un desconocido respondiendo
// desde un link (editar nombre, etc.)
```

Ejemplo real: `WorkflowDetailPanel` (columna derecha de `/workflow`) ganó `variant`, `showClose`, `showAssetEdit`, `showLifecycle`, `onContinueLater` — la página `workflow-fill.tsx` lo reutiliza tal cual con `variant="fullscreen"`.

No agregues un `onFinish`/pantalla terminal propia para "cerrar" el flujo **automáticamente**: la vista fullscreen debe seguir siendo el mismo componente navegable que el panel, solo sin el botón de cerrar. `WorkflowDetailPanel` no tiene ese callejón sin salida — al terminar el último paso vuelve al resumen de secciones (`setStep(null)`), con el ciclo de vida completo habilitado (`showLifecycle` en `true` por default) filtrado por los mismos permisos que ya gatean el resto del panel. Quien abre el link sigue viendo la etapa, puede seguir respondiendo otras secciones o ejecutar las transiciones que su rol permita — no queda varado en un mensaje estático de "listo, cerrá la pestaña" **al completar el wizard**.

Esto no veta una pantalla de confirmación que el usuario **pide explícitamente** y de la que puede volver. Caso real: el botón "Continuar más tarde" (`onContinueLater` en `WorkflowDetailPanel`, junto a las acciones de ciclo de vida) muestra `WorkflowSavedLaterCard` — confirma que el autoguardado ya persistió todo (el botón no dispara ningún guardado ni transición, es solo un estado visual) y ofrece "Seguir completando" para volver. Dos reglas para que esto no reintroduzca el callejón sin salida que se sacó en `7f404b8`:
- El panel se **oculta (`hidden`), nunca se desmonta** — "Seguir completando" debe devolver exactamente al mismo paso del wizard, con el formulario intacto.
- La tarjeta siempre ofrece una vuelta al flujo (mínimo "Seguir completando"); no es un final sin salida.

Segunda excepción, misma familia de reglas: una tarjeta terminal cuando el estado ACTUAL del
documento no le deja al usuario ninguna sección respondible ni transición disponible — no queda
nada que pueda seguir haciendo en esa pestaña. El disparador NO es "terminar el wizard" (eso sigue
devolviendo al resumen de secciones sin más, como describe el párrafo de arriba): es una condición
DECLARATIVA, evaluada en cada render (`finishOutcome` en `WorkflowDetailPanel`, ver
`src/lib/workflow-finish-outcome.ts`), no solo una reacción al `onSuccess` de una mutación de esta
sesión — así también cubre abrir el link cuando el documento YA está en ese estado (p. ej. dos
grupos secuenciales de la misma etapa `edit`, uno con `step_roles` de otro rol, y a este usuario ya
no le toca ninguno: `lifecycle_permissions.edit` y `stage` no cambian, así que hace falta el factor
extra `hasAnswerableSection` — al menos una sección del wizard resulta respondible AHORA — para no
leer ese hand-off como "sigue pudiendo responder"). Cuando hay outcome, se muestra
`WorkflowFinishedCard`.

A diferencia de "Continuar más tarde", esta tarjeta NO tapa el panel entero a nivel de página: vive
**dentro** del área de contenido de `WorkflowDetailPanel`, en el mismo sitio donde van el bloque de
"paso vacío" (`wizard.emptyStep.*`) y `WorkflowSectionsSummary` — el header del panel (nombre del
documento, badge de etapa) sigue visible arriba. Mismo espíritu que las reglas de arriba: el wizard
no queda desmontado (`step`/formulario intactos si el usuario vuelve), y la tarjeta ofrece "Ver mis
respuestas" (vuelve a `WorkflowSectionsSummary`, ya en solo lectura por el propio lifecycle,
reversible vía un flag local que se resetea si `finishOutcome` cambia de valor) y, si se conoce el
template de origen, "Iniciar otro activo" (navegación que resuelve la página vía `onStartAnother`,
ya que el panel no conoce los query params `dt`/`tpl` de la URL compartida).

Si el componente necesita datos que en el flujo normal vienen de una fila ya cargada (nombre, código) pero en la vista compartida solo hay IDs de la URL, agregá un fallback a lo que ya devuelve el fetch de contenido — no ensanches el tipo de la fila con campos opcionales por las dudas y listo, pero sí hacé que esos campos sean `Partial` si el llamador desde la URL no puede completarlos.

## 5. El botón "Compartir" y el link

- `src/lib/<módulo>-share-url.ts`: constantes de path (compartidas con `App.tsx`, ver §2) + funciones puras `build...ShareUrl(orgId, ...ids)` que arman la URL absoluta con `window.location.origin`.
- Un `HuemulDialog` (o `HuemulSheet`) muestra la URL en `<code className="font-mono break-all">` con botón copiar — patrón `Copy`/`Check` + `toast.success`, no hay util de clipboard compartido en el repo (ver `token-create-sheet.tsx`).
- El botón "Compartir" en sí no necesita gate de permiso extra: si la persona ve la fila/tarjeta en la UI, ya tiene los permisos que la ruta compartida va a exigir de nuevo (misma `RBAC_PAGES` entry).

## 6. Checklist de verificación

- [ ] La ruta compartida vive bajo `<Route path="/:orgId" element={<AppLayout />}>`, con `path` como string literal, primer segmento = módulo dueño.
- [ ] `npm run rbac:check` pasa sin tocar `rbac-matrix.ts`.
- [ ] `AppLayout` reconoce el nuevo prefijo en `isBareRoute` (o el regex ya lo cubre).
- [ ] El componente de contenido se **reutiliza** con props nuevas, no se duplica.
- [ ] Botón "Compartir" en cada punto de entrada relevante (fila de tabla, tarjeta, etc.) con `e.stopPropagation()` si vive dentro de un elemento clickeable.
- [ ] Probado en incógnito: link sin sesión → login → cae en la vista fullscreen correcta (no en `/home`).
- [ ] Probado con usuario de otra organización: rebota a su org, no rompe.
- [ ] Todo texto nuevo sale de `src/i18n/locales/<módulo>.ts` (regla general del proyecto).
