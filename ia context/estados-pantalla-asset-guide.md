# Estados de pantalla del Asset (contenido central, Fuentes y banners)

## Cuándo aplica
- Agregar o cambiar un estado del área central del Asset (cargando, error, restringido, generando, falló, vacío…).
- Agregar un estado al sheet de Fuentes.
- Agregar o migrar un banner de versión (arriba del contenido).
- Mostrar un estado vacío / de error / de bloqueo a pantalla completa en otro módulo (reusar `HuemulScreenState`).

## Árbol de decisión
1. ¿Es un estado de pantalla completa (título + tarjeta con pasos o ítems + acciones)? → `HuemulScreenState` con un `ScreenStateConfig`. No escribir JSX nuevo por estado.
2. ¿Es un estado del contenido central del Asset? → agregarlo a `ContentState` y a `getContentState`; sus textos y acciones van en `buildContentStates`.
3. ¿Es un aviso de la versión (elaboración externa, otra versión, generando, corrida parcial)? → `VersionBanner`; el banner de dominio conserva su polling y handlers y solo renderiza a través de él.
4. ¿Es un estado del sheet de Fuentes? → `SourcesState` / `getSourcesState`.

## Reglas
- **Un solo origen de verdad.** El estado se deriva en `content-state.ts` (`getContentState`) y `sources/sources-state.ts` (`getSourcesState`). Prohibido volver a flags sueltos en el render.
- **Orden de prioridad** (contenido): `loading` → `error` → `restricted` → `generating` → (sin versión o sin contenido) `importFailed` / `runFailed` / `emptyWithSections` / `emptyNoSections` → `ready`. `noSelection` lo resuelve `AssetEmptyContent`, no `getContentState`.
- **Textos** en `assets:contentStates.*` (es + en). Botones en infinitivo; narrativa en «tú»; sin voseo; sin mencionar permisos ni detalles técnicos.
- **Permisos**: las acciones de `ScreenStateConfig` llevan `access` (`requiredAccess`, `resource`, `lifecyclePermissions`) y `HuemulButton` las oculta si no corresponde. Una acción `undefined` no se muestra.
- **Reintentos**: `onClick` devuelve la Promise (loading en el propio botón y sin doble click) o se pasa `loading`.
- **Sin layout shift**: el skeleton (`AssetContentSkeleton`) ocupa lo mismo que el contenido; sin spinner.
- **Acciones sin backend** (reintentar solo las secciones fallidas, «avisarme cuando termine», escribir al revisor): no se implementan ni se fingen. Pedirlas con `backend-change-request-guide.md`.

## Previsualizar en desarrollo (no hay Storybook)
Solo con `import.meta.env.DEV` (`hooks/useDevStateOverride.ts`):
- `/asset/<id>?state=<ContentState>` fuerza un estado del contenido (con secciones de ejemplo si no hay datos).
- `?sourcesState=<SourcesState>` fuerza un estado del sheet de Fuentes.
- `?banner=<externalLocked|externalFailed|otherVersion|generating|partialRun>` muestra un banner de ejemplo.

## Errores comunes
- Condicionar el montaje del contenido a flags en vez de usar `contentState`.
- Poner una variante nueva de `VersionBanner` sin tono en `VARIANT_TONE`.
- Usar `useSearchParams` en un hook que pueden montar tests sin Router (por eso `useDevStateOverride` lee `window.location`).
- Olvidar que `ready` exige `documentContent`: el árbol de providers solo se monta con datos.

## Checklist
- [ ] Estado agregado a la unión, a `getContentState` y a su test (`content-state.test.ts`).
- [ ] Textos en es + en; acciones con `access` si corresponde.
- [ ] Preview con `?state=` revisado a 900px y en mobile.
- [ ] `npx tsc -p tsconfig.app.json --noEmit`, eslint de lo tocado y `npm run test` en verde.
