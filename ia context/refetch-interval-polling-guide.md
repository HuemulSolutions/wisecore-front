# Wisecore Front — queries que se re-disparan sin parar cuando el backend falla

## Cuándo aplica

Dos variantes del mismo bug — un endpoint caído (5xx, network error) se sigue pidiendo indefinidamente en vez de quedar quieto tras el primer fallo:

1. Cualquier `useQuery` que usa `refetchInterval: (query) => ...` para decidir si seguir sondeando **leyendo un campo de `query.state.data`** (ej. `status === 'completed'`, `is_locked_external_elaboration`, `summary_status === 'pending'`), incluido un `refetchInterval` con valor fijo (`refetchInterval: 600000`) combinado con `refetchOnWindowFocus: true`.
2. Una superficie que remonta su subárbol con frecuencia (tabs que desmontan al cambiar, un gate `isLoading` que reemplaza todo el árbol, un panel condicional) montada sobre una query cuyo último fetch fue error — ver §2 más abajo.

Leer esta guía cuando la tarea sea:
- [ ] Agregar un poll nuevo a una query (esperar a que algo termine en el backend).
- [ ] Tocar un `refetchInterval` existente.
- [ ] Diagnosticar por qué un endpoint se sigue llamando sin parar cuando el backend responde error.
- [ ] Agregar una superficie nueva que remonta seguido (tabs, gates de loading) sobre datos del backend.

## §1 — `refetchInterval` que lee `data` sin chequear `status`

`query.state.data` conserva el **último valor exitoso** — no se limpia cuando un fetch posterior falla. Si el callback de `refetchInterval` solo mira `data` para decidir "¿ya terminó?", y el endpoint empieza a devolver error (500, network error, etc.) mientras el último dato conocido seguía en estado "no terminal" (`pending`, `is_locked_external_elaboration: true`, etc.), el callback nunca ve un terminal y programa el siguiente poll — **para siempre**, aunque cada fetch esté fallando. Con `retry: 0` esto se nota rápido (un request fallido detrás de otro, al ritmo del intervalo); con retry por defecto tarda un poco más pero el resultado final es el mismo.

Encontrado y corregido (2026-09) en 7 sitios: `workflow-detail-panel.tsx`, `assets-content.tsx`, `useExecutionState.ts`, `useExecutionRun.ts` (x2), `useExecutionPolling.ts`, `useLifecycleActions.ts`, `assets-version-management-sheet.tsx`.

## Regla

Todo `refetchInterval` que lee `query.state.data` para decidir si seguir sondeando debe cortar primero por error:

```ts
refetchInterval: (query) => {
  if (query.state.status === 'error') return false
  // ...lógica existente que lee query.state.data...
},
```

`query.state.status` es `'pending' | 'error' | 'success'` en React Query v5 (`@tanstack/react-query`).

Si el callback ya tiene un `try/catch` (por ejemplo porque lee un campo anidado que puede tirar), el guard de error va **antes** del `try` — es un chequeo de estado de la query, no algo que pueda lanzar.

### Ejemplo (post-fix)

```ts
// src/components/assets/content/hooks/useExecutionState.ts
refetchInterval: (query) => {
  if (query.state.status === 'error') return false;
  const status = query.state.data?.status;
  if (status === 'completed' || status === 'failed' || status === 'cancelled') return false;
  return 2000;
},
```

## §2 — remonte sobre una query en error: `retryOnMount` vs `refetchOnMount`

Una query que falló queda **siempre stale** (`dataUpdatedAt === 0` nunca supera `staleTime`), así que cualquier componente que la vuelva a montar (tabs de Radix que desmontan el inactivo, un gate `if (!isReady) return <Skeleton />` que reemplaza el árbol, un panel condicional, o simplemente OTRO componente que suscribe el mismo `queryKey` — ver ejemplo abajo) puede disparar un fetch nuevo **sin que exista ningún `refetchInterval` de por medio**. Con datos buenos esto es invisible; con un endpoint caído se ve exactamente igual que el bug de §1: requests repetidos sin parar.

**`refetchOnMount` NO es la palanca para el caso más común.** Verificado leyendo `node_modules/@tanstack/query-core/build/modern/queryObserver.js`:

```js
function shouldLoadOnMount(query, options) {
  return resolveEnabled(options.enabled, query) !== false
    && query.state.data === void 0
    && !(query.state.status === "error" && options.retryOnMount === false);
}
function shouldFetchOnMount(query, options) {
  return shouldLoadOnMount(query, options)
    || (query.state.data !== void 0 && shouldFetchOn(query, options, options.refetchOnMount));
}
```

`shouldFetchOnMount` (invocado en `onSubscribe`, en cada mount) evalúa primero `shouldLoadOnMount`. **Si la query nunca tuvo éxito** (`data === undefined` — el caso típico: el endpoint estaba caído desde el primer mount), esa rama es la que decide, y está gobernada por **`retryOnMount`**, no por `refetchOnMount`. `refetchOnMount` solo entra en juego en la segunda rama del `||`, que exige `data !== undefined` — o sea, una query que **sí tuvo éxito antes** y cuyo refetch posterior en background falló. Poner solo `refetchOnMount: (query) => status !== 'error'` y dejar `retryOnMount` en su default (`true`) **no corta nada** para el caso típico — probado en este repo (2026-09): el primer intento de fix tocó únicamente `refetchOnMount` y el loop siguió idéntico.

La política global de `src/lib/query-client.ts` corta ambos casos:

```ts
// defaultOptions.queries
refetchOnMount: (query) => query.state.status !== 'error', // query que sí tuvo éxito antes
retryOnMount: false,                                        // query que nunca tuvo éxito (el caso típico)
retry: false, // un 5xx tampoco se reintenta 3 veces solo dentro de un mismo fetch
```

Las tres opciones son necesarias juntas — son ortogonales: `retry` decide reintentos *dentro* de un fetch, `retryOnMount` decide si un *mount* sobre una query sin datos cuenta como intento nuevo, `refetchOnMount` decide lo mismo pero para una query que ya tuvo datos.

Un `refetchInterval` con **valor fijo** (no función) más `refetchOnWindowFocus: true` tiene el mismo problema por otra vía — cada tick/focus vuelve a pedir el endpoint caído sin mirar `status`. Mismo criterio, aplicado ahí:

```ts
// src/hooks/useUnreadNotificationsCount.ts
refetchInterval: (query) => (query.state.status === 'error' ? false : 600000),
refetchOnWindowFocus: (query) => query.state.status !== 'error',
```

Corregido (2026-09) en `query-client.ts` (política global) y `useUnreadNotificationsCount.ts`. Trade-off aceptado: salir de una página y volver no reintenta sola una query en error — el usuario reintenta con el botón de refresh/reintentar de esa superficie (ver regla siguiente).

**Nota sobre múltiples observers del mismo `queryKey`:** si dos componentes en el árbol llaman al mismo hook con los mismos parámetros (ej. `useMyWork` se llama tanto en `home.tsx` como, por separado, dentro de `HomeMyWorkTab` — mismo `queryKey`, comentado explícitamente en ambos archivos), comparten la cache pero son **observers independientes**: cada uno corre su propio `onSubscribe` al montar. El fix de `retryOnMount`/`refetchOnMount` cubre esto igual (corta en cada observer), pero al diagnosticar un volumen alto de requests repetidos conviene recordar que no hay un solo punto de mount — hay tantos como componentes consuman ese hook.

### Regla — toda superficie que consume backend propaga error + retry, no degrada a `0`/vacío

Cuando un dato de backend falla, la UI que lo consume debe mostrarlo como error con botón de reintentar (mismo patrón que el error state de `HuemulTable`, con `getErrorMessage` de `@/lib/error-utils`) — **no** renderizar `0`, `'—'` o una lista vacía como si el dato hubiera resuelto en ese estado. Un contador en `0` por fallo de red es indistinguible de un `0` real, y esconde el error en vez de dejar reintentar. Aplica también a checklists derivados (si un paso se calcula con `enabled && !error && condición`, un error nunca debe leerse como "paso pendiente" ni como "paso hecho" por descarte — decidir explícitamente cuál de las dos lecturas corresponde, normalmente fail-open si el paso ya tiene ese criterio para permisos faltantes, ver `useOnboardingChecklist.ts`).

## No aplica

Polls que están diseñados para ser infinitos y no dependen de un estado terminal (ej. `useDocumentMediaUrls.ts`, que refresca URLs firmadas cada X segundos basado en el TTL del backend, con un piso mínimo) — ahí no hay "terminal" que esperar, el guard de error no aplica.

## Errores comunes

- Confiar en `query.state.data` para decidir "¿sigo sondeando?" sin chequear `query.state.status`.
- Meter el guard de error dentro de un `try/catch` existente pensando que un error de fetch entra ahí — el `catch` solo atrapa excepciones síncronas al leer `data`, no errores de red/HTTP (esos van a `query.state.status === 'error'` / `query.state.error`, no lanzan dentro del callback).

## Checklist de verificación final

```
[ ] (§1) El refetchInterval corta con query.state.status === 'error' antes de mirar data
[ ] (§1) El corte por error está antes de cualquier try/catch existente en el callback
[ ] (§1) El camino feliz (dato exitoso, no terminal) sigue sondeando igual que antes
[ ] (§2) retryOnMount: false está seteado (no solo refetchOnMount) — es la palanca del caso "nunca tuvo éxito"
[ ] (§2) Ningún refetchInterval de valor fijo + refetchOnWindowFocus ignora query.state.status
[ ] (§2) La superficie que consume el dato muestra error + reintentar en vez de 0/vacío
```
