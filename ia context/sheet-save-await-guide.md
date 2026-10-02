# Guía: sheet/dialog que guarda — no cerrar hasta que el backend confirme

## Cuándo aplica

Todo sheet/dialog de crear/editar que persiste al backend con un botón "Guardar".

Bug que originó la regla: `EditSectionDialog` hacía `onSave(data); onOpenChange(false)` síncrono con
`mutation.mutate`. El PUT seguía en vuelo, el sheet se cerraba, el usuario creía que estaba guardado y
minutos después llegaba un 502 (toast de error, cambios perdidos).

```
¿El botón guarda contra el backend?
├─ Sí → el sheet NO se cierra hasta que la mutación resuelve OK
│   ├─ El botón llama directo a una función async → saveAction.onClick devuelve la promesa
│   │   (HuemulSheet pone el spinner solo; ver sheet-footer-batch-save-guide.md)
│   └─ El botón dispara un <form> con requestSubmit() → el loading vive en el sheet (isSaving)
└─ No (solo estado local) → puede cerrar al instante
```

## Reglas

1. **El caller pasa la promesa**: `onSave={(data) => mutation.mutateAsync(data)}`. Nunca `mutate`
   si el sheet se cierra después.
2. **El sheet espera**: `await onSave(data)`; cierra solo después. Si rechaza → `catch` vacío, sheet
   abierto con lo editado (el toast de error lo da el `onError` de la mutación o el global de
   `src/lib/query-client.ts`; no duplicarlo).
3. **Loader en el botón**: `saveAction.loading = isSaving` y `disabled` mientras guarda.
4. **Bloquear el cierre mientras guarda**: ignorar `onOpenChange(false)` y cancelar si `isSaving`.
5. **Campos deshabilitados** (`isPending`) mientras guarda, para que no se editen datos que ya se enviaron.
6. Tipar `onSave` como `(data) => Promise<unknown> | void` para no romper callers sin red.
7. Marcar el estado "limpio" (`startClose()` / dirty-guard) solo después del éxito: si falla, el guard
   de cambios sin guardar sigue activo.

## Ejemplo del proyecto

`src/components/sections/sections-edit-sheet.tsx`:

```tsx
const handleSubmit = async (updatedItem: ItemForBackend) => {
  if (isSaving) return
  setIsSaving(true)
  try {
    await onSave(updatedItem)
    startClose()
    onOpenChange(false)
  } catch {
    // ya notificado; el sheet queda abierto con lo editado
  } finally {
    setIsSaving(false)
  }
}
```

Callers: `assets-sections-sheet.tsx`, `section-definition-sheet.tsx`, `templates-sections-list.tsx`,
`assets-template-sheet.tsx`. Test: `src/components/sections/sections-edit-sheet.test.tsx`.

## Errores comunes

- `onSave(x); onOpenChange(false)` síncrono.
- `mutate` en vez de `mutateAsync` en el caller (la promesa no llega al sheet).
- `closeOnSuccess: true` (default) con `onClick` que no devuelve la promesa → cierra a los 500 ms.
- Toast de error propio en el `catch` del sheet además del global → doble toast.
- Dejar el botón Cancelar activo durante el guardado.

## Checklist final

- [ ] El PUT/POST corre y el sheet sigue abierto con loader en el botón.
- [ ] Con error del backend (502/offline) el sheet queda abierto con los datos editados y un solo toast.
- [ ] Con éxito se cierra y aparece el toast de éxito.
- [ ] Cancelar/cerrar/Escape no cierran mientras guarda.
- [ ] Test que cubre pendiente / rechaza / resuelve.
