# Wisecore — Guía de diseño/rediseño de pantallas

Punto de entrada cuando se implementa un diseño o rediseño de Figma/mockup,
se crea una pantalla nueva, o se rediseña una existente. No reemplaza a las
guías específicas de `ia context/` — apunta a cuáles leer según lo que tenga
la pantalla, y agrega la regla de idioma para textos nuevos.

## 0. Árbol de decisión

```
¿Estás implementando una pantalla/flujo nuevo o rediseñando uno existente
(varias piezas de UI a la vez: layout, tabla, filtros, sheet, permisos)?
├─ NO, es un fix puntual de un componente ya cubierto por una guía
│  específica (ej. "arreglar el refresh de este panel")
│                                    → andá directo a esa guía puntual
└─ SÍ
    ├─ 1. Recorré la tabla de §1 y leé cada guía que aplique ANTES de
    │     escribir código
    └─ 2. Cualquier texto nuevo que agregues sigue la regla de idioma
          de §2
```

## 1. Checklist de guías a consultar según lo que construyas

| Tu pantalla tiene... | Leer |
|---|---|
| Cualquier layout de página (header, sidebar, contenido) | `ia context/huemul-page-layout-guide.md` |
| Tabla + panel de detalle abierto por URL (maestro-detalle) | `ia context/list-detail-panel-guide.md` |
| Una pieza de detalle que se muestra como página propia Y/o como sheet ancho | `ia context/detail-surface-guide.md` |
| Botón de filtros + panel lateral + chips | `ia context/filter-panel-guide.md` |
| Datos que vienen de un GET al backend (prácticamente toda pantalla) | `ia context/refresh-button-guide.md` |
| Cualquier control de acceso (mostrar/ocultar, habilitar/deshabilitar por rol) | `ia context/rbac-permissions-guide.md` |
| Endpoints nuevos o modificados para alimentar la pantalla | `ia context/new-endpoints-guide.md` |
| Un módulo nuevo desde cero (no una pantalla suelta) | `ia context/new-module-guide.md` |
| Un rediseño de un módulo ya existente | `ia context/refactor-module-guide.md` |
| Textos visibles en UI (toda pantalla) | `ia context/i18n-common-refactor-guide.md` + regla de §2 de esta guía |
| Opción nueva en el menú del header (settings / usuario) | `ia context/header-menu-guide.md` |
| Un `z-index`, header/banner sticky o toolbar flotante del editor Plate | `ia context/z-index-layering-guide.md` |
| Edición + eliminación de una entidad en el mismo sheet | `ia context/danger-zone-sheet-guide.md` |
| Un cambio editable que se acumula y se guarda desde el footer de un sheet | `ia context/sheet-footer-batch-save-guide.md` |
| Fijar una fila recién creada al tope de una tabla paginada | `ia context/pin-newly-created-row-guide.md` |
| Un input para responder un `question_type` o asignar un custom field | `ia context/question-type-input-guide.md` |
| Persistencia de estado de UI entre recargas (carpetas expandidas, modo de vista, anchos de columna) | `ia context/persistencia-estado-ui-guide.md` |
| Creación inline de una entidad relacionada desde un sheet de asignación | `ia context/inline-create-entity-in-sheet-guide.md` |
| Un link para compartir a pantalla completa sin header/nav | `ia context/fullscreen-share-route-guide.md` |
| Una entidad plana agrupada en carpetas dentro de una tabla, con drag & drop | `ia context/tabla-agrupada-drag-and-drop-guide.md` |
| Tooltips, ayudas contextuales al hover, o texto recortado (`truncate`/`line-clamp`) | `ia context/tooltip-guide.md` |

Si la tarea toca varias filas, leé todas las guías que apliquen antes de
empezar — es la misma regla que ya establece CLAUDE.md, esta tabla solo la
hace más fácil de recorrer cuando el disparador es "un diseño nuevo" y no
una tarea puntual.

## 2. Idioma neutro en textos nuevos — sin voseo argentino

**Regla:** ningún texto nuevo en `src/i18n/locales/*.ts` (valor `es`) puede
usar voseo argentino. Nunca `vos`, `tenés`, `podés`, `sabés`, ni un
imperativo conjugado en vos (`Buscá`, `Guardá`, `Creá`, `Descartá`, `Elegí`,
`Ingresá`, `Seleccioná`, etc.).

**Convención vigente en el proyecto** (verificada por grep sobre todo
`src/i18n/locales/`, no es una regla nueva — ya es lo que domina el resto
del código):

- **Acciones, labels, placeholders, botones** → infinitivo:
  `"Buscar entre las plantillas de la organización"`,
  `"Agregar condición"`, `"Seleccionar una sección…"`.
- **Frases narrativas dirigidas al usuario** (empty states, hints,
  descripciones) → segunda persona **tú**, nunca vos:
  `"Explora los activos de la organización"` (`home.ts:163`),
  `"Revisiones, aprobaciones y comentarios aparecen en esta lista en
  cuanto tu equipo empiece a mover activos"` (`home.ts:158`).

Ejemplos reales corregidos en `asset-types.ts`:

```ts
// ❌ Antes (voseo)
subtitle: { en: "Search among the organization's templates", es: "Buscá entre las plantillas de la organización" },
refreshBlockedByDirty: { en: "Discard or save your changes first", es: "Descartá o guardá los cambios antes de refrescar" },

// ✅ Después (infinitivo, consistente con el resto del archivo)
subtitle: { en: "Search among the organization's templates", es: "Buscar entre las plantillas de la organización" },
refreshBlockedByDirty: { en: "Discard or save your changes first", es: "Descartar o guardar los cambios antes de refrescar" },
```

Antes de dar por cerrado un texto nuevo, releelo en voz alta reemplazando
mentalmente el verbo por su forma en "vos" — si conjugás distinto de como
lo escribiste, está en voseo y hay que corregirlo.

## Errores comunes

- ❌ Escribir un placeholder o botón nuevo como imperativo en vos
  (`"Buscá…"`, `"Creá…"`) en vez de infinitivo (`"Buscar…"`, `"Crear…"`).
- ❌ Mezclar vos y tú en el mismo módulo o incluso en el mismo objeto de
  traducciones — la convención del proyecto es infinitivo + tú, nunca vos.
- ❌ Implementar una pantalla nueva sin revisar la tabla de §1 primero y
  descubrir a mitad de camino que falta el botón de refresh, el RBAC, o el
  patrón de maestro-detalle correcto.
- ❌ Copiar textos hardcodeados del mockup/Figma tal cual, sin pasarlos por
  `src/i18n/locales/` ni ajustarlos a la convención de idioma neutro.

## Checklist final

```
[ ] Recorrí la tabla de §1 y leí cada guía que aplica a esta pantalla
[ ] Todo texto visible viene de src/i18n/locales/ (ninguno hardcodeado)
[ ] Ningún texto nuevo usa voseo argentino (vos/tenés/podés/imperativo en vos)
[ ] Acciones/labels en infinitivo, frases narrativas en tú
[ ] Layout usa HuemulPageLayout, no una estructura ad-hoc
[ ] Toda superficie con datos del backend tiene botón de refresh
[ ] Permisos vía useUserPermissions/ProtectedComponent, no lógica propia
[ ] npx tsc -p tsconfig.app.json --noEmit y eslint pasan
```
