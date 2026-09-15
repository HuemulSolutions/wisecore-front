# Wisecore — Guía para pantallas de listado + panel de detalle (maestro-detalle)

Aplica cuando una pantalla muestra una tabla paginada a la izquierda y, al hacer click en una fila, abre un panel de detalle a la derecha (con tabs). Referencia canónica: `src/pages/users.tsx` + `src/components/users/users-table.tsx` + `src/components/users/users-detail-panel.tsx`.

Leer también `ia context/huemul-page-layout-guide.md` (layout) y `ia context/rbac-permissions-guide.md` (gating de acciones).

---

## 1. Layout de página (`HuemulPageLayout`, patrón B)

```tsx
<HuemulPageLayout
  header={<PageHeader ... />}
  headerClassName="p-4 md:p-6 pb-0 md:pb-0"
  columns={[
    {
      content: isError ? <ErrorState /> : <EntityTable ... />,
      className: "flex flex-col",   // ← sin padding, tabla a borde completo
      minSize: 45,
    },
    {
      content: selectedEntity ? <EntityDetailPanel ... /> : null,
      show: !!selectedEntityId,
      defaultSize: 32,
      minSize: 24,
      maxSize: 45,
      className: "border-l border-border",
    },
  ]}
/>
```

**Por qué `className: "flex flex-col"` y no padding:** `HuemulTable` (variant `"detailed"`) es internamente `flex flex-1 min-h-0 flex-col` — necesita que su contenedor directo sea un flex context para que el `flex-1` la estire hasta el fondo del panel. Envolver el contenido solo en padding (sin `flex flex-col`) hace que la tabla quede con su altura natural y deje un espacio en blanco debajo de la paginación.

Selección/paginación/estado de carga siguen el mismo patrón en ambas páginas: `useTableLoadingState` para `showPageLoader`/`isTableLoading`/`isTableFetching`, y la prop `pagination` de `HuemulTable`.

El rol/entidad seleccionada vive en la URL (`?entity=<id>&tab=<tab>`), no en `useState` — así el panel es linkeable y sobrevive al refresh (ver `navigateToUser`/`navigateToRole` en `users.tsx`/`roles.tsx`).

---

## 2. Tabla (`HuemulTable` variant `"detailed"`)

- La última columna es un **chevron de solo lectura** (no un menú de acciones):
  ```tsx
  {
    key: "chevron",
    label: "",
    align: "right",
    width: "40px",
    render: () => <ChevronRight className="ml-auto size-[15px] text-[#b6c0cd]" />
  }
  ```
- El click en la fila abre el panel: `onRowClick={(item) => onSelectItem(item)}`, `activeKey={selectedId ?? null}`.
- **No pasar `actions` a `HuemulTable`** en esta variante — no hay menú de 3 puntos por fila.
- Columnas intermedias pueden tener sub-elementos clickeables (badges, botones) que abren el panel en un tab específico, con `e.stopPropagation()` para no disparar también el `onRowClick` de la fila (ver columna "roles"/"users" en `users-table.tsx`/`roles-table.tsx`).

---

## 3. Edición de la entidad: inline en el tab, no en un sheet aparte

**Regla:** los campos de la entidad se editan **directamente en su tab** (ej. tab "Detalles"/"Perfil"), con `HuemulPanelSaveBar` (ver `ia context/sheet-footer-batch-save-guide.md`, variante "sheet sin footer") apareciendo sola cuando el form queda dirty. No se abre un sheet de edición sobre el panel — dos overlays para la misma entidad es el patrón viejo (`EditRoleSheet`/`EditUserSheet` originales, ya migrados). El form vive en un hook `use<X>Form` instanciado en la **página**, no dentro del panel, para que el estado sucio sobreviva a un cambio de tab — ver `useRoleDetailsForm`/`useUserProfileForm`.

```tsx
<HuemulPanelSaveBar
  isDirty={form.isDirty}
  canSave={form.canSave}   // no confiar en el default (= isDirty): sin esto se puede
                            // guardar con campos requeridos vacíos
  isSaving={form.isSaving}
  saveLabel={t("detail.saveChanges")}
  discardLabel={t("detail.discardChanges")}
  onSave={() => void form.save()}
  onDiscard={() => form.discard()}
/>
```

Reglas del form (mismo contrato que la guía de batch-save):
- Hidratación **gateada por `isDirty`** (`if (!entity || isDirty) return`): la entidad puede refrescarse por invalidación de otro tab (ej. guardar Roles/Permisos) mientras se edita este.
- `canSave` = `isDirty && sin errores de validación` — nunca dejar que el default del componente (`= isDirty`) sea el único gate si hay campos requeridos.
- El guard de descarte de navegación (cambiar de tab / cerrar panel / cambiar de fila) debe incluir `form.isDirty`, junto a los demás stagings del panel.

**Regla:** las acciones sobre la entidad completa que sí mutan al instante (eliminar, clonar) van como botones en el **footer del panel de detalle**, nunca en un menú de 3 puntos por fila de la tabla.

**Excepción documentada:** `HuemulMediaGallery` (`src/huemul/components/huemul-media-gallery.tsx`, usada en `media.tsx`) es una galería custom, no `HuemulTable` — no tiene panel de detalle "de tabla" con footer fijo por fila. Ahí "Eliminar" sí vive en el menú `MoreVertical` de cada card/fila, siempre visible (sin hover), por decisión explícita del usuario. No replicar este patrón en tablas `HuemulTable` sin la misma justificación.

```tsx
{canDelete && !showOtherSaveBar && (
  <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border p-4">
    <HuemulButton variant="ghost" size="sm" icon={Trash2}
      label={t("actions.deleteEntity")}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={onDeleteEntity} />
    {canClone && (
      <HuemulButton variant="outline" size="sm" icon={Copy}
        label={t("actions.cloneEntity")} onClick={onCloneEntity} />
    )}
  </div>
)}
```

- Acción destructiva a la **izquierda** (ghost, `text-destructive`), acción secundaria no destructiva (ej. clonar) a la **derecha** (outline).
- Este footer se gatea para no pisarse con las save-bars del panel (ej. la de perfil, la de asignación de roles/usuarios) — extraer esa condición como variable (`showXSaveBar`) y negarla en el gate del footer.

**Excepción — acción scoped a un tab específico:** si una acción ya vive naturalmente dentro de un tab (ej. "Gestionar Permisos" dentro del tab Permisos de `RoleDetailPanel`, que edita justo lo que ese tab muestra), se queda ahí — no se duplica en el footer general del panel.

---

## 4bis. Variante: panel como `HuemulSheet` (drawer) en vez de columna

Aplica cuando el panel de detalle debe abrir como overlay flotante (drawer) en vez de columna fija del layout — ver `users.tsx`/`roles.tsx` + `users-detail-panel.tsx`/`roles-detail-panel.tsx` (migrados desde el patrón de columna de la sección 1).

- **Layout de página:** `HuemulPageLayout` queda con una sola columna (la tabla, full width) — se elimina la segunda entrada de `columns`. El panel de detalle se renderiza como sibling del layout (junto a los demás Dialogs/Sheets), no dentro de `columns`.
- **El panel siempre está montado.** `open={!!selectedId}` controla la visibilidad; la entidad (`user`/`role`) pasa a ser `Entity | null`. No condicionar el render del componente entero a `entity ? <Panel/> : null` — si se desmonta el `<HuemulSheet>` junto con la entidad, la animación de cierre (`slide-out-to-right`) nunca corre, porque `open` y la entidad se vuelven `null`/falsy en el mismo render (ambos derivan de la URL).
- **Retener el último valor no nulo dentro del panel** para que el contenido no se vacíe a mitad de la animación de cierre:
  ```tsx
  const [displayUser, setDisplayUser] = useState<User | null>(user)
  useEffect(() => { if (user) setDisplayUser(user) }, [user])
  if (!displayUser) return null
  ```
  Todo el contenido (header, tabs, footer) lee `displayUser`, nunca `user` directamente.
- **`HuemulSheet` con `headerContent`/`footerContent`** (no primitivos crudos de `@/components/ui/sheet`): estos paneles ya traían header (avatar con imagen / ícono de color + nombre + subtítulo) y footer (varios bloques condicionales apilados: fila eliminar/clonar, banda de undo, `HuemulPanelSaveBar` según tab) construidos a medida — no encajan en el contrato genérico de `HuemulSheet` (`title: string` + `icon: LucideIcon` para el header; un solo `saveAction` para el footer). `headerContent`/`footerContent` (props de escape en `HuemulSheetProps`, ver `src/types/huemul/sheet.ts`) reemplazan esos bloques por contenido a medida sin perder el resto de `HuemulSheet` (tamaño, apertura/cierre, X nativa, scroll del body):
  ```tsx
  <HuemulSheet
    open={open}
    onOpenChange={(next) => { if (!next) handleClose() }}
    title={`${displayUser.name} ${displayUser.last_name}`}   // sr-only si headerContent está presente — Radix exige un Dialog.Title
    size="md"
    bodyClassName="flex flex-col overflow-hidden p-0"
    headerContent={<div className="... pr-10">{/* avatar, nombre, email */}</div>}
    footerContent={<>{/* fila eliminar/clonar, banda de undo, HuemulPanelSaveBar */}</>}
  >
    <Tabs>...</Tabs>
  </HuemulSheet>
  ```
  - `headerContent` reemplaza `icon`/`eyebrow`/`description`; agregar `pr-10`/`pr-6` al contenedor para no chocar con la X nativa de `SheetContent` (arriba a la derecha).
  - `footerContent` reemplaza `showCancelButton`/`saveAction`/`extraActions`/`footerLeft` — sin el wrapper sticky/borde/padding por defecto, el contenido controla su propio layout (igual que antes, en la columna).
  - No usar ambas props junto con sus contrapartes por defecto — son mutuamente excluyentes.
- **`onOpenChange={(next) => { if (!next) handleClose() }}`**: unifica ESC, click en el overlay y la X nativa con el mismo guard de descarte (`attemptNavigate`) que ya protegía el botón de cerrar manual — se elimina el botón `X` a medida del header, ya no hace falta.
- El guard de descarte (`HuemulAlertDialog`), `onRegisterGuard`/`guardRef` (cambio de fila), staging y forms de cada tab **no cambian** — la migración es solo del contenedor visual.

## 4. Checklist

```
[ ] 1. Columna de tabla: className "flex flex-col", sin padding.
[ ] 2. Última columna de la tabla: chevron de solo lectura, sin prop `actions`.
[ ] 3. onRowClick abre el panel; sub-elementos clickeables usan stopPropagation.
[ ] 4. Campos de la entidad editables inline en su tab (`use<X>Form` a nivel página) + `HuemulPanelSaveBar` con `canSave` propio, no un sheet aparte.
[ ] 5. Acciones sobre la entidad completa (eliminar, clonar) → footer del panel de detalle, gateado contra las save-bars.
[ ] 6. Selección de entidad vía URL (searchParams), no useState.
[ ] 7. Verificar visualmente: la tabla llena el alto disponible sin espacio en blanco bajo la paginación.
```
