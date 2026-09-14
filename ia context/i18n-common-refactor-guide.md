# Wisecore — Guide for Moving Translations to `common.ts`

This document describes the process for identifying translations in a locale file that are generic enough to live in `common.ts` and consolidating them there, so they can be reused across namespaces without redefinition.

---

## 0. Decision tree — should a key move to `common.ts`?

```
Is the translation value identical to an existing key in common.ts?
  └─ YES → Exact duplicate. Remove from the locale file and use common:.

Is the string a generic UI action or state word (no domain noun)?
  Examples: "Close", "Execute", "Export", "Select all", "Previous", "Next",
            "Loading...", "Exporting...", "Executing...", "Saving..."
  └─ YES → Move to common.ts

Does the string mention a specific entity or feature?
  Examples: "Loading assets...", "Export to Excel", "Select a template..."
  └─ YES → Keep in the locale file. It is domain-specific.

Is the string used (or likely to be used) in more than one module?
  └─ YES → Move to common.ts
  └─ NO  → Keep in the locale file unless it is clearly a generic word.
```

---

## 1. Locate candidates in a locale file

Open the target locale file (e.g. `src/i18n/locales/foo.ts`) and scan for:

1. **Exact duplicates** — strings whose `en`/`es` values match a key already in `common.ts`.
2. **Generic action words** — verbs / loading states / UI control labels that contain no domain noun.
3. **Pagination words** — "Previous", "Next", "Page", "of" (consider `common.pagination`).

Cross-reference against the current `common.ts` keys:

```
refresh · save · saving · cancel · delete · deleting · create · creating
update · updating · configure · configuring · tryAgain · close · edit · done · add
execute · executing · export · exporting · selectAll · previous · next
actions · name · email · status · yes · no · search
active · inactive · pending · configured · notConfigured
configureProvider · updateProvider · dataRefreshed · refreshFailed
accessDenied · noPermission · pickDate · selectPlaceholder · searchPlaceholder
noResults · loadMore · loading · loadingMore · noMoreResults
pagination.{ itemsPerPage · page · of · items }
relativeTime.{ justNow · minutesAgo · hoursAgo · yesterday }
```

If the new key is not in the list above, add it to `common.ts` before removing it from the locale file.

---

## 2. Step-by-step process

### Step 1 — Add missing keys to `common.ts`

Edit `src/i18n/locales/common.ts` and add the new key in the appropriate alphabetical / thematic position.

```ts
// Example: adding "close" after tryAgain
tryAgain: { en: "Try Again", es: "Reintentar" },
close: { en: "Close", es: "Cerrar" },
```

### Step 2 — Remove the key from the locale file

Delete the key from `src/i18n/locales/<module>.ts`. If removing a key leaves an object empty, remove the whole object. Do not leave empty `{}` entries.

### Step 3 — Find every component that uses the removed key

Search for the key string in `src/`:

```
"t("<module>.<removedKey>")"
```

Each match is a component that needs updating.

### Step 4 — Update `useTranslation` in each component

If the component uses only one namespace, change it to an array that includes `"common"`:

```ts
// Before
const { t } = useTranslation("advanced")

// After
const { t } = useTranslation(["advanced", "common"])
```

If it already uses an array, just append `"common"` if not already present.

### Step 5 — Replace the translation call

```ts
// Before
t("changeHistory.loading")

// After
t("common:loading")
```

The pattern is always `t("common:<key>")` — namespace prefix with a colon.

---

## 3. Complete example

**Scenario:** `advanced.ts` defines `changeHistory.loading = { en: "Loading...", es: "Cargando..." }` which is identical to `common.loading`.

**`src/i18n/locales/advanced.ts`** — remove the key:
```ts
// Before
changeHistory: {
  loading: { en: "Loading...", es: "Cargando..." },
  empty: { ... },
}

// After
changeHistory: {
  empty: { ... },
}
```

**`src/components/execution/change-history-panel.tsx`** — update namespace and call:
```ts
// Before
const { t } = useTranslation("advanced")
// ...
{t("changeHistory.loading")}

// After
const { t } = useTranslation(["advanced", "common"])
// ...
{t("common:loading")}
```

---

## 4. Multi-component files

Some files export multiple components, each with their own `useTranslation` call. Only update the specific component function that used the removed key — do not blindly replace all occurrences of `useTranslation("module")` in the file.

Use surrounding context (the function name or the JSX) to identify the right call site.

---

## 5. Validation checklist

```
[ ] New key added to common.ts with correct en/es values
[ ] Key removed from locale file — no empty objects left behind
[ ] All components that used the removed key have been found (grep)
[ ] Each affected component now uses useTranslation(["<module>", "common"])
[ ] Translation calls updated to t("common:<key>")
[ ] No TypeScript / lint errors in modified files
[ ] No broken ternary or JSX syntax from the replacement (check ? vs :)
```
