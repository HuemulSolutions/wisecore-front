# Wisecore — Elaboración externa del ciclo de vida

Referenciado desde `assets-content.tsx` (`isAssetLockedByExternalElaboration`), `useDocumentAccess.ts` (`computeFrontendPermissions`), `types/assets/sheets.ts` (`isExternalElaborationLocked` prop), `workflow-detail-panel.tsx` (`readOnlyReason`) y `external-elaboration-lock-banner.tsx` — todos apuntaban a este doc antes de que existiera.

## Cuándo aplica

Un sistema externo procesa los archivos cargados en un step de tipo `edit` del ciclo de vida (ej. extracción de datos de PDFs vía IA) y devuelve secciones de formulario con los datos extraídos. Reutiliza el mismo patrón ya validado de publish/review externos (`ExternalFunctionality` + config colgada del step + job), con un objetivo propio: `lifecycle_elaboration`.

Leer esta guía cuando la tarea sea:
- [ ] Configurar/editar la elaboración externa de un step (`edit`) desde el sheet de asset type.
- [ ] Agregar o modificar el disparo manual desde el documento.
- [ ] Tocar el bloqueo del activo mientras corre una elaboración (`is_locked_external_elaboration`).
- [ ] Diagnosticar por qué una elaboración no corrió, no terminó, o dejó el documento bloqueado.

No aplica a publish/review externos — esos tienen sus propias guías implícitas en `assets-types-lifecycle-review-actions.tsx` / `external-functionality-publish-actions-tab.tsx`, con forma 1:N (varias acciones por step, con orden). La elaboración es **1:1** (una sola config por step).

## Flujo completo

```
1. Config (admin)     → LifecycleElaborationConfig 1:1 sobre un step `edit`
2. Alta previa        → ExternalFunctionality con objective="lifecycle_elaboration"
3. Disparo            → manual (botón) o automático (al completar el step anterior)
4. Mientras corre     → is_locked_external_elaboration: true (bloqueo YA implementado)
5. Al terminar        → step se completa solo, secciones same/modify/delete/add, lock se libera
```

### 1-2. Configuración y alta de la funcionalidad

- Config 1:1 por step: `GET/POST/PUT/DELETE /lifecycle/steps/{step_id}/elaboration-config`. Servicios en [`lifecycle.ts`](../src/services/lifecycle.ts) (sección "Elaboration Config"), hooks `useLifecycleElaborationConfig` / `useLifecycleElaborationConfigMutations` en [`useLifecycle.ts`](../src/hooks/useLifecycle.ts).
- UI de admin: [`assets-types-lifecycle-elaboration-config.tsx`](../src/components/assets-types/assets-types-lifecycle-elaboration-config.tsx), montada en el tab Configuración del sheet de step ([`assets-types-lifecycle-step-config-tab.tsx`](../src/components/assets-types/assets-types-lifecycle-step-config-tab.tsx)) cuando `capabilities.hasElaborationConfig` (solo `type === "edit"`, sin depender de `mode`).
- Persiste **al instante** (PUT/POST/DELETE directos por control), no participa del batch-save del footer del sheet — mismo motivo que `LifecycleReviewActionsSection`: permisos propios (`lifecycle_elaboration_config:*`, distintos de `asset_type:u`) y un verbo que depende del estado del servidor. Ver `ia context/sheet-footer-batch-save-guide.md`.
- La `ExternalFunctionality` debe existir antes, con `objective: "lifecycle_elaboration"` colgada de un `ExternalSystem` activo — mismo flujo de alta que cualquier otro objetivo, ver `ia context/rbac-permissions-guide.md` para permisos de esa pantalla.
- **`new_section_template_section_id`** (molde de campos): una `TemplateSection` de tipo `form` cuyos `form_fields` el backend clona para armar las secciones que la elaboración crea con acción `add`, matcheando valores por `field_name`. Sin blueprint, `add` crea secciones sin campos y los datos se descartan en silencio. El selector se arma con [`useDocumentTypeFormSections`](../src/hooks/useDocumentTypeFormSections.ts) (documentTypeId → plantillas vinculadas → `getTemplateById` → secciones `type === "form"`), mismo recorrido que `useDocumentTypeDependencyFields`.
- PUT con tri-estado: omitir `new_section_template_section_id` = no tocar el blueprint actual; mandarlo `null` explícito = limpiarlo. El selector usa `emptyOptionLabel` de `HuemulField` para forzar el `null` explícito al "limpiar" (nunca confundir con "no tocar").

### 3. Disparo

- Manual: `POST /execution-lifecycle/{execution_id}/run-elaboration?lifecycle_step_id={step_id}` — el step va en el **query param**, no en el body. Servicio `runElaboration` en [`executions.ts`](../src/services/executions.ts), mutation `runElaborationMutation` en [`useLifecycleActions.ts`](../src/hooks/useLifecycleActions.ts), botón en [`huemul-lifecycle-actions.tsx`](../src/huemul/components/huemul-lifecycle-actions.tsx).
- `run: null, job: null` en la respuesta (200) = el step no tiene config o está deshabilitada — **no es error**, no corresponde toast de éxito ni de error. Por eso esta mutation no usa `meta.successMessage` estático: el toast de éxito se dispara a mano en `onSuccess` solo si `data.run` no es `null`.
- 409 `EXECUTION_LOCKED_EXTERNAL_ELABORATION` si ya hay una corriendo — mismo código que el bloqueo, ya mapeado a un toast en [`error-utils.ts`](../src/lib/error-utils.ts).
- Automático: se dispara solo al completar el step anterior al configurado, si ese step siguiente tiene la config habilitada — no requiere ninguna acción de la UI.
- Visibilidad del botón (`resolveLifecycleActionsVisibility` en [`lifecycle-access.ts`](../src/lib/lifecycle-access.ts)): `status.stage === "edit"` (no `state === "draft"` — son campos distintos), `permissions?.edit`, y `hasEnabledElaborationConfig` (resuelto con un GET client-side de la config del step actual, gateado por `canReadElaborationConfig` — ver "Deuda conocida" abajo). El **lock no entra en la visibilidad**: se resuelve como `disabled` + tooltip alternativo en el botón, para no saltar el layout cada vez que se dispara/termina una corrida.

### 4. Bloqueo mientras corre (ya implementado, no tocar sin motivo)

Toda la cadena ya existe end-to-end:

| Pieza | Dónde |
|---|---|
| Campo | `LifecycleStatus.is_locked_external_elaboration?: boolean` — [`types/assets/core.ts`](../src/types/assets/core.ts) |
| Helper | `isExternalElaborationLocked(status)` — nunca comparar por truthiness, el campo puede venir `undefined` — [`lifecycle-access.ts`](../src/lib/lifecycle-access.ts) |
| Poll | `EXTERNAL_ELABORATION_POLL_MS = 5000` mientras `isExternalElaborationLocked` es `true` — la query de `document-content` se re-consulta sola |
| Banner | [`external-elaboration-lock-banner.tsx`](../src/components/assets/content/external-elaboration-lock-banner.tsx), sticky, antes que cualquier otro banner |
| Permisos | `useDocumentAccess.ts` apaga solo escritura de contenido (`canEditSections`, `canExecuteAI`) mientras está bloqueado; no toca acceso a sheets ni acciones de lifecycle |
| Error | 409 `EXECUTION_LOCKED_EXTERNAL_ELABORATION` → toast dedicado en `error-utils.ts` (respaldo ante la carrera de un click justo antes de que el status refresque) |

### 5. Efectos al terminar — sin señal explícita en la UI

- **No existe flag de "auto-generado por IA"** en secciones ni en section executions. La única pista es el nombre por defecto de las secciones creadas por `add`: `"Datos extraidos (xxxxxx)"` (salvo que el sistema externo haya mandado un nombre propio).
- `add`/`delete` son cambios **estructurales** del documento (se agrega/quita una `Section` real) — se ven también en versiones futuras, no solo en la ejecución donde corrió la elaboración.
- El historial de sección (`GET /section_executions/{id}/history`) **solo** registra `modify` sobre secciones tipo `form`. Altas, bajas y modificaciones de secciones no-formulario no dejan rastro — y ni siquiera las que sí quedan registradas tienen `created_by` (queda `null`).
- Al terminar bien, el step se completa solo y la ejecución avanza — la UI debe refrescar el estado del ciclo de vida cuando `is_locked_external_elaboration` vuelve a `false` (ya cubierto por el poll existente, no hace falta código extra).

## Deuda conocida / limitación actual

**No hay endpoint de estado o listado de `ElaborationRun`.** La única fuente de "¿terminó bien o mal?" son los `execution-logs` de la funcionalidad (`GET /external-systems/{system_id}/functionalities/{functionality_id}/execution-logs?...&status=failed`), que exigen conocer de antemano `system_id`/`functionality_id` (se sacan de `LifecycleElaborationConfigResponse.external_functionality`). Por decisión de producto, esta iteración **no construyó UI de progreso/historial de runs** — solo se cubre con el banner de bloqueo existente y el toast de error del disparo manual. Pedido enviado a backend: [`respuestas/backend-elaboracion-externa-estado-run.md`](../respuestas/backend-elaboracion-externa-estado-run.md).

Esa misma limitación obliga a un `GET /lifecycle/steps/{step_id}/elaboration-config` client-side (gateado por `lifecycle_elaboration_config:l|r`, permiso de *configuración*) solo para decidir si el editor del documento ve el botón de disparo — el mismo pedido incluye agregar `has_external_elaboration` a `lifecycle_status`, como ya se hizo con `is_locked_external_elaboration`, para evitar ese round-trip y ese permiso fuera de lugar.

## Errores comunes

- Comparar `is_locked_external_elaboration` por truthiness en vez de `=== true` — el campo puede venir `undefined` en payloads viejos o en asset types sin elaboración configurada.
- Meter el lock en la condición de **visibilidad** del botón de disparo en vez de `disabled` — hace que el botón aparezca/desaparezca en cada ciclo de disparo, saltando el layout.
- Usar `status.state === "draft"` como proxy de "sigo en la etapa de elaboración" — el chequeo canónico en todo el repo es `status.stage === "edit"`; `state` varía dentro de la misma etapa (ej. `returned`).
- Omitir `new_section_template_section_id` en el PUT pensando que eso lo limpia — omitir = no tocar; limpiar requiere mandar `null` explícito.
- Mostrar toast de éxito genérico (`meta.successMessage`) en el disparo manual sin chequear `data.run !== null` — el 200 con `run: null` es el caso "no había nada que disparar", no un éxito.
- Filtrar el selector de molde de sección por algo distinto de `type === "form"`, o no filtrar — el backend matchea por `field_name` de los `form_fields` de esa sección puntual.
- Asumir que una sección creada por `add` queda marcada como "de IA" en algún campo — no existe, solo el nombre por defecto.

## Checklist de verificación final

```
[ ] Config del step: alta/edición/borrado persisten al instante, no en el batch del sheet
[ ] Selector de molde solo lista TemplateSections type === "form"
[ ] PUT del molde distingue "no tocar" (omitir clave) de "limpiar" (null explícito)
[ ] Botón de disparo: visible solo en stage === "edit" con hasEnabledElaborationConfig
[ ] Botón de disparo: lock resuelto como disabled + tooltip, nunca oculta el botón
[ ] Disparo: sin toast de éxito cuando run === null
[ ] RBAC: lifecycle_elaboration_config:l/c/u/d en PermissionResource y en roles.ts
[ ] i18n: nada hardcodeado (ver src/i18n/locales/asset-types.ts → lifecycle.elaborationConfig.*)
```
