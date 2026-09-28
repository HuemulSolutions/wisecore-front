# Campos calculados en formularios (`campo_calculado_formula` / `campo_calculado_condicional`)

Dos `question_type` cuyo valor lo calcula el **backend** a partir de otras respuestas de la misma ejecución. El front **nunca evalúa**: solo arma `calculation_config`, valida referencias para dar feedback inmediato y muestra el `value` ya calculado (solo lectura, badge "calculado").

## Cuándo aplica
- Tocar el builder de preguntas de sección (`src/components/sections/`) para estos dos tipos.
- Renderizar su valor en runtime (ver `form-field-answer-value.tsx`).

## Formato

### `campo_calculado_formula`
`data_type` fijo `decimal`. Se guarda en `form_fields` (POST/PUT `template_section` y `sections`):

```json
"calculation_config": {
  "mode": "formula",
  "expression": "@subtotal + @subtotal * 0.19",
  "fields": ["subtotal"],
  "round_decimals": 2
}
```
- `expression`: texto libre con tokens `@field_id`. **Conservar el `@`** al enviar y recibir.
- `fields`: `field_id` únicos usados en la expresión. Se **deriva siempre del texto** (`extractFormulaFieldIds`), nunca se edita a mano; sin duplicados aunque la fórmula use el campo dos veces.
- Operadores/funciones: `+ - * / // % **`, comparaciones, `and or`, `a if c else b`, `sqrt exp log log10 log2 abs round min max ceil floor`. Lo demás → 400.
- División por cero/errores numéricos → `value: null`. Reemplazo explícito con ternario: `@total / @cantidad if @cantidad != 0 else 0`.
- **Formato legado** `terms[]`/`constant`: ya no lo acepta el backend. `withFieldKey` (question-type-meta.ts) lo convierte a `expression`/`fields` al cargar (`normalizeFormulaConfig`).

### `campo_calculado_condicional`
`{ mode: "conditional", root: { if: [...], then, else } }`, árbol anidable (máx. 10 niveles), `then`/`else` = `{type:"value",value}` o `{type:"rule",...}`. `if` = mismo formato/operadores que `depends_on`. `data_type` lo elige quien arma el campo. Sin cambios de formato.

## Reglas de referencia (ambos tipos)
Solo preguntas **estrictamente anteriores** (misma sección en posición previa, o sección con `order` menor), sin autorreferencia, sin `field_id` ambiguo entre secciones. Fórmula: además el campo referenciado debe ser numérico (`int`/`decimal`, incluye otra fórmula). Condicional: cualquier tipo. Referencias circulares son imposibles por construcción.

## Picker `@` de la fórmula
- Endpoints: `GET /template_section_form/available_fields?template_id&order&exclude_template_section_id` y `GET /section_form/available_fields?document_id&order&exclude_section_id` → `getTemplateSectionAvailableFields` / `getSectionAvailableFields`, hook `useCalculationAvailableFields`.
- El endpoint devuelve **solo secciones anteriores**. Las preguntas numéricas previas de la **propia sección** se combinan localmente (`ownSectionFields`, `value.slice(0, index)` en el builder).
- El contexto (`CalculationPickerContext`: nivel, `parentId`, `order`, `excludeSectionId`) lo arma `sections-form.tsx` y baja por builder → card → type-fields → `SectionCalculatedFieldEditor`. Sin contexto, o si el endpoint carga/falla, se usa la lista local.
- **No sirve** para el `if.field_id` del condicional (cualquier tipo): ese picker usa la lista local como `depends_on`.
- Catálogo de formulario → exento de botón de refresh.

## Editor
`section-formula-expression-editor.tsx`: textarea monoespaciado; al tipear `@` (o botón "Insertar pregunta") abre lista filtrable (↑/↓/Enter/Tab/Esc), inserta `@field_id `. Chips debajo por token (rojo si es desconocido/inválido). Validación cliente en `validate-calculation-config.ts` (`emptyExpression`, `unbalancedParentheses`, `termNotFound|SelfReference|NotNumeric|Ambiguous`); la validación autoritativa es la del backend (mostrar el `detail` del 400).

## Runtime
- No se pueden responder: `PATCH .../form_values` y `.../form_answer` devuelven 400 si se intenta. Mostrar de solo lectura.
- Se recalculan al guardar cualquier campo del que dependan, en toda la ejecución.
- `form_values` (batch) refleja el recálculo de **todas** las secciones en la respuesta. `form_answer` (una pregunta a la vez) solo refleja la sección actual: si el campo de entrada alimenta un calculado de **otra** sección, hay que refrescar esa sección aparte.
- `GET /question_types/` expone ambos (condicional con `data_type: null`).

## Errores comunes
- Mandar `terms[]`/`constant` (formato viejo) → 400.
- Editar `fields` a mano o con duplicados → inconsistente con `expression`.
- Quitar el `@` de los tokens al guardar → el editor no reconstruye los chips.
- Enviar `calculation_config` en un tipo no calculado → 400 (se limpia a `null` al cambiar de tipo).
- Usar `available_fields` para el picker del condicional.
- Asumir que el front calcula el valor.

## Checklist
- [ ] `data_type: "decimal"` en la fórmula.
- [ ] `fields` derivado de `expression`, sin duplicados.
- [ ] Config legada convertida al abrir.
- [ ] Referencias solo a preguntas anteriores/numéricas (fórmula).
- [ ] Textos en `src/i18n/locales/sections.ts` (`form.formFields.calculated.*`).
- [ ] `npx tsc -p tsconfig.app.json --noEmit` limpio.
