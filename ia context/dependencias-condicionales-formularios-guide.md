# Wisecore — Guía de dependencias condicionales (`depends_on`)

Usar esta guía cuando el trabajo involucre **campos condicionales** de una sección tipo `form`, o **secciones condicionales** (una sección completa, de cualquier tipo, oculta/deshabilitada según respuestas de otra): definirlos en el builder, editar sus condiciones, o entender/ajustar cómo se muestran/ocultan al responder un asset.

---

## 0. Cuándo aplica

```
¿Estoy tocando el builder de form_fields (agregar/editar depends_on de una pregunta)?
  └─ SÍ → leer esta guía + section-form-field-dependency-editor.tsx + validate-form-field-dependencies.ts

¿Estoy configurando/leyendo la condición de una SECCIÓN entera (no una pregunta)?
  └─ SÍ → leer esta guía + sección 3.2 + section-dependency-editor.tsx

¿Estoy tocando cómo se muestran/ocultan campos al responder un formulario en un asset?
  └─ SÍ → leer esta guía + asset-form-section.tsx (sección "Runtime")

¿Necesito saber qué significa un operador (eq, in, contains, ...) o qué value espera?
  └─ SÍ → ver la tabla de operadores (sección 2)
```

---

## 1. Modelo de datos

- Cada `SectionFormField` (`src/types/sections/core.ts`) puede tener:
  - `depends_on?: FieldDependencyCondition[] | null` — lista de condiciones.
  - `show_when_inactive?: boolean` — qué pasa cuando la(s) condición(es) NO se cumple(n).
- Cada `FieldDependencyCondition` es `{ field_id, operator, value? }`: referencia a **otro** campo (`field_id`), un operador, y el valor de comparación.
- **Todas las condiciones de un mismo campo se combinan con AND** (no hay OR entre condiciones de un `depends_on`).
- Los campos referenciables (targets) son: campos **anteriores de la misma sección** + todos los campos de **secciones con `order` menor** (ver `section-form-fields-builder.tsx`). Un campo no puede depender de uno posterior ni de sí mismo.
- `show_when_inactive`:
  - `true` → cuando la condición no se cumple, el campo se sigue **mostrando pero deshabilitado** (solo lectura, no respondible).
  - `false`/ausente → cuando la condición no se cumple, el campo se **oculta** por completo.
- **La evaluación es responsabilidad exclusiva del backend.** El backend calcula, para cada campo de un `FormFieldValue` (snapshot de una `section_execution`), dos flags:
  - `is_visible?: boolean` — si el campo debe mostrarse.
  - `can_answer?: boolean` — si el campo debe ser respondible (además de visible).
  El frontend **nunca** evalúa `depends_on` para decidir visibilidad en runtime — solo lee estos dos flags (ver sección 3). La única lógica de `depends_on` que corre en el cliente es la **validación** del builder (sección 2.1) y la detección de **qué campos son "disparadores"** para saber cuándo auto-guardar (sección 3).

---

## 2. Tabla de operadores (`FieldDependencyOperator`)

Autoridad: el backend. Esta tabla documenta la semántica exacta para que el builder ofrezca los controles correctos y para entender resultados al depurar.

| Operador | Aplica a | `value` esperado | Significado |
|---|---|---|---|
| `eq` | cualquiera | escalar | `valor == value` |
| `neq` | cualquiera | escalar | `valor != value` |
| `gt` / `gte` / `lt` / `lte` | solo `data_type: int` o `decimal` | número | comparación numérica |
| `in` | cualquiera (pensado para dropdown/opción múltiple) | lista no vacía | `valor` está en `value` |
| `not_in` | cualquiera | lista no vacía | `valor` no está en `value` |
| `contains` | solo `question_type: lista_desplegable_multiple` | escalar | el array `valor` incluye `value` |
| `not_contains` | solo `lista_desplegable_multiple` | escalar | el array `valor` no incluye `value` |
| `is_empty` | cualquiera | (se ignora si se envía) | `valor` es `null`, `""`, `[]` o `{}` |
| `is_not_empty` | cualquiera | (no aplica) | negación de `is_empty` |

**Nota clave:** para `in`/`not_in` sobre un `dropdown`/`multipleChoice`, `value` debe ser una **lista de `id` de opciones** (no los `label`) — el mismo formato que se persiste como respuesta de ese tipo de pregunta. Ver `readFieldOptions()` en `question-type-meta.ts` para la forma `{ id, label }` de las opciones.

### 2.1 Validación en el builder (mirror del cliente)

`src/components/sections/validate-form-field-dependencies.ts` replica en el cliente las reglas que el backend aplica al guardar, solo para dar feedback inmediato — **la validación real y autoritativa es la del backend** (400 con detalle si algo no calza). Reglas cubiertas: sin auto-referencia (`selfReference`), sin target duplicado (`duplicateReference`), target debe existir entre los campos disponibles (`targetNotFound`), sin ambigüedad si hay `field_id` repetidos (`ambiguousReference`), operadores numéricos solo contra `data_type` numérico (`numericOnly`), `contains`/`not_contains` solo contra `lista_desplegable_multiple` (`multiSelectOnly`), y `value` requerido salvo en `is_empty`/`is_not_empty` (`missingValue`).

El editor de condiciones (`src/components/sections/section-form-field-dependency-editor.tsx`) restringe qué operadores ofrecer según el tipo del **target** (`operatorsForTarget`) y qué control de `value` renderizar (`renderValueInput`): número para operadores numéricos, select/checkbox-group para dropdown/multiselect, yes-no, date, time, o texto por defecto.

---

## 3. Runtime: cómo se reflejan en el formulario del asset

Archivo: `src/components/assets/content/asset-form-section.tsx`.

- `isFieldVisible(field)` / `isFieldAnswerable(field)` (`question-type-meta.ts`) solo leen `field.is_visible` / `field.can_answer` — nunca evalúan `depends_on` en el cliente.
- `triggerFieldIds`: el conjunto de `field_id` referenciados por **algún** `depends_on` de otro campo de la sección. Son los únicos campos cuyo cambio puede afectar la visibilidad de otro.
- Al cambiar el valor de un campo disparador, se hace un **auto-guardado** (`PATCH /section_executions/{id}/form_values`) solo de esos campos, para que el backend recalcule `is_visible`/`can_answer`. El trigger real no es un debounce único: texto libre guarda en blur + red de seguridad idle de 10s; widgets atómicos guardan en change coalescido 400ms (ver `ia context/question-type-input-guide.md` §5b).
- La respuesta del PATCH viene agrupada por sección (`FormValuesSectionPayload[]`, `src/types/sections/core.ts`): una entrada `{ section_execution_id, section_name, form_fields }` por cada sección **tipo form** de la ejecución afectada — la editada (siempre) más cualquier otra sección form cuyas preguntas dependan, directa o indirectamente, de un valor que cambió. Nunca incluye secciones `ai`/`manual`/`reference` (esos tipos no tienen `form_fields`). Cada `form_field` trae también su `section_execution_id`. `section_name` vive **a nivel del grupo** (una vez por sección), no dentro de cada `form_field`, y puede ser `null` si la sección no tiene nombre asignado.
- Ese auto-guardado llama `onUpdate(payload)` → el padre (`assets-content.tsx` / `workflow-detail-panel.tsx`, `handleSectionUpdate`) delega en `applyFormValuesPatch` (`src/components/assets/content/utils/patch-document-content.ts`), que parchea directamente el caché de React Query (`setQueriesData` sobre `['document-content', documentId]`), reemplazando `form_fields` (y `section_name`, cuando viene no-null) solo de las secciones presentes en `payload` por `section_execution_id` — **ya no dispara** `GET /documents/{id}/content`. Si el PATCH devuelve una sección con un `section_execution_id` que no está en el caché (ver §3.1: recién pasó a "aplicar"), en vez de ignorarla se invalida `['document-content', documentId]` para traerla completa en el próximo fetch — el payload solo trae `form_fields`/`section_name`, no alcanza para insertarla a mano (falta `order`/`section_id`/`status`). El resto de acciones sobre una sección (editar contenido, ejecutar, borrar, cambiar review status) siguen llamando `onUpdate()` sin payload, que conserva el fallback de invalidar/refetch.

### 3.1 Secciones "no aplica" (dos motivos independientes)

Una sección se considera **"no aplica"** por cualquiera de estos dos motivos, independientes entre sí (una capa encima del cálculo por pregunta de arriba):

- **(a)** Su propio `depends_on` de sección (§3.2) no se cumple y `show_when_inactive` es falsy/ausente → `is_visible: false`. Aplica a cualquier tipo de sección (`form`/`manual`/`ai`/`reference`).
- **(b)** Es tipo `form` y no tiene ninguna pregunta con `is_visible: true` (sin preguntas definidas, o todas ocultas por `depends_on` de pregunta).

Efecto de cualquiera de los dos:

- `GET /documents/{document_id}/content` **no la incluye** en `content`. No hay flag nuevo que lo indique — el ítem simplemente está ausente. El resto de secciones se devuelven igual que siempre. No asumir que todas las secciones del documento van a estar siempre presentes en `content`.
- `GET /workflows/` excluye esas secciones del cálculo de `progress_percentage` (numerador y denominador). `current_step` y `last_modified_at` no cambian.
- `GET /section_executions/{section_execution_id}/content` **no filtra nada** — sigue devolviendo la sección igual que siempre, con sus flags calculados.
- El front replica esta regla en `isSectionApplicable` (`src/components/workflow/workflow-section-stats.ts`, antes `isFormSectionApplicable`): primero corta por `isSectionVisible(section)` (motivo a, cualquier tipo), después por la regla de preguntas visibles (motivo b, solo `form`). Usado para filtrar `formSections` en `workflow-detail-panel.tsx` y el render en modo lector/editor de `assets-content.tsx`. Cubre el intervalo entre el parche de caché de un `PATCH /form_values` y el próximo refetch de `/content` — el backend sigue siendo la autoridad; esto es solo un espejo cliente, igual que `isFieldVisible`/`isFieldAnswerable`.
- `computeSectionStats` (mismo archivo) filtra `questions` por `isFieldVisible` (para que "respondidas/total" no cuente preguntas ocultas) y fuerza `missingRequired: 0` cuando `!isSectionAnswerable(section)` (motivo a con `show_when_inactive: true`, o `access: 'view'`) — si no, los obligatorios de una sección inactiva-pero-visible quedarían "pendientes" para siempre en el resumen del wizard.
- En `workflow-detail-panel.tsx`, `step` (índice sobre `formSections`) se reancla cuando la lista cambia de largo u orden (una sección deja o empieza a aplicar mientras se está respondiendo el wizard) — comparando contra la lista anterior en vez de asumir que el índice sigue siendo válido.
- Los `form_fields` recomputados fluyen igual como prop hacia `sortedFields`/`displayedFields`, y el filtro de render (`isFieldVisible`) muestra/oculta los campos dependientes — incluidos los de otra sección form, si esa sección está montada.

### 3.2 Dependencias a nivel de SECCIÓN

Desde que el backend extendió el mecanismo a secciones completas, `depends_on`/`show_when_inactive` puede vivir también en la sección misma (`Section`/`TemplateSection`), no solo en cada `form_field` — mismo shape, mismos operadores (§2), pero con diferencias importantes:

- **Aplica a los 4 tipos de sección** (`form`/`manual`/`ai`/`reference`), no solo `form`.
- Se envían al mismo nivel que `name`/`type`/`prompt` en `POST /sections/`, `PUT /sections/{id}`, `POST /template_section/`, `PUT /template_section/{id}`. **Si no se mandan en un `PUT`, se conserva el valor previo** — por eso el front (`sections-form.tsx`) siempre envía ambas claves, también cuando están vacías (`[]`/`false`), para poder borrar una dependencia existente.
- **`PUT /template_section/{id}` no admite payload parcial.** Mandar solo `depends_on`/`show_when_inactive` responde 422 (falta `name`), y con `name` responde **500**. Hay que reenviar la sección completa — `name`, `type`, `order`, los campos propios del `type` (`prompt`+`dependencies`, `manual_input`, `reference_*`, `form_fields`) y `propagate_to_sections` — igual que `sections-form.tsx` en modo edit. Para superficies que no son el formulario de sección, usar `buildTemplateSectionUpdatePayload` (`src/components/sections/build-template-section-update-payload.ts`), que arma ese payload a partir de la sección tal como viene de `getTemplateById`. Ojo con `order`: enviar el valor crudo del backend, nunca un índice fabricado en el cliente, o el guardado reescribe el orden de la plantilla.
- El backend permite que `field_id` apunte a un `form_field` de **cualquier** sección (sin restricción de orden), pero el front (`sections-form.tsx`, `sectionDependencyFields`) solo ofrece como target las preguntas de **secciones anteriores** — mismo criterio que a nivel de pregunta, para no configurar dependencias imposibles de satisfacer en el flujo natural de llenado.
- **Diferencia crítica con el nivel de pregunta: el backend NO valida el `field_id` a nivel de sección.** Un id inexistente o mal escrito no devuelve 400 — la sección queda inactiva para siempre, en silencio. `sectionHasValidDependencies` (`validate-form-field-dependencies.ts`) es la única red de contención del usuario contra esto; bloquea el guardado igual que a nivel de pregunta.
- **`GET /templates/{id}` NO devuelve `depends_on`/`show_when_inactive` en sus `sections[]`** (pendiente en backend). Consecuencias mientras siga así: (a) una condición guardada no se puede releer — el bloque "Condiciones" de Tipos de Activo la muestra solo mientras dure la sesión, parcheando el caché de `["template", templateId]` con la respuesta del `PUT` en vez de invalidar; (b) el estado inicial de `sections-form.tsx` arranca vacío aunque la sección tenga condición, por eso ese form solo envía `depends_on`/`show_when_inactive` si el usuario tocó el editor (`sectionDependencyTouched`) o si el item trajo el valor — enviarlas siempre borraría la condición en silencio al editar cualquier otra cosa de la sección. No asumir que `depends_on` ausente en una sección de template significa "sin condiciones".
- Lectura en `GET /documents/{id}/content` y `GET /section_executions/{id}/content`: cada sección trae `depends_on`, `show_when_inactive`, `is_visible`, `can_answer`. Con `show_when_inactive: true` y condición no cumplida, la sección aparece con `is_visible: true`, `can_answer: false`, y **todos** sus `form_fields` (si es tipo `form`) vienen con `can_answer: false` forzado — la sección inactiva gana sobre sus preguntas, aunque el `depends_on` individual de alguna diera `true`.
- Se propaga sola en los flujos existentes de copia/sincronización (crear documento desde template, sync doc↔template, clonar template/ejecución, crear template desde documento) — no requiere nada especial del front.
- Los valores de los campos **no se borran** cuando una sección pasa a estar inactiva; si se reactiva, reaparecen tal cual quedaron guardados.
- Editor: `section-dependency-editor.tsx` reusa `SectionFormFieldDependencyEditor` con `ownFieldId=""` (desactiva `selfReference`, que no aplica a una sección) y textos propios (`form.sectionDependency.*`); los `operators.*`/`errors.*` se comparten con el nivel de pregunta.
- Runtime: `isSectionVisible`/`isSectionAnswerable` (`workflow-section-stats.ts`) — mismo principio que `isFieldVisible`/`isFieldAnswerable`, el front nunca evalúa `depends_on`, solo lee los flags.
- Refetch: `PATCH /form_values` **nunca** recalcula flags de sección (ver §3.3 abajo).

### 3.3 Refetch tras `PATCH /form_values` cuando hay dependencias de sección

`PATCH /form_values` recalcula y devuelve flags de **pregunta**, pero nunca los de **sección** — así que responder un campo puede activar/desactivar otra sección sin que la respuesta del PATCH lo refleje. `applyFormValuesPatch` (`src/components/assets/content/utils/patch-document-content.ts`) resuelve esto con invalidación dirigida: antes de parchear el caché, junta los `field_id` referenciados por el `depends_on` de **cualquier sección cacheada** (`sectionTriggerIds`); si el PATCH tocó alguno de esos ids, invalida `['document-content', documentId]` en vez de parchear, para traer `/content` completo con las secciones que cambiaron de visibilidad. Si no tocó ninguno, sigue el parche optimista de siempre (sin refetch).

**Segundo motivo de refetch: `lifecycle_status`.** `PATCH /form_values` tampoco devuelve `lifecycle_status`, así que `can_advance` y `advance_blockers` (los que deshabilitan el botón "Completar" vía `isBlockedByRequiredAnswers`, `src/hooks/useLifecycleActions.ts`) quedarían con el valor del último `GET /content`: se respondía el último obligatorio, el PATCH guardaba bien, y el botón seguía gris hasta apretar refresh. `applyFormValuesPatch` compara, por cada sección del payload, `computeSectionStats(seccionCacheada)` contra `computeSectionStats({ ...seccionCacheada, form_fields: delPayload })` y, si **cruza el umbral** `missingRequired === 0 ↔ > 0` (en cualquiera de las dos direcciones), invalida `['document-content', documentId]` **después** de aplicar el parche optimista — `invalidateQueries` no borra la data cacheada, solo la marca stale y refetchea, así que no hay parpadeo. Solo el cruce del umbral, no cada respuesta: bajar de 3 a 2 pendientes no cambia `can_advance` (solo el conteo del diálogo de blockers) y sería un `GET /content` por campo. El cliente **no** recalcula blockers: solo decide cuándo volver a pedirlos.

**`form_values` vs `form_answer`:** además del batch de arriba existe `PATCH /section_executions/{id}/form_answer` (`answerSectionFormQuestion`, `src/services/section_execution.ts`), que guarda **una sola** respuesta y devuelve directamente `next_question` (la siguiente pregunta visible/respondible sin valor, o `null`) más `is_complete`/`total_questions`/`answered_questions` — pensado para un flujo conversacional de una pregunta a la vez, sin que el cliente tenga que recorrer `form_fields` para encontrar la próxima. Es **por sección**: `form_fields` de la respuesta trae solo las preguntas de la `section_execution_id` respondida, nunca cruza a otras secciones. Si una dependencia cruza secciones (una pregunta de la sección B depende de una respuesta en la sección A), seguir usando `form_values`, o llamar `form_answer` también sobre la sección B después de completar la A. Ambos endpoints comparten las mismas reglas de `depends_on`/`show_when_inactive`/`is_visible`/`can_answer`, calculadas siempre en el backend. A diferencia de `form_values`, `form_answer` **no** incluye `section_name` — si se necesita en ese flujo hay que resolverlo aparte (ej. `ContentSection.section_name` de `/content`).

---

### 3.4 Dependencias a nivel de STEP del ciclo de vida (`LifecycleStep.depends_on`)

Extensión más reciente del mecanismo: un `LifecycleStep` (etapa agrupable — `edit`/`review`/`approve`) también puede tener `depends_on`, mismo formato y operadores (§2), sin `show_when_inactive` (no existe la variante "visible pero deshabilitado": un step inaplicable simplemente desaparece de la secuencia de esa ejecución).

- **Solo tiene sentido en etapas agrupables** (`edit`/`review`/`approve`, `isGroupableStepType` en `src/lib/lifecycle-access.ts`) — las que forman una cola de pendientes y bloquean el avance de fase. La UI de administración (`LifecycleStepConditions`, `src/components/assets-types/assets-types-lifecycle-step-conditions.tsx`) se monta únicamente dentro de `EditStepContent`, que ya está restringido a esos tipos.
- `field_id` referencia una `SectionForm.field_id` (pregunta de formulario) — **no** otro `LifecycleStep`.
- **Diferencia clave con el `depends_on` de sección**: `GET /lifecycle/document-types/{id}/steps` **sí** devuelve `depends_on` en su respuesta. No hace falta el hack de parchear caché con la respuesta del PUT (§3.2) — se invalida `['lifecycle', 'steps', documentTypeId, ...]` normal y se relee del backend.
- **El picker de campo cruza TODAS las plantillas vinculadas al tipo de activo**, no una plantilla puntual: el step vive en el `document_type`, y el backend no valida que el `field_id` exista en la plantilla que efectivamente se usó para crear cada documento — si no existe, el step queda inaplicable en silencio para esos documentos (mismo caveat que documenta el spec de backend). `useDocumentTypeDependencyFields` (`src/hooks/useDocumentTypeDependencyFields.ts`) agrega los campos de todas las plantillas vinculadas (`useDocumentTypeTemplates` + `getTemplateById` por plantilla, misma query key `["template", templateId]` que ya usan `TemplateSectionConditions`/`TemplateSectionAccessMatrix`) y expone `presenceByFieldId` para poder advertir en el picker cuando un campo no está en todas — ver `fieldWarningFor` de `SectionFormFieldDependencyEditor`.
- Guardado: PATCH parcial (`updateStep.mutateAsync({ stepId, data: { depends_on } })`), independiente del batch-save de SLA/acceso/roles de las tarjetas de grupo — no se pisan entre sí.
- **El filtrado por `depends_on` lo hace el backend, no `useLifecycleProgress`**: `useAllLifecycleSteps` reenvía `executionId` como `execution_id` a `GET /lifecycle/document-types/{id}/steps` (`src/hooks/useLifecycle.ts`), y el backend excluye ahí los steps cuyo `depends_on` no se cumple para esa ejecución — mismo criterio que usa para no exigir/bloquear el avance. El panel "N de M" (`useLifecycleProgress`) y `nextStep` leen esa lista ya filtrada, sin evaluar nada en el cliente.
- **Pero el resultado se cachea por `documentTypeId` + `executionId` (`lifecycleQueryKeys.steps`) y `PATCH /form_values` no lo recalcula**: si el GET de steps corrió mientras el campo que decide el `depends_on` todavía no tenía respuesta (típico en un documento recién creado, con `isBlockedByRequiredAnswers` disparando el fetch temprano — `useLifecycleActions.ts`), el cache queda con un step que ya no aplica y el autoguardado posterior no lo corrige por sí solo — mismo problema que §3.3 documenta para el `depends_on` de sección, aplicado acá a `['lifecycle','steps']`. Mitigación cliente, en dos capas: (1) `applyFormValuesPatch` (`src/components/assets/content/utils/patch-document-content.ts`) junta los `field_id` referenciados por el `depends_on` de cualquier step cacheado (`stepTriggerIds`, espejo de `sectionTriggerIds`) y, si el payload tocó alguno, invalida las queries de steps por ejecución vía `invalidateExecutionLifecycleSteps` (`src/hooks/useLifecycle.ts`); (2) `useLifecycleActions` también invalida al abrir el sheet de Completar, como red contra la carrera "el PATCH resuelve antes de que el primer GET de steps termine" y contra respuestas que llegan por otro canal (elaboración externa, otra sesión). `invalidateExecutionLifecycleSteps` deja intacta la matriz de configuración del tipo de activo (`executionId` ausente) — no depende de las respuestas del documento.

## 4. Errores comunes

- ❌ Evaluar `depends_on` en el cliente para decidir mostrar/ocultar un campo en runtime. El backend es la única autoridad; el cliente solo lee `is_visible`/`can_answer`.
- ❌ Enviar `value` como `label` en vez de `id` para condiciones `in`/`not_in`/`contains` sobre dropdown/multiselect.
- ❌ Usar operadores numéricos (`gt`/`gte`/`lt`/`lte`) contra un target que no es `data_type: int`/`decimal`.
- ❌ Referenciar un campo posterior en la misma sección o de una sección con `order` mayor — solo campos anteriores son válidos.
- ❌ Olvidar que las condiciones de un mismo `depends_on` son AND — no hay forma de expresar OR entre condiciones de un campo.
- ❌ Confundir `show_when_inactive: true` (se muestra deshabilitado) con `false`/ausente (se oculta) al diseñar la UX de un campo condicional.
- ❌ Buscar `section_name` dentro de cada `form_field` de la respuesta de `form_values` — vive a nivel del grupo, una vez por sección.
- ❌ Asumir que `lifecycle_status.advance_blockers` / `can_advance` del caché siguen vigentes después de un autoguardado: `PATCH /form_values` no los recalcula (ver §3.3). Cualquier UI nueva que dependa de ellos tiene que colgarse del refetch por cruce de umbral de `applyFormValuesPatch`, no del parche de `form_fields`.
- ❌ Asumir que `form_answer` devuelve `section_name` igual que `form_values` — no lo incluye.
- ❌ Asumir que todas las secciones form del documento siempre están presentes en `content` — una sección sin ninguna pregunta visible ("no aplica", ver §3.1) está ausente, sin flag que lo indique.
- ❌ Ignorar en el cliente una sección devuelta por `PATCH /form_values` que no está en el caché de `/content` — hay que invalidar, no descartarla (recién pasó a aplicar).
- ❌ Asumir que el backend valida el `field_id` de un `depends_on` de **sección** — no lo hace (a diferencia del nivel de pregunta); un id inexistente deja la sección inactiva para siempre sin ningún 400. La única red es la validación cliente (`sectionHasValidDependencies`).
- ❌ Asumir que `GET /templates/{id}` devuelve el `depends_on` de sus secciones — no lo hace; leer ausencia como "sin condiciones" y reenviar `[]` borra la condición guardada.
- ❌ Invalidar `["template", templateId]` después de guardar una condición de sección: el refetch la borra de la vista. Parchear el caché con la respuesta del `PUT` (merge solo de las claves presentes — esa respuesta no trae `form_fields` ni `dependencies`).
- ❌ Guardar `depends_on` de sección con un `PUT /template_section/{id}` parcial (solo `name` + las dos claves) — responde 500; hay que reenviar la sección completa (ver §3.2).
- ❌ Omitir `depends_on`/`show_when_inactive` en un `PUT` de sección creyendo que eso la limpia — el backend conserva el valor previo si las claves no viajan; hay que enviar `[]`/`false` explícito.
- ❌ Referenciar desde una sección un campo de una sección posterior o de la propia — el backend lo acepta sin error, pero la sección nunca se activa (o crea un deadlock si depende de sí misma). El front restringe el selector a secciones anteriores por esto.
- ❌ Confundir el `depends_on` de **pregunta** con el de **sección** al tocar `PATCH /form_values` — solo el de pregunta se recalcula en esa respuesta; una dependencia de sección requiere la invalidación dirigida de §3.3.
- ❌ Asumir que los steps cacheados en `['lifecycle','steps']` siguen vigentes después de un autoguardado — `PATCH /form_values` tampoco los recalcula (ver §3.4); un campo trigger del `depends_on` de un STEP requiere la misma invalidación dirigida que §3.3 hace para secciones.

---

## 5. Checklist final

```
[ ] depends_on solo referencia campos anteriores (misma sección u orden menor)
[ ] value usa id (no label) para in/not_in/contains sobre dropdown/multiselect
[ ] operadores numéricos solo contra data_type int/decimal
[ ] contains/not_contains solo contra lista_desplegable_multiple
[ ] show_when_inactive elegido a propósito (oculto vs. deshabilitado)
[ ] ninguna lógica nueva evalúa depends_on en el cliente para runtime — solo lee is_visible/can_answer
[ ] validate-form-field-dependencies.ts actualizado si se agrega un operador o regla nueva
[ ] nuevo listado/render de secciones usa isSectionApplicable (o filtra igual) en vez de asumir que todas están en content
[ ] depends_on/show_when_inactive de SECCIÓN se envían siempre en el PUT (también vacíos) — nunca se omiten
[ ] un campo trigger de una dependencia de SECCIÓN dispara invalidación de /content, no solo el parche de caché
[ ] un campo trigger de una dependencia de STEP dispara invalidación de las queries de steps por ejecución (invalidateExecutionLifecycleSteps), no solo el parche de /content
```
