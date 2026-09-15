# Wisecore — Guía de tooltips y texto recortado

Todo tooltip de la app es el atributo `title=` nativo de HTML. No existe primitivo Radix Tooltip: `src/components/ui/tooltip.tsx` fue eliminado. Read `rbac-permissions-guide.md` (botón sin permiso) and `refresh-button-guide.md` for related conventions.

## 0. Árbol de decisión

```
¿Hace falta mostrar información al pasar el mouse?
├─ ¿El contenido es texto plano (una o varias líneas)?
│   ├─ ¿El disparador es un HuemulButton?      → prop tooltip= (§1)
│   ├─ ¿El disparador es un ToolbarButton
│   │  del editor Plate?                       → prop tooltip= (§1)
│   ├─ ¿El disparador es un SidebarMenuButton? → prop tooltip= (solo colapsado) (§1)
│   ├─ ¿El disparador es un icono lucide
│   │  suelto (<svg>)?                         → <span title> envolvente (§3)
│   ├─ ¿El texto es el mismo que ya se ve,
│   │  pero recortado (truncate/line-clamp)?   → HuemulTruncatedText / useOverflowTitle (§2)
│   └─ cualquier otro elemento HTML            → title= directo (§1)
├─ ¿El contenido es JSX real (imagen, links,
│  layout propio, no solo texto)?              → HoverCard, NO tooltip (§5)
└─ ¿El disparador está deshabilitado y el texto
   explica POR QUÉ está bloqueado?             → title + texto visible de respaldo (§6)
```

## 1. La regla: `title=` nativo, siempre

**Regla:** cualquier ayuda contextual al pasar el mouse se implementa con el atributo `title` de HTML. No se instala ni se reintroduce ninguna librería de tooltips (Radix, Base UI, Ariakit u otra).

Por qué: cero JavaScript, cero portal, cero provider, cero z-index, y funciona en cualquier punto del árbol sin contexto previo. Los 12 `TooltipProvider` que había montados en la app (`app-layout.tsx`, `sidebar.tsx`, `plate-editor.tsx`, entre otros) desaparecieron.

Atajos que ya existen y hay que usar en vez de escribir `title` a mano:

```tsx
// ✅ HuemulButton: la prop `tooltip` se mapea a `title` internamente
//    (huemul-button.tsx). Cuando el botón está disabled/loading, el componente
//    lo envuelve en un <span title> para que el hover siga llegando.
<HuemulButton variant="ghost" size="icon" icon={RefreshCw} tooltip={t("common:refresh")} />

// ✅ ToolbarButton del editor Plate: idéntico, vía withTooltip (toolbar.tsx)
<ToolbarButton tooltip={t('toolbar.bold')}>…</ToolbarButton>

// ✅ SidebarMenuButton: solo se muestra con el sidebar colapsado (sidebar.tsx)
<SidebarMenuButton tooltip={item.title} asChild>…</SidebarMenuButton>

// ✅ Cualquier otro elemento HTML
<div title={t('header.applicationVersion')}>v{packageInfo.version}</div>
```

`HuemulButton` ya no acepta `tooltipSide`: `title` no permite elegir el lado del tooltip.

Un `title` explícito siempre gana sobre `tooltip`: si necesitas comportamiento distinto al default, pasa `title` en vez de `tooltip`.

## 2. Texto recortado: `title` solo cuando hay overflow real

**Regla:** un texto con `truncate` o `line-clamp-N` expone su contenido completo en `title` **únicamente si realmente se está recortando**. Un `title` incondicional muestra un tooltip redundante con lo que ya se lee en pantalla.

Dos herramientas, misma medición por debajo:

```tsx
// ✅ Caso dominante — un texto simple recortado
<HuemulTruncatedText text={item.name} className="text-xs font-medium" />
<HuemulTruncatedText as="p" lines={2} text={description} />

// ✅ El nodo ya lleva ref, es asChild de un menú, o tiene hijos JSX
const { ref, title } = useOverflowTitle<HTMLHeadingElement>(docTitle)
<h1 ref={ref} title={title} className="truncate text-lg font-semibold">{docTitle}</h1>
```

```tsx
// ❌ title incondicional: duplica en tooltip lo que ya se ve entero
<span className="truncate" title={title}>{title}</span>
```

`useOverflowTitle` (`src/hooks/useOverflowTitle.ts`) compara `scrollWidth > clientWidth` (truncate) y `scrollHeight > clientHeight` (line-clamp), con `ResizeObserver` sobre el nodo y su padre, callback ref para sobrevivir remontajes (mismo patrón que `src/hooks/useElementWidth.ts` y `huemul-expandable-text.tsx`) y una remedición al resolverse `document.fonts.ready`.

`HuemulTruncatedText` (`src/huemul/components/huemul-truncated-text.tsx`) acepta `lines` de 1 a 5 contra un mapa estático de clases: Tailwind v4 no genera clases construidas en runtime como `` `line-clamp-${n}` ``.

Deuda conocida: hay ~118 `title=` incondicionales sobre texto recortado en el repo (ej. `workflow-launcher-bar.tsx`). Migrarlos oportunísticamente cuando se toque el archivo; no hace falta una pasada dedicada.

## 3. `title` sobre un icono no funciona

**Regla:** `title` es un atributo global de **HTML**. Un `<svg>` (todo icono de `lucide-react`) usa un elemento hijo `<title>`, no el atributo, así que el navegador no muestra nada.

```tsx
// ❌ no muestra tooltip
<Info className="h-3 w-3" title={t("config.modelHelp")} />

// ✅
<span className="inline-flex" title={t("config.modelHelp")}>
  <Info className="h-3 w-3 text-gray-400" />
</span>
```

Si el icono está dentro de un `<button>` o de un `<Badge>` (que renderiza `<span>`), poner el `title` en ese contenedor — no hace falta el `<span>` extra.

## 4. Contenido: solo string, sin JSX ni estilos

**Regla:** `title` acepta un `string`. Nada de `<p>`, `<span className="opacity-60">` ni `capitalize`.

| Lo que había con Radix | Cómo se resuelve |
|---|---|
| Varias líneas con jerarquía | `[a, b, c].filter(Boolean).join("\n")` — `title` respeta `\n` |
| Un tramo con estilo inline | Interpolar: `` `${name} · ${label}` `` |
| `className="capitalize"` | Capitalizar en JS antes de pasar el string |
| `className="max-w-xs"` | No hay equivalente; el navegador hace wrap solo |

```tsx
// ✅ multilínea (assets-related-documents.tsx)
<div title={[other.document_name, directionHint, meta].filter(Boolean).join("\n")}>
```

## 5. Cuándo NO es un tooltip

**Regla:** si el contenido tiene layout propio (imagen, links, badges, acciones), no es un tooltip: es un **HoverCard**.

Usar `src/components/ui/hover-card.tsx`. Precedentes reales: `asset-reference-node.tsx` y `role-reference-node.tsx` (previews de una referencia dentro del editor). Esos dos **no** se migraron a `title` y no deben migrarse.

Tampoco es un tooltip de esta guía el `Tooltip` de Recharts (`huemul-area-chart.tsx`): es el tooltip del gráfico, homónimo y ajeno.

## 6. Botón deshabilitado y accesibilidad

`buttonVariants` aplica `disabled:pointer-events-none` (`button.tsx`), así que un `title` sobre un `<button disabled>` nunca recibe hover. `HuemulButton` lo resuelve solo: cuando está `disabled`/`loading` y tiene `tooltip`, lo envuelve en `<span title>`.

**Regla:** si el `title` explica **por qué** una acción está bloqueada, además del tooltip debe haber un texto visible. El `title` no existe en táctil y los lectores de pantalla lo tratan de forma inconsistente.

```tsx
// ✅ patrón de assets-execute-sheet.tsx — el motivo también se ve
<HuemulButton disabled={disabled} tooltip={disabledReason} label={t('button.execute')} />
{disabled && disabledReason && (
  <Card className="border-l-4 border-l-amber-500">
    <CardContent className="py-4">{disabledReason}</CardContent>
  </Card>
)}
```

Para botones icon-only, el `title` **no** reemplaza al `aria-label` / `<span className="sr-only">`: poner los dos.

## 7. i18n

Todo texto de `title`/`tooltip` viene de `src/i18n/locales/`. Reusar `common:refresh`, `common:close`, `common:copy`, `common:copied`, `common:edit`, `common:delete` antes de crear una clave nueva en el namespace del módulo. Ver `i18n-common-refactor-guide.md`.

```tsx
// ❌ encontrado en huemul-info-display.tsx antes de la migración
<TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>

// ✅
<button title={copied ? t("common:copied") : t("common:copy")}>
```

## Errores comunes

- ❌ Reintroducir `@radix-ui/react-tooltip`, `radix-ui` → `Tooltip`, o recrear `src/components/ui/tooltip.tsx`.
- ❌ Poner `title` directamente sobre un icono de `lucide-react` — el `<svg>` lo ignora (ver §3).
- ❌ `title` incondicional sobre un `truncate`: muestra en tooltip lo que ya se lee entero (ver §2).
- ❌ Construir `` className={`line-clamp-${n}`} `` — Tailwind v4 no genera clases dinámicas; usar el mapa estático de `HuemulTruncatedText`.
- ❌ Pasar JSX a `tooltip=` / `title=`: solo acepta `string` (ver §4).
- ❌ Usar `title` como único canal para explicar un bloqueo, sin texto visible de respaldo (ver §6).
- ❌ Reemplazar un `HoverCard` con contenido rico por un `title` (ver §5).
- ❌ `title` en un `SidebarMenuButton` sin condicionarlo a `state === "collapsed"` — expandido duplica el label visible.
- ❌ Sustituir el `aria-label`/`sr-only` de un botón icon-only por el `title`.

## Checklist final

```
[ ] El tooltip es un title= nativo (o la prop tooltip= de HuemulButton/ToolbarButton/SidebarMenuButton)
[ ] El contenido es un string; multilínea con \n, sin JSX ni clases
[ ] Si el disparador es un icono suelto, va envuelto en <span title>
[ ] Texto recortado: HuemulTruncatedText o useOverflowTitle, nunca title incondicional
[ ] Botón icon-only: además del title, tiene aria-label o sr-only
[ ] Si explica un bloqueo, el motivo también se muestra visible
[ ] El texto viene de src/i18n/locales/, reusando common: cuando aplica
[ ] Contenido rico (imagen/links/layout) → HoverCard, no title
[ ] npx tsc -p tsconfig.app.json --noEmit y eslint pasan
```
