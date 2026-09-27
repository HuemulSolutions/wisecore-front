# Wisecore — Guide for the question_type → Widget Mapping (Form Fields & Custom Fields)

Use this guide whenever code needs to render an **input control for a `question_type`** (the 14-slug catalog in `QUESTION_TYPE`, `src/components/sections/question-type-meta.ts`) — whether that's answering a form field inside a section, or manually assigning a custom field's value in a template/asset.

Reference implementation: [huemul-question-input.tsx](../src/huemul/components/huemul-question-input.tsx), consumed by [asset-form-section.tsx](../src/components/assets/content/asset-form-section.tsx) and [custom-field-value-field.tsx](../src/components/custom-fields/custom-field-value-field.tsx).

---

## 0. Why this exists

Before this component existed, the `question_type → widget` mapping was duplicated in three independent `switch` statements (form runtime, custom field value entry, preview) that **drifted apart**: the custom field value entry was missing `escala_lineal` (linear scale) and `calificacion` (rating) entirely, silently falling back to a plain text box even though the custom field creation form (`custom-fields-form-fields.tsx`) fully supports configuring those types (min/max, `min_label`/`max_label`, star count).

`HuemulQuestionInput` is now the **single source of truth** for that mapping. Any new consumer that needs to render a `question_type` as an editable control must use it instead of writing a new switch.

---

## 1. When this applies

```
Need to render an EDITABLE control for a question_type/data_type pair
(answering a form field, or assigning a custom field value)?
  └─ YES → use HuemulQuestionInput. Do not write a new switch(question_type).

Need a non-interactive PREVIEW (all controls disabled, used in builders)?
  └─ YES → use QuestionTypePreview (question-type-preview.tsx) instead —
           separate component, out of scope for this guide.

Need to handle file/image upload for a question_type (carga_de_archivos, or
data_type "image")?
  └─ YES → HuemulQuestionInput does NOT cover this. Detect the type in your
           own consumer BEFORE delegating (see §3).
```

---

## 2. Contract

`HuemulQuestionInput` (`src/huemul/components/huemul-question-input.tsx`) takes:

- `questionType?: string | null` — a `QUESTION_TYPE.*` slug (or unknown/legacy).
- `dataType?: string | null` — fallback used only when `questionType` doesn't match a known slug.
- `value: string | number | boolean | string[] | null` — **typed**, not string-encoded. The shape depends on the widget: `string` (text/date/time/select/radio…), `number | null` (number/decimal/linear-scale/rating), `boolean` (yes-no/switch), `string[]` (multi-select).
- `onChange: (value) => void` — receives the same typed shape back.
- `options`, `min`, `max`, `minLabel`, `maxLabel`, `label`, `placeholder`, `error`, `disabled`.

It renders `HuemulField`/`HuemulCheckboxGroup` — the same underlying widgets the form runtime always used. It resolves the widget by `questionType` first, falling back to `dataType` for legacy/unknown `question_type` values (mirrors the original "paridad con form fields" comment).

**No i18n inside the component.** It's a `huemul-*` component — no hardcoded namespace. Callers pass `label`/`placeholder` already translated (see refactor-file-guide.md §1.2 promotion checklist).

---

## 3. What it does NOT do — files, images, and `etiqueta`

`etiqueta` (`QUESTION_TYPE.label`) is **not an editable control at all** — it's a purely
visual separator/title used to split a form section into sub-sections (`field_name` is the
title text; nothing is answered or persisted for it). It gets **no case in
`HuemulQuestionInput`**. Every consumer that loops over form fields must detect it *before*
rendering the label+input wrapper and render `SectionFieldSeparator`
(`section-field-separator.tsx`) instead — same pattern as the file/image detour below.
It's also excluded from: `isFieldAnswerable` (never answerable/counted), depends_on targets
(`section-form-fields-builder.tsx` availableDependencyFields), and the custom-fields
question_type catalog (`custom-fields-create-edit-sheet.tsx` filters it out — it's a
form-fields-only concept, custom fields can't be created as `etiqueta`).

## 3b. What it does NOT do — files and images

`fileUpload` (`carga_de_archivos`) and `data_type: "image"` are **excluded on purpose**. Each consumer has its own upload backend:

- Form runtime (`asset-form-section.tsx`): `uploadMedia` → stores a `{{MEDIA:id}}` token, with preview/broken-file handling.
- Custom fields (`custom-field-value-field.tsx`): a dedicated blob endpoint per entity (`uploadCustomFieldTemplateValueBlob` / `uploadCustomFieldDocumentValueBlob`), **images only** — there is no generic file-upload endpoint for custom fields today, so a custom field configured with `carga_de_archivos` but a non-`image` `data_type` has no real upload widget (pre-existing limitation, not something this component should paper over).

**Regla de valor para `carga_de_archivos` (form runtime):** el backend LEE cada archivo como objeto `{url, name, content_type[, media_id]}` (o el token `{{MEDIA:id}}` sin resolver si el media está roto), pero al GUARDAR (`PATCH form_values`/`form_answer`) solo acepta tokens `{{MEDIA:<uuid>}}` — cualquier otra cosa devuelve 400 `INVALID_FILE_UPLOAD_VALUE`. Por eso `asset-form-section.tsx`:

- guarda en `answers` solo tokens (`buildInitialAnswers` convierte con `fileUploadEntryToToken`, que necesita `media_id`);
- pinta desde `fileMetaByToken` (token → `{url, name, contentType}`), sembrado con `buildInitialFileMeta` y ampliado con cada subida — nunca desde `answers`;
- `resolveFileUploadRow` (`question-type-meta.ts`) es el único resolver de "qué se pinta por entrada", compartido con `FormFieldAnswerValue`;
- `validateFormFieldValue` frena con `invalidFileReference` un campo que aún tenga entradas no-token (objeto sin `media_id`), en vez de mandar un PATCH que el backend rechaza.

Pattern for a new consumer:

```tsx
if (dataType === "image" /* or your own file-type check */) {
  return <HuemulField type="file" ... />  // your own upload flow
}

// everything else delegates:
return <HuemulQuestionInput questionType={...} dataType={...} value={...} onChange={...} ... />
```

---

## 4. If your consumer's value isn't already typed

The form runtime stores answers natively typed (`AnswerMap = Record<string, unknown>`), so it passes straight through. Custom field sheets historically persist `value` as `string | string[]` (see `custom-field-value-sheet.tsx`) — that contract did **not** change. `CustomFieldValueField` is the adapter: it converts string↔typed at the boundary based on the same `questionType`/`dataType` rules `HuemulQuestionInput` uses internally (`isBooleanField`/`isNumberField` helpers). Copy that adapter pattern rather than changing `HuemulQuestionInput`'s typed contract to fit a new string-based caller.

---

## 5. Adding a new question_type

1. Add the slug to `QUESTION_TYPE` in `question-type-meta.ts`.
2. Add its widget case to `HuemulQuestionInput` (both the primary `questionType` switch and, if it needs a `data_type` fallback path, the second switch).
3. Add its config-time editor to `section-question-type-fields.tsx` (if the sections builder should offer it) and/or `custom-fields-form-fields.tsx` (if custom fields should offer it).
4. Add its non-interactive preview case to `question-type-preview.tsx`.
5. If it needs a value-adapter (non-string internal type), extend `CustomFieldValueField`'s `isBooleanField`/`isNumberField` helpers.
6. Classify its autosave trigger in `asset-form-section.tsx` (see §5b): does the user type into it character-by-character, or is one click a complete answer?

Do **not** add the case to only one of these places — that's exactly the drift this guide exists to prevent.

Exception: purely non-interactive slugs like `etiqueta` (§3) skip step 2 entirely (no
`HuemulQuestionInput` case) — they're detected per-consumer at the field-loop level instead.

---

## 5b. Autosave trigger classification

The form runtime (`asset-form-section.tsx`) does not autosave on every keystroke — that
saturated the backend when a user typed with natural pauses. Instead each field is classified
as either:

- **Free text** (`FREE_TEXT_QUESTION_TYPES` in `question-type-meta.ts`: `respuesta_corta`,
  `parrafo`, `email`, `respuesta_numerica`, `respuesta_decimal`) — there's a "value in
  progress" while typing, so it saves on **blur** (`onBlur` on the field's wrapper `<div>`,
  which catches the input's bubbled `focusout`), plus a 10s idle safety-net so a long answer
  isn't lost if the user never leaves the field, plus a flush on `pagehide`/tab-hide and on
  unmount.
- **Atomic widgets** (everything else: yes/no, radio, dropdown, multi-select, linear scale,
  rating, date, time, file upload) — one click/selection is already a complete value, so it
  saves on **change**, coalesced 400ms (so N rapid clicks in a multi-select produce one
  PATCH, not N).

`isFreeTextField(field)` (`question-type-meta.ts`) is the single classifier both `renderInput`
and the blur handler consult — do not duplicate the type list elsewhere. Unknown/legacy
`question_type` defaults to free text (the safe fallback: blur + idle net + final flush, never
silently drops a keystroke). When adding a new question_type, add its slug to
`FREE_TEXT_QUESTION_TYPES` only if the user types into it; otherwise it falls through as atomic
automatically (default `commit: true` path in `renderInput`).

---

## 6. Checklist

```
[ ] New editable question_type widget added to HuemulQuestionInput, not a local switch
[ ] File/image types detected and handled BEFORE delegating to HuemulQuestionInput
[ ] Consumer's value/onChange match HuemulQuestionInput's typed contract (adapt at the boundary if not)
[ ] question-type-preview.tsx and the relevant builder(s) updated if a new question_type was added
[ ] New question_type classified in FREE_TEXT_QUESTION_TYPES (or left atomic) per §5b
[ ] Value de carga_de_archivos enviado al backend = solo tokens {{MEDIA:id}}, nunca el objeto/URL resuelto de una lectura (§3b)
[ ] tsc --noEmit passes
```
