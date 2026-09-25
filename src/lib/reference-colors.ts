/**
 * Tinte y paletas de color para el menú de referencias `@` y las chips que inserta
 * (activo/rol) — centraliza el cálculo que antes estaba duplicado en
 * `asset-reference-node.tsx` y `role-reference-node.tsx`, y agrega los fallbacks
 * del diseño 6c para cuando `document_type.color` / `role.color` no vienen.
 */

export interface ReferenceSwatch {
  background: string;
  color: string;
}

export interface ReferenceChipPalette extends ReferenceSwatch {
  border: string;
}

const ASSET_ROW_FALLBACK: ReferenceSwatch = { background: '#dbe7fe', color: '#1d4ed8' };
const ROLE_ROW_FALLBACK: ReferenceSwatch = { background: '#ede9fe', color: '#6d28d9' };
const ASSET_CHIP_FALLBACK: ReferenceChipPalette = { background: '#eef2ff', border: '#dcdffc', color: '#3730a3' };

function isHexColor(color?: string | null): color is string {
  return !!color && /^#[0-9a-fA-F]{6}$/.test(color);
}

/** Fondo tenue (~10% alpha) derivado de un color hex — para estilos que solo necesitan 1 tono. */
export function tintFromColor(color?: string | null): string | undefined {
  return isHexColor(color) ? `${color}1A` : undefined;
}

/** Swatch (fondo + color) del icono en una fila de ACTIVO del panel `@`, con fallback 6c. */
export function assetRowSwatch(color?: string | null): ReferenceSwatch {
  return isHexColor(color) ? { background: `${color}1A`, color } : ASSET_ROW_FALLBACK;
}

/** Swatch del icono en una fila de ROL del panel `@`, con fallback 6c. */
export function roleRowSwatch(color?: string | null): ReferenceSwatch {
  return isHexColor(color) ? { background: `${color}1A`, color } : ROLE_ROW_FALLBACK;
}

/** Paleta completa (fondo/borde/texto) de la chip de activo insertada en el documento. */
export function assetChipPalette(color?: string | null): ReferenceChipPalette {
  if (!isHexColor(color)) return ASSET_CHIP_FALLBACK;
  return { background: `${color}1A`, border: `${color}40`, color };
}

/** Swatch (fondo + color) de la chip de rol insertada en el documento — mismo fallback que la fila. */
export function roleChipSwatch(color?: string | null): ReferenceSwatch {
  return roleRowSwatch(color);
}
