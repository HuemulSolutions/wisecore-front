/**
 * Firma visual compartida de las superficies de /home. Es una capa de tokens,
 * no un componente: las 4 cards de home tienen headers incompatibles entre sí
 * (colapsable con acento y píldora, título+scope, título pelado, título con
 * contador+botón X) y una de ellas (`HomeWorkGroupCard`) usa el `Collapsible`
 * como shell, así que un wrapper obligaría a cambiar el árbol.
 *
 * Si una tercera pantalla necesita esta misma firma, promover a
 * `src/huemul/components/huemul-surface-card.tsx` (CLAUDE.md) y unificar ahí
 * con `HuemulSectionCard`, que hoy diverge solo en el radio (ya convergido acá
 * a `rounded-lg`, que con `--radius: 0.625rem` es literalmente 10px, igual que
 * su `rounded-[10px]`) y en los hex de borde.
 */

/** Card del contenido principal: elevada, es la superficie primaria de la página. */
export const HOME_CARD = 'rounded-lg border border-border bg-card shadow-card';

/** Card del rail: misma geometría, sin elevación y con borde más suave — secundaria por peso, no por forma. */
export const HOME_CARD_MUTED = 'rounded-lg border border-divider bg-card';

/** Header de card: título a la izquierda, meta a la derecha. */
export const HOME_CARD_HEADER = 'flex items-center justify-between gap-2 border-b border-divider px-4 py-2.5';

/** Título de card del contenido principal. */
export const HOME_CARD_TITLE = 'truncate text-sm font-semibold text-foreground';

/** Título de card del rail — deliberadamente degradado a micro-label para que se lea como secundario. */
export const HOME_RAIL_TITLE = 'text-2xs font-semibold uppercase tracking-[0.04em] text-muted-foreground';

/** Fila dentro de una card. */
export const HOME_ROW = 'border-b border-divider px-4 py-3 last:border-b-0 hover:bg-muted';

export const HOME_ROW_TITLE = 'truncate text-sm font-medium text-foreground';
export const HOME_ROW_META = 'truncate text-xs text-muted-foreground';

/** Link/acción secundaria en texto (pie "Ver las N restantes", CTA de vacío). */
export const HOME_LINK = 'text-xs font-medium text-primary hover:cursor-pointer hover:underline';
