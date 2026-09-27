# Guía: guardado batch delegado al footer del sheet

## Cuándo aplica

Usar este patrón cuando un `HuemulSheet` hospeda contenido editable que **no** debe guardarse
control por control, y el botón de guardar vive en el footer del sheet (no dentro del contenido).

```
¿El contenido editable está dentro de un HuemulSheet?
├─ No → no aplica (usa el formulario/hook propio de la página)
└─ Sí
   ├─ ¿Cada cambio debe persistirse al instante? → NO aplica (mutación directa por control)
   └─ ¿Los cambios se acumulan y se confirman con un botón?
      ├─ El contenido es un formulario plano → usa un hook `use<X>Form` (ver
      │  `useAssetTypeGeneralForm` en `src/components/assets-types/assets-types-general-form.tsx`)
      └─ El contenido es dinámico (varias tarjetas, sub-paneles, tabs internos, se remonta
         al cambiar de selección) → **este patrón**
```

Caso de referencia: la pestaña «Permisos por rol» del sheet de configuración de tipos de activo
(`assets-types-config-sheet.tsx` → `assets-types-lifecycle-dialog.tsx` →
`assets-types-lifecycle-step-sheet.tsx` → `assets-types-lifecycle-step-draft.ts`).

---

## Contrato

Tres tipos en `src/types/<módulo>/…`:

```ts
/** Lo que expone el contenido editable hacia arriba. */
export interface LifecycleEditorApi {
  save: () => Promise<void>
  isDirty: boolean
  /** Descarta los cambios locales. No recompone el estado a mano — ver regla 3. */
  discard: () => void
}

/** Lo que el contenedor intermedio publica en el ref del sheet. */
export interface LifecycleSaveApi extends LifecycleEditorApi {
  isSaving: boolean
}

export type LifecycleSaveApiRef = MutableRefObject<LifecycleSaveApi | null>
```

Tres niveles:

| Nivel | Responsabilidad |
|---|---|
| Contenido editable (hoja) | Mantiene el estado local, marca lo sucio y expone `{ save, isDirty }` con `onRegisterEditor` |
| Contenedor intermedio | Recoge la API del hijo activo, envuelve `save` con `isSaving` y la publica en `saveApiRef` |
| Sheet | Renderiza `saveAction` + `footerLeft` leyendo el estado; nunca conoce el estado interno |

---

## Reglas

1. **El closure de guardado vive en un ref**, reasignado en cada render. Así el footer siempre
   invoca la última versión sin re-registrar la API en cada tecleo:

   ```tsx
   const isDirty = dirtyIds.size > 0 || orderDirty
   const saveRef = useRef<() => Promise<void>>(async () => {})

   saveRef.current = async () => {
     if (!canManage || !isDirty) return
     for (const id of idsToSave) { await updateStep.mutateAsync({ /* … */ }) }
     setDirtyIds(new Set())
     toast.success(t("lifecycle.savedSuccess"))
   }

   const save = useCallback(() => saveRef.current(), [])   // identidad estable

   useEffect(() => { onRegisterEditor?.({ isDirty, save }) }, [isDirty, save, onRegisterEditor])
   useEffect(() => () => onRegisterEditor?.(null), [onRegisterEditor])
   ```

2. **`onRegisterEditor` debe ser estable** en el padre (`useCallback` con deps vacías), o el
   efecto se re-dispara en bucle.

3. **Hidratar desde el servidor solo cuando el editor está limpio.** El efecto de sincronización
   no se corre «una sola vez»: se corre en cada llegada de datos, gateado por el estado sucio.

   ```tsx
   const serverSteps = data?.data?.steps
   // `editingId !== null` también bloquea: una tarjeta recién abierta con el lápiz todavía no
   // está sucia, y verla cambiar debajo del cursor es peor que quedar un instante desincronizado.
   const hydrationBlocked = dirtyIds.size > 0 || orderDirty || editingId !== null

   useEffect(() => {
     if (!serverSteps || hydrationBlocked) return
     setLocalSteps(serverSteps.map(stepToCard))
   }, [serverSteps, hydrationBlocked])
   ```

   Por qué no alcanza con un `initializedRef` / `hydratedIdRef` que hidrata una vez y descarta todo
   refetch: cuando **otra superficie escribe las mismas entidades** (la matriz de permisos por rol,
   ver regla 7), el editor se queda con datos viejos y al guardar los reenvía, pisando lo recién
   cambiado. El guard por sucio da las dos garantías a la vez — un refetch nunca pisa una edición en
   curso, y un editor limpio siempre refleja el backend.

   Corolario: `discard()` (ver contrato) no recompone el estado a mano; limpia los flags de sucio y
   la rehidratación repuebla desde la cache.

4. **El botón del footer devuelve la promesa**: `onClick: () => saveApiRef.current?.save()`.
   `HuemulSheet` detecta la promesa y muestra el spinner solo; con `closeOnSuccess: false` el
   sheet no se cierra al guardar.

5. **`footerLeft` para el estado**, no un toast ni un badge dentro del contenido:
   `t("…unsavedInStage", { stage })` con `text-[12px]`.

6. **El guard de descarte lee `isDirty`**, no un flag propio de «modo edición». Cambiar de
   selección, de tab o cerrar el sheet pasa por `guardedAction` + `HuemulAlertDialog`.

7. **Cerrar el camino de escritura paralelo.** Si otra superficie (una matriz, una tabla) muta
   las mismas entidades con mutaciones inmediatas, hay que inhabilitarla mientras el panel tenga
   cambios pendientes; si no, un click ahí queda pisado al guardar. Ver `lockedStageType` en
   `assets-types-lifecycle-matrix.tsx`.

8. **Reordenar obliga a reenviar todo** el conjunto cuando el backend guarda `order` posicional:
   marcar un flag `orderDirty` aparte del set de ids sucios.

9. **Los campos con semántica de reemplazo total se envían siempre, incluso vacíos.** Si el PATCH
   interpreta `role_ids` como «esta es la lista completa», omitirlo cuando la UI decide «sin roles»
   deja filas huérfanas en el backend que otras superficies siguen pintando. Enviar `[]` explícito.

---

## Variante: sheet sin footer (`PanelSaveBar` dentro del contenido)

Cuando el sheet (o un tab puntual dentro de un sheet con tabs) se monta sin footer, el guardado
baja al contenido con `PanelSaveBar` (`src/components/assets-types/assets-types-lifecycle-ui.tsx`)
— forma canónica de esta variante, con «Descartar»/«Cancelar» siempre visible (antes solo aparecía
dentro del `HuemulAlertDialog` al intentar salir).

**`AssetTypeConfigSheet` es un caso híbrido**, no una aplicación pura de esta variante: el footer
real del `HuemulSheet` (`showFooter`, `saveAction`, `footerLeft`, `cancelLabel`) se arma en
`assets-types-config-sheet.tsx` según `activeTab` — «General» y «Plantillas» lo usan (el tab
Plantillas dispara `save()`/`discard()` vía `templatesSaveApiRef`, igual que hace un sheet con
footer fijo); solo «Permisos por rol» sigue **sin** footer, con su `PanelSaveBar` propia en el pie
de `LifecycleStepPanel`. No asumir que un sheet con tabs tiene un único régimen de guardado: cada
tab puede pertenecer a un patrón distinto, y quien arma las props del footer es el sheet contenedor
(`activeTab` ya vive ahí), no cada tab por su cuenta.

Qué cambia respecto del patrón base:

| Pieza | Con footer | Sin footer |
|---|---|---|
| Botón «Guardar cambios» + descarte | `saveAction` + `cancelLabel` del `HuemulSheet` | `PanelSaveBar` dentro del contenido, con `onSave`/`onDiscard` propios |
| Texto de cambios pendientes | `footerLeft` | `dirtyLabel` de `PanelSaveBar` (solo si `isDirty`) + `hintLabel` opcional siempre visible |
| `saveApiRef` | `save()` + `discard()` | Igual: el contenedor sigue publicando `{ save, discard, isDirty, isSaving }`; `PanelSaveBar` los consume directo, sin pasar por el ref |
| Cierre del sheet | botón «Cerrar» del footer | X nativa de `SheetContent`, que igual pasa por `onOpenChange` → guard |

`PanelSaveBar` acepta `canSave` (por defecto `isDirty`) para gatear el botón con una validación
adicional sin tocar el badge de estado — útil cuando hace falta algo más que "hay cambios" (ej. un
campo requerido). El mismo gate, cuando el guardado vive en el `saveAction` del footer real (como
en el tab General de `AssetTypeConfigSheet`), va directo en `saveAction.disabled` — ver
`form.canSubmit` en `assets-types-general-form.tsx`, consumido desde
`assets-types-config-sheet.tsx`.

Reglas propias de la variante:

1. **Un solo sitio de render por bloque editable.** Si el contenido alterna vistas (lista ↔ detalle),
   la `PanelSaveBar` va **fuera** del condicional, no duplicada en cada rama.
2. **Ubicarla donde vive el estado sucio.** Para el panel de etapa del ciclo de vida es el pie de
   `LifecycleStepPanel`: ese panel existe solo mientras hay una etapa abierta, que es exactamente
   cuando `isDirty` puede ser `true`.
3. **Un panel compartido entre un contenedor con footer y otro sin footer debe gatear su
   `PanelSaveBar` por prop.** `AssetTypeLifecyclePanel` recibe `showSaveButton` (default `false`)
   porque el `AssetTypeLifecycleDialog` standalone conserva su footer real; sin el gate saldrían
   dos guardados.
4. **No tocar los componentes de campos compartidos.** Si el guardado de un formulario compartido
   vive en el footer del sheet contenedor (no dentro del componente de campos), ese componente no
   se entera de si está en un sheet con footer o sin él — ver `AssetTypeGeneralFormFields`, que
   usa tanto el tab General de `AssetTypeConfigSheet` (footer real) como el sheet de creación
   (también footer real, pero sin tabs).
5. El guard de descarte (`guardedAction` + `HuemulAlertDialog` + `discard()`) se mantiene **igual**
   sin importar si el guardado vive en el footer del sheet o en una `PanelSaveBar` inline: ambos son
   vías para *guardar*, no reemplazan el guard que protege *cambiar de tab* o *cerrar* con cambios
   pendientes.

---

## Errores comunes

- Registrar la API con un `save` recreado en cada render → efecto en bucle o guardado con estado viejo.
- Efecto de hidratación sin ningún guard (`[data]` a secas) → los cambios del usuario desaparecen
  al primer refetch (por ejemplo, al invalidar por una mutación de otra parte de la pantalla).
- Guard con un `initializedRef` / `hydratedIdRef` que descarta **todos** los refetch → el editor
  queda desincronizado de lo que escriben otras superficies y al guardar las pisa (regla 3).
- Mantener botones Guardar/Cancelar dentro del contenido **además** del footer: dos fuentes de
  verdad. Uno u otro, nunca los dos (ver la variante sin footer más arriba).
- Olvidar `onRegisterEditor?.(null)` en el cleanup → el footer sigue habilitado con la API de un
  contenido ya desmontado.
- Poner `disabled: !isDirty` pero no `closeOnSuccess: false` → el sheet se cierra al guardar.

---

## Checklist final

- [ ] Tipos `…EditorApi` / `…SaveApi` / `…SaveApiRef` en `src/types/`
- [ ] El contenido expone `{ save, isDirty, discard }` y limpia el registro al desmontar
- [ ] `save` estable (`useCallback` + ref para el closure)
- [ ] Hidratación gateada por el estado sucio (no por un ref de «ya inicialicé»)
- [ ] `saveAction` en el footer con `closeOnSuccess: false` y `disabled: !isDirty`
- [ ] `footerLeft` con el texto de cambios pendientes (traducido)
- [ ] `guardedAction` conectado a `isDirty` en cambio de selección, cambio de tab y cierre
- [ ] El editor expone `discard()` y el contenedor lo llama antes de ejecutar la acción descartada
- [ ] Caminos de escritura paralelos inhabilitados mientras haya cambios pendientes
- [ ] Campos con semántica de reemplazo total (`role_ids`, `access_rules`) se envían siempre, `[]` si no aplican
- [ ] Toast de éxito una sola vez, al final del batch
