# Wisecore — Guía de permisos de sección por ciclo de vida (`section_lifecycle_access`)

Usar esta guía cuando el trabajo involucre **quién puede ver/editar una sección puntual** de un documento según la etapa del ciclo de vida (distinto del permiso del documento completo), o cuando se agregue una superficie nueva que renderice el array de secciones de `/content`.

---

## 0. Cuándo aplica

```
¿Estoy renderizando el array de secciones de GET /documents/{id}/content
(el editor de /asset, el wizard de workflow, un resumen, un comparador de versiones)?
  └─ SÍ → leer esta guía + src/hooks/useDocumentSectionAccess.ts, cruzar SIEMPRE
          canViewSection/resolveSectionCanEdit antes de decidir qué se ve/edita

¿Estoy tocando el sheet de configuración de secciones (crear/editar/borrar/reordenar)?
  └─ SÍ → leer esta guía + sección 4 (assets-sections-sheet.tsx)

¿Estoy tocando la matriz sección × step del template (asset-types)?
  └─ SÍ → leer esta guía + sección 5 (assets-types-template-sections-matrix.tsx)

¿Necesito invalidar caché tras crear/editar/borrar/reordenar una sección?
  └─ SÍ → invalidar también ['document-section-access', documentId] (sección 3)
```

---

## 1. Modelo de datos y árbol de decisión

El backend resuelve, por sección y por usuario, dos permisos independientes: `view` y `edit`. La regla completa (documentada en `src/types/templates/section-lifecycle-access.ts`):

1. **Org admin** → siempre `view` y `edit` en `true`.
2. **La sección no tiene ninguna fila configurada** (`TemplateSectionLifecycleAccess` para ningún step), o el documento no tiene template → la sección **hereda** el `view`/`edit` del documento completo, igual que sin esta feature. Ya no depende de ningún flag de la plantilla — `Template.section_lifecycle_access_enabled` sigue existiendo por compatibilidad pero el backend no lo consulta para esto, y el front tampoco lo lee ni lo escribe.
3. **La sección tiene al menos una fila** (global o por rol, en cualquier step) → a partir de ahí **deja de heredar del documento en TODAS sus celdas**, incluidas las que quedaron sin configurar:
   - `view = true` si el usuario tiene acceso a algún step referenciado por una fila (una fila `edit` también cuenta para `view`), **o** si esa (sección, rol) tiene `view` heredado desde `edit`/`review`/`approve` de esa misma sección — ver sección 6.
   - `edit = true` solo si tiene acceso a un step cuya fila sea `access: "edit"`.
   - Si la sección solo tiene filas `view` (sin herencia), **nadie la edita**, ni siquiera el dueño del documento.

Esto es lo que el badge "reglas propias" (sección 5) hace explícito en la matriz de configuración.

---

## 2. Qué endpoint trae qué — **el hueco que esta guía existe para tapar**

| Endpoint | ¿Manda `view`/`can_edit`? |
|---|---|
| `GET /documents/{id}/content` | **NO.** Es lo que renderiza `/asset` y el wizard (`ContentSection`), pero no filtra por `view` ni manda `can_edit`. `ContentSection.can_edit` queda tipado por si el backend lo suma a futuro, pero HOY siempre llega `undefined` — **no leerlo directo**. |
| `GET /documents/{id}/sections` | Sí. Omite las secciones sin `view` y resuelve `can_edit` para el usuario actual. Es la fuente que usa `useDocumentSectionAccess`. |
| `GET /documents/{id}/sections_config` | Sí, sobre el array `sections` (`SectionsConfigSection.can_edit`). Usado por el sheet de configuración. |
| `GET /sections/{id}/content` | Sí (404 si no hay `view`). |
| `GET /section_executions/{id}/content` | Sí — `can_edit: boolean \| null` a nivel de sección y `form_fields[].can_answer` forzado a `false` si no hay `edit`. Ningún componente del front consume este endpoint hoy (`/content` es la fuente real); si se agrega uno nuevo, usarlo en vez de reinventar el cruce. |
| `GET /execution/{id}` | Sí (arreglado — antes no filtraba). `sections[]` omite las secciones sin `view` y agrega `can_edit: boolean` + `template_section_id` a cada una que sí aparece. Consumido hoy por `execution-info-sheet.tsx` vía `getExecutionById` (`src/services/executions.ts`) — tipo `ExecutionSection` en `src/types/execution/core.ts`. |
| `GET /documents/by-internal-code/{code}/executions/{version_name}` | Sí (arreglado — mismo fix). `sections[].can_edit: boolean \| null` (`null` = el permiso por sección no aplica, el acceso depende solo del documento completo). No consumido por ningún componente del front hoy. |

**Consecuencia práctica:** cualquier pantalla que renderice el array de `/content` necesita cruzar aparte contra `/documents/{id}/sections` para saber `view`/`can_edit` reales. Ese cruce es exactamente lo que hace `useDocumentSectionAccess` (`src/hooks/useDocumentSectionAccess.ts`) — no reimplementarlo.

---

## 3. `useDocumentSectionAccess` — contrato

```ts
const sectionAccess = useDocumentSectionAccess(documentId, enabled)
// { allowedIds: Set<string> | null, canEditById: Map<string, boolean>, isLoading, isError, refetch }
```

- Query a `getDocumentSections()` (`src/services/assets.ts`), key `['document-section-access', documentId]`.
- **Fail-open explícito:** si la query falla (`allowedIds === null`), `canViewSection` y `resolveSectionCanEdit` **no restringen** — el backend sigue siendo la autoridad real y rechaza cualquier escritura con `SECTION_LIFECYCLE_PERMISSION_DENIED` (`src/lib/section-permission-errors.ts`, ya manejado en `asset-form-section.tsx`).
- **Mientras carga**, en cambio, no hay que renderizar las secciones (podría exponerse una sin `view` en el primer frame) — gatear el skeleton con `sectionAccess.isLoading` igual que con la query de `/content`.
- Helpers puros exportados del mismo archivo:
  - `canViewSection(section, access)` → `false` solo si `access.allowedIds` tiene datos Y `section.section_id` no está en la lista.
  - `resolveSectionCanEdit(section, access)` → `boolean | null`; prioridad: `access.canEditById` sobre `section.can_edit` (que siempre es `undefined` hoy).

**Invalidar `['document-section-access', documentId]` en cualquier mutación que cambie la composición de secciones o sus reglas de acceso**: crear/editar/borrar/reordenar sección, guardar la matriz de acceso del template, y en el botón de refresh manual de la pantalla. Usar `useInvalidateDocumentSectionAccess()` del mismo archivo.

---

## 4. Consumo en superficies que renderizan secciones

Patrón usado en `assets-content.tsx` (asset) y `workflow-detail-panel.tsx` (wizard):

```tsx
const sectionAccess = useDocumentSectionAccess(documentId, enabled)

// al filtrar el array de /content:
if (!canViewSection(section, sectionAccess)) return null // o filter()

// al decidir canEditSections para ESA sección puntual:
const canEditThisSection = frontendPermissions.canEditSections
  && resolveSectionCanEdit(section, sectionAccess) !== false
```

- El permiso de **documento** (`frontendPermissions.canEditSections`, `useDocumentAccess.ts`) y el de **sección** son un AND — ninguno reemplaza al otro.
- Para distinguir en la UI "no podés editar el documento" de "esta sección puntual es de solo lectura en esta etapa", pasar también `resolveSectionCanEdit(...) === false` (con `canEditSections` del documento en `true`) como prop separada (`readOnlyBySectionRule` en `assets-section.tsx`) y pintar un indicador — no solo deshabilitar en silencio.
- En el sheet de configuración de secciones (`assets-sections-sheet.tsx`), el permiso de sección viene de `sections_config` (`section.can_edit`), no de `useDocumentSectionAccess` — ya viene filtrado por `view`, no hace falta cruzar nada para visibilidad, solo gatear `canUpdate`/`canDelete` por fila con `section.can_edit !== false` y mostrar el badge "reglas propias" (`hasOwnLifecycleRule` en `SortableSectionSheet`).

---

## 5. Matriz de configuración (asset-types)

`assets-types-template-sections-matrix.tsx` es la única pantalla que escribe `TemplateSectionLifecycleAccess`. Ahí — no en el consumo — vive el indicador de "esta sección tiene reglas propias" que pide el punto 3 del árbol de decisión (sección 1): una sección con **al menos una celda configurada** (global o por rol, en cualquier step) dejó de heredar del documento en todas sus celdas, incluidas las vacías. El badge se deriva de `accessBySection`/`roleAccessBySection` (ya devueltos por `useTemplateLifecycleAccessMatrix`), no hace falta una query nueva. La matriz siempre es editable con permiso RBAC — no hay switch que la gatee ni que el front necesite leer o escribir.

Por lo mismo, la matriz **no rotula igual las dos clases de celda vacía**: el helper `sectionHasOwnRules(sectionId)` decide si una celda sin fila se pinta como `inherit` ("Sin regla propia — usa el permiso del documento", glifo punteado) o como `no-access` ("Sin acceso en esta etapa", glifo `Ban` gris sólido). Es la misma ausencia de fila en el backend, pero el efecto es opuesto — cualquier superficie nueva que muestre este estado debe hacer la misma distinción y nunca escribir "hereda" sin decir qué hereda (el permiso ver/editar del documento completo).

---

## 6. Herencia de `view` desde edición/revisión/aprobación

Un usuario con acceso real a `edit`, `review` o `approve` de un documento (o de una sección puntual, en la matriz de plantilla) tiene `view` ahí aunque nadie lo haya asignado explícitamente al step/celda `view`. Es un permiso real — afecta abrir el documento, listados/búsqueda y contenido —, calculado en el momento, no una fila nueva en la base. `create`/`publish`/`archive` **no** cuentan como fuente de herencia.

- **"Permisos por rol"** (`GET /lifecycle/document-types/{id}/steps`): el step `view` trae `inherited_roles[]` (rol + de qué step viene) y `view_inherited_for_all_roles: boolean` (algún step `edit`/`review`/`approve` con `access_type: "all"` → heredado para TODOS los roles de la org). Helpers en `src/lib/lifecycle-access.ts`: `isViewInheritedForRole`, `inheritedViewSource`. La matriz (`assets-types-lifecycle-matrix.tsx`) pinta esas celdas con `CellInherited` (check bloqueado); el sheet de step (`assets-types-lifecycle-step-roles-tab.tsx`) las lista como chips no removibles.
- **Matriz de plantilla** (`GET /templates/{id}/lifecycle_access_matrix`): `inherited_view_access[]` es la misma idea pero por sección — `{ template_section_id, role_id, source_lifecycle_step_id, source_lifecycle_step_type }`, calculado, no una fila de `access`. `role_id: null` = aplica a cualquiera elegible para el step origen. Un par puede estar en `access` y en `inherited_view_access` a la vez — se pinta bloqueado igual, porque el DELETE fallaría.
- **Intentar quitar un `view` heredado da 409**: `LIFECYCLE_VIEW_ACCESS_INHERITED` (permisos por rol, `DELETE /lifecycle/steps/{id}/roles/{role_id}`) o `SECTION_VIEW_ACCESS_INHERITED` (matriz, `DELETE /template_sections/{id}/lifecycle_access/{view_step_id}`). Solo bloquea el DELETE, no el PUT — se puede seguir subiendo una celda heredada a `edit` explícito. Ambas pantallas lo capturan con `ApiError.code` y muestran un toast específico en vez del genérico de guardado.
- **Step `view` con roles puntuales** (`access_type` distinto de `"all"`, p. ej. un step "Lector"): por diseño está fuera del pipeline secuencial, así que solo otorga acceso una vez que la ejecución llegó a un estado final (`approved`/`published`/`archived`/`finalized` — ver `TERMINAL_LIFECYCLE_STATES` en `src/lib/lifecycle-access.ts`). Mientras esté en `draft`/`in_review`/`in_approval`, sus filas no cuentan. Un step `view` con `access_type: "all"` no tiene esta restricción — sigue activo en cualquier fase. Para dar lectura durante la elaboración corresponde usar un step `review`, no un `view` con roles puntuales.

## 7. `create`/`publish`/`archive`: sí en «Permisos por rol», no en la matriz de plantilla

Las dos pantallas de esta guía difieren en qué tipos de step muestran:

- **«Permisos por rol»** (`GET /lifecycle/document-types/{id}/steps`, `assets-types-lifecycle-matrix.tsx`): el endpoint devuelve **las siete etapas** (`create`, `edit`, `review`, `approve`, `publish`, `archive`, `view`) y la matriz las muestra todas — pastilla de etapa, columna y panel lateral. **No filtrar por tipo acá.** El sheet mono-entidad (`assets-types-lifecycle-step-sheet.tsx`) es el mismo para las siete, gobernado por `lifecycleStepCapabilities` (`src/lib/lifecycle-access.ts`): las etapas sin grupos (`view`/`create`/`publish`/`archive`) no muestran posición/SLA/tabs de condiciones; las agrupables (`edit`/`review`/`approve`, según `isGroupableStepType`) sí. Única excepción por tipo: la celda «Propietario» × columna `create` se pinta `n/a` (en la creación todavía no hay propietario) — `lifecycleStepCapabilities("create").hasOwnerToggle` es `false` por lo mismo.
- **Matriz de plantilla** (`GET /templates/{id}/lifecycle_access_matrix`, `useTemplateSectionLifecycleAccess.ts`): sigue restringida a `view`/`edit`/`review`/`approve` con `isSectionPermissionStepType`/`SECTION_PERMISSION_STEP_TYPES` (`src/lib/lifecycle-access.ts`) — no se asigna acceso sección por sección en transiciones automáticas o ligadas al creador.

`LIFECYCLE_PIPELINE_ORDER` (mismo archivo) incluye los siete tipos y es lo que ordena pastillas y columnas; los tipos que no estén listados van al final, nunca se descartan.

## 8. Errores comunes

- Leer `section.can_edit` directo de un `ContentSection` de `/content` — siempre `undefined`, usar `resolveSectionCanEdit`.
- Ocultar secciones sin cruzar `sectionAccess` — el array de `/content` no filtra por `view`.
- Restringir mientras la query de `/sections` está en error — debe ser fail-open, no fail-closed.
- Renderizar secciones antes de que `sectionAccess` termine de cargar — riesgo de flash de una sección sin `view`.
- Olvidar invalidar `['document-section-access', documentId]` en una mutación nueva que cambia secciones — el permiso queda stale hasta el próximo refetch de 30s.
- Duplicar el cálculo de `canEditSections` sin cruzar RBAC (pasó en `assets-sections-sheet.tsx` — ver `computeFrontendPermissions` en `useDocumentAccess.ts` como única fórmula AND: lifecycle × etapa × RBAC).

---

## 9. Checklist de verificación

- [ ] Sin filas propias en una sección: comportamiento idéntico al de antes de esta feature (regresión cero).
- [ ] Sección sin `view`: no aparece en ninguna superficie (asset, wizard, sheet), sin huecos en la numeración.
- [ ] Sección con solo `view`: se ve pero ningún control de edición/respuesta funciona, con indicador visible de por qué.
- [ ] Query de `/sections` en error: la app no oculta ni bloquea nada (fail-open).
- [ ] 403 `SECTION_LIFECYCLE_PERMISSION_DENIED` con caché vieja: la sección se re-renderiza como solo lectura tras la invalidación existente en `asset-form-section.tsx`.
- [ ] Un rol con `edit`/`review`/`approve` (sin fila propia en `view`) aparece marcado y bloqueado en la columna/celda de Lectura, con el step origen en el tooltip; intentar desmarcarlo no dispara request.
- [ ] `create`/`publish`/`archive` no aparecen como chips/columnas en ninguna de las dos pantallas de permisos.
