# Wisecore — Guide for Danger Zone inside a Sheet (edit + delete unified)

## When this applies

A `HuemulSheet` edits/shows the detail of an entity, and that same entity can also be **deleted**. Instead of a separate confirmation `Dialog`/`AlertDialog` triggered from a dropdown menu action, both actions live in **one Sheet**: the form/detail on top, a "Danger Zone" section at the bottom with the destructive action.

Use this pattern when:
- [ ] The dropdown/table row today opens two different surfaces for the same item ("Edit" sheet + "Delete" dialog).
- [ ] The item being edited and the item being deleted are the same entity (not a nested child — see the version-delete case in `HuemulMediaDetailSheet` for a nested variant that keeps its own `HuemulAlertDialog`).

Do **not** apply this pattern to a bare create-only form (no entity to delete yet) — the danger zone only renders when editing an existing item.

## Reference implementations

- [`custom-fields-create-edit-sheet.tsx`](../src/components/custom-fields/custom-fields-create-edit-sheet.tsx) — edit/create sheet, danger zone gated by `isEditing`, rendered in the **footer variant** (see below).
- [`huemul-media-detail-sheet.tsx`](../src/huemul/components/huemul-media-detail-sheet.tsx) — original precedent, also gates the zone with a `canDelete` prop (permissions), **body variant**.

## Two variants

There are two valid placements for the danger zone — pick based on whether the form is long enough that a body-placed danger zone would scroll out of sight along with other content the user wants to keep visible (e.g. a live preview):

### Body variant (default)

Inside the Sheet's `children`, after the form/detail content — same scroll column as the rest of the form.

### Footer variant

Pass the destructive `Button` via `HuemulSheet`'s `footerLeft` prop instead of putting it in `children`. It renders pinned to the sheet's sticky footer, isolated on the left, separate from Cancel/Save on the right:

```tsx
<HuemulSheet
  ...
  footerLeft={isEditing ? (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer"
      onClick={() => setDeleteOpen(true)}
    >
      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
      {t('actions.deleteX')}
    </Button>
  ) : undefined}
>
  {/* form content only — no danger zone block here */}
</HuemulSheet>
```

`footerLeft` is a generic optional prop on `HuemulSheet` — omit it and the sheet behaves exactly as before.

## Structure (body variant)

Inside the Sheet's `children`, after the form/detail content:

```tsx
{isEditing && (
  <>
    <Separator />
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer"
      onClick={() => setDeleteOpen(true)}
    >
      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
      {t('actions.deleteX')}
    </Button>
  </>
)}
```

Confirmation lives in a `HuemulAlertDialog` rendered as a **sibling** of `HuemulSheet` (same component, wrapped in a fragment), not nested inside it:

```tsx
return (
  <>
    <HuemulSheet ...>
      {/* form + danger zone above */}
    </HuemulSheet>

    {isEditing && (
      <HuemulAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('deleteDialog.title')}
        description={t('deleteDialog.description')}
        actionLabel={t('actions.deleteX')}
        actionIcon={Trash2}
        onAction={async () => {
          await mutations.delete.mutateAsync(item!.id)
          onOpenChange(false) // closes the parent Sheet too
        }}
      />
    )}
  </>
)
```

## Rules

- The trigger button is text-only: `variant="ghost"` + `text-destructive hover:text-destructive hover:bg-destructive/10`. No solid fill and no uppercase caption label above it — a filled `variant="destructive"` button reserved for the real confirmation lives in the `HuemulAlertDialog`'s action button, never on the sheet's trigger. This keeps the footer visually light and the destructive color reserved for the one button that actually commits the action.
- Keep the action label short (one or two words, e.g. `t('actions.deleteX')` → "Eliminar") — the sheet's own title/eyebrow already identifies the entity, so the button doesn't need to repeat it, and a short label never truncates next to the primary Save button.
- Gate the whole danger zone block on the "editing an existing item" condition (`isEditing`, `!!item`) — never show it in create mode.
- If the mutation's `meta.successMessage` already drives a global toast (check the `use<Module>Mutations` hook), do **not** add a manual `toast.success` in `onAction` — that would double the toast. Only add one when the hook doesn't already toast (see `HuemulMediaDetailSheet`, which does call `toast.success` because its mutations don't carry `meta.successMessage`).
- On successful delete, call `onOpenChange(false)` on the parent Sheet so it closes along with the confirmation dialog.
- Reuse the same action label between the danger-zone button and the `HuemulAlertDialog`'s `actionLabel` (e.g. `t('actions.deleteX')`) instead of duplicating a new i18n key.
- Once the danger zone lands in a Sheet, remove the now-redundant "Delete" entry from the row's dropdown menu (`HuemulTableAction[]`) — one entry point only ("Edit" opens the unified Sheet).

## Entidad en uso: error inline + confirmación forzada

Cuando el backend rechaza el borrado con `400` porque la entidad está en uso (ej. un custom field referenciado por templates/documentos), no abras un segundo dialog — escala el mismo `HuemulAlertDialog` con un bloque de error inline y pide una confirmación reforzada. Referencia: [`custom-fields-create-edit-sheet.tsx`](../src/components/custom-fields/custom-fields-create-edit-sheet.tsx).

Piezas del patrón:

1. **`parse<Entity>UsageError(error)`** en el service — detecta el `400` y parsea el `detail` (`{ templates, documents }` o equivalente) devuelto por el backend. Ver `src/services/custom-fields.ts`.
2. **Flag `force`** en la función de borrado del service y en las variables de la mutation (`mutateAsync({ id, force })`).
3. **Early-return en `onError`** del hook de mutación (`use<Entity>Mutations`) cuando `parse<Entity>UsageError(error)` detecta uso — evita el toast rojo genérico mientras la UI resuelve el error en el dialog.
4. **Estado `usage`** en el componente (`useState<EntityUsage | null>(null)`), reseteado a `null` cuando el dialog se cierra.
5. **Prop `alert`** de `HuemulAlertDialog` (`{ title, description }`) para el bloque rojo — la `description` base del dialog **no se reemplaza**, el bloque se agrega arriba:

```tsx
<HuemulAlertDialog
  title={t('deleteDialog.title')}
  description={t('deleteDialog.description')}
  alert={usage ? {
    title: t('deleteDialog.inUseAlertTitle'),
    description: t('deleteDialog.inUseAlertDescription', { usage: buildUsageText(usage) }),
  } : undefined}
  actionLabel={usage ? t('deleteDialog.forceConfirm') : t('actions.deleteX')}
  onAction={async () => {
    try {
      await mutations.delete.mutateAsync({ id: item!.id, force: Boolean(usage) })
    } catch (error) {
      const detectedUsage = parseEntityUsageError(error)
      if (detectedUsage && !usage) setUsage(detectedUsage)
      throw error // mantiene el dialog abierto en vez de cerrarlo
    }
    onOpenChange(false)
  }}
/>
```

6. **`throw error`** dentro de `onAction` en el primer intento: `HuemulAlertDialog` vuelve a `idle` sin cerrarse (ver `handleAction` en `huemul-alert-dialog.tsx`), así el segundo click ya usa `force: true`.

## Common mistakes

- Nesting the `HuemulAlertDialog` inside `HuemulSheet`'s `children` — keep it as a sibling so it isn't unmounted by the Sheet's own conditional rendering and so its own overlay stacks correctly above the Sheet.
- Forgetting to delete the now-orphaned standalone delete dialog component, its type (`Delete<Entity>DialogProps`), and the page state slot (`deleting<Entity>`) that fed it.
- Leaving the dropdown's "Delete" action in place after the danger zone exists — results in two divergent delete flows.

## Final checklist

```
[ ] Danger zone gated by isEditing / !!item
[ ] Variant chosen: body (in children, with Separator) or footer (via HuemulSheet's footerLeft prop)
[ ] Trigger is variant="ghost" + text-destructive hover:bg-destructive/10, no caption label, short label text
[ ] HuemulAlertDialog as a Sheet sibling, not nested in children
[ ] onAction awaits the delete mutation, then calls onOpenChange(false)
[ ] No duplicate toast if the mutation hook already has meta.successMessage
[ ] Dropdown menu's separate "Delete" action removed
[ ] Old standalone delete dialog file, its Props type, and page state slot deleted
[ ] All strings via useTranslation — no hardcoded text
```
