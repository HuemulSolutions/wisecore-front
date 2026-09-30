# Wisecore — Guía de apertura instantánea de sheets/dialogs con skeleton

Todo sheet, dialog o panel lateral que necesite datos del backend se abre **en el mismo instante** del click (o de la navegación por URL) y muestra un skeleton en el cuerpo hasta que llegan los datos. Nunca se hace esperar al usuario frente a una pantalla sin cambios. Read `refresh-button-guide.md` (botón de refresh en sheets que listan datos) y `tooltip-guide.md` (motivo visible de un botón bloqueado) for related conventions.

## 0. Árbol de decisión

```
¿El cuerpo del sheet/dialog depende de un GET al backend?
├─ NO (datos ya en props/fila)         → abrir ya, sin skeleton
└─ SÍ
    ├─ ¿Se abre con un click?           → open=true en el click; bodyLoading mientras isLoading (§1)
    ├─ ¿Se abre por URL (deep-link) y
    │  la entidad puede no estar aún?   → abrir con skeleton; NO `return null` (§3)
    ├─ ¿La query es conocida antes del
    │  click (botón con id fijo)?       → además, prefetch al hover/foco (§5)
    └─ ¿Es un formulario que inicializa
       su estado desde la entidad?      → skeleton hasta tener la entidad y montar el form
                                          recién entonces (§4)
```

## 1. La regla: abrir ya, `bodyLoading` mientras carga

`HuemulSheet` y `HuemulDialog` traen el mecanismo. `bodyLoading` reemplaza `children` por un skeleton, deshabilita `saveAction` y `extraActions` (Cancelar sigue activo) y marca el cuerpo con `aria-busy`.

```tsx
const { data, isLoading } = useQuery({ ..., enabled: open })

<HuemulSheet
  open={open}
  onOpenChange={onOpenChange}
  title={t('edit.title')}
  bodyLoading={isLoading}          // skeleton + acciones deshabilitadas
  saveAction={{ label: t('save'), onClick: handleSave }}
>
  <MiForm data={data} />
</HuemulSheet>
```

- Usar `isLoading` (primera carga), **no** `isFetching`: un refetch en segundo plano no debe volver a tapar el contenido con skeleton.
- Skeleton propio (mismo layout que el contenido real): prop `bodySkeleton={<MiSkeleton />}`. Por defecto son 6 filas genéricas.
- Si el header o el footer tienen acciones que dependen de los datos (`headerExtra`, `footerContent`), condicionarlas a `!isLoading` — `bodyLoading` solo bloquea `saveAction`/`extraActions`.

## 2. Prohibido

```tsx
// ❌ el sheet no existe hasta que hay datos: el click "no hace nada"
{data && <HuemulSheet open={open} ... />}
if (!data) return null
<HuemulSheet open={open && !!data} ... />

// ❌ abrir después de esperar un fetch
const handleClick = async () => { const d = await getX(); setOpen(true) }

// ❌ spinner suelto, texto "Cargando…" o un estado vacío falso mientras carga
{isLoading ? <Loader2 className="animate-spin" /> : ...}
{!data?.items.length && <EmptyState />}   // se ve "no hay items" durante la carga
```

## 3. Deep-link: entidad que aún no llegó

Los paneles de detalle abiertos por URL (`?selectedUser=…`) pueden apuntar a una entidad que no está en la página actual de la tabla. Ejemplo real (`users-detail-panel.tsx`, `roles-detail-panel.tsx`, `organization-detail-panel.tsx`): todos los hooks van antes; cuando falta la entidad se devuelve un sheet en skeleton, no `null`.

```tsx
if (!displayUser) {
  if (!open) return null
  return (
    <HuemulSheet open onOpenChange={(next) => { if (!next) handleClose() }}
      title={t("common:loading")} size="lg" bodyLoading showFooter={false}>
      {null}
    </HuemulSheet>
  )
}
```

Un id inexistente deja el skeleton hasta que el usuario cierra (X / Escape); nunca dejar una pantalla en blanco.

## 4. Formularios: montar con los datos, no rellenar después

Un form que inicializa `useState` desde la entidad al montar **debe montarse recién con la entidad** (skeleton mientras tanto). Prefill parcial + reemplazo posterior deja ver datos falsos y permite guardar valores por defecto encima de los reales (bug de `templates-edit-dialog.tsx`: `context_required: false` antes de cargar el detalle).

```tsx
// sections-edit-sheet.tsx / section-definition-sheet.tsx
<EditSectionDialog
  loading={!item}                                    // → HuemulSheet bodyLoading
  item={item ?? placeholder}                         // el form no se monta hasta !loading
  ...
/>
```

## 5. Prefetch al acercar el cursor

Si el disparador conoce la query, precalentarla en `onPointerEnter`/`onFocus`. Definir la query **una sola vez** con `queryOptions` en un archivo aparte (react-refresh no permite exportar helpers desde un archivo de componente) y usarla en el `useQuery` y en el prefetch.

```tsx
// section-definition-query.ts
export function sectionsConfigQueryOptions(documentId, orgId, executionId?) {
  return queryOptions({ queryKey: [...], queryFn: ..., staleTime: 30000 })
}
// disparador
<SectionBarButton onPrefetch={() => void queryClient.prefetchQuery(sectionsConfigQueryOptions(...))} />
```

Con `staleTime` > 0 el click posterior encuentra la caché y el skeleton casi no se ve. En móvil (sin hover): prefetch al abrir el menú que contiene la acción.

## 6. Error de carga

Si la query falla, cerrar el sheet y avisar (`handleApiError`); nunca dejar el skeleton para siempre.

```tsx
useEffect(() => {
  if (open && loadError) { handleApiError(loadError); onOpenChange(false) }
}, [open, loadError, onOpenChange])
```

**Excepción — error en el propio panel:** cuando el diseño pide un bloque de error con "Reintentar" (panel de Fuentes, `assets/content/sources/sources-states.tsx`), el sheet se queda abierto, `bodyLoading` pasa a `false` y el cuerpo muestra ese bloque. Sigue valiendo lo de fondo: nunca un skeleton eterno ni un estado vacío falso; el error se distingue del vacío con `isError` (sin datos) y el botón hace `refetch()`.

## 7. Animación de cierre

`if (!open) return null` corta la animación de salida del sheet. Aceptable solo si no hay estado interno que resetear (`section-definition-sheet.tsx`, `assets-types-lifecycle-step-sheet.tsx`); preferir dejar el sheet montado con `open={false}`.

## Deuda conocida (migrar oportunistamente al tocar el archivo)

Superficies que abren al instante pero muestran spinner suelto, texto o estado falso en vez de skeleton:
`execution-info-sheet.tsx` (spinner + texto en inglés hardcodeado), `assets-types-config-content.tsx`, `assets-types-create.tsx`, `assets-edit-dialog.tsx` y `workflow-asset-edit-sheet.tsx` (prefill por `useEffect`), `tokens-sheet.tsx`, `execution-config-dialog.tsx` y `lifecycle-review-sheet.tsx` (spinner de campo), y `animate-pulse` a mano en `assets-version-management-sheet.tsx`, `relationship-attributes-dialog.tsx`, `assets-discussions-sheet.tsx`.

## Errores comunes

- ❌ Condicionar `open` o el montaje del sheet a que existan datos (§2).
- ❌ Usar `isFetching` para `bodyLoading`: el skeleton reaparece en cada refetch (§1).
- ❌ Pasar `bodyLoading` pero dejar visible un botón del header que actúa sobre datos aún no cargados (§1).
- ❌ Prefill desde props + reemplazo cuando llega el detalle: se puede guardar antes de que llegue (§4).
- ❌ Definir la key/fn de la query en dos lugares (hook y prefetch): el prefetch no calienta la caché real (§5).
- ❌ Skeleton eterno tras un error (§6).
- ❌ Texto de `title` del sheet en blanco mientras carga: usar `t("common:loading")`.

## Checklist final

```
[ ] El sheet/dialog se monta y abre en el click/navegación, sin esperar datos
[ ] Cuerpo con bodyLoading={isLoading} (o bodySkeleton propio), nunca spinner/texto suelto
[ ] Acciones de header/footer que dependen de los datos deshabilitadas u ocultas mientras carga
[ ] Formulario montado solo con la entidad cargada; no se puede guardar antes
[ ] Deep-link: skeleton en vez de return null
[ ] Prefetch al hover/foco si la query es conocida (query definida una sola vez con queryOptions)
[ ] Error de carga cierra el sheet y avisa
[ ] npx tsc -p tsconfig.app.json --noEmit y eslint pasan
```
