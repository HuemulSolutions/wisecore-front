/**
 * Nodo `data_table`: tabla que resuelve sus filas en vivo contra el caché del documento
 * (ver `document-data-context.tsx` + `data-table-sources.ts`), en vez de contenido tecleado
 * a mano como una tabla Plate normal. Mismo molde de constante + snapshot-antes-de-guardar
 * que `MERMAID_KEY` / `ensureMermaidSnapshots` en `plate-mermaid-utils.ts` — acá no hay nada
 * que subir (el "snapshot" es texto), pero el punto del pipeline y la firma async son los
 * mismos para que ambos calcen en el mismo paso de `handleSave`.
 */
import type { DataTableElement, DataTableSnapshot } from '@/types/data-table-node';

export const DATA_TABLE_KEY = 'data_table';

export type DataTableResolver = (element: DataTableElement) => { headers: string[]; rows: string[][] } | null;

export interface EnsureDataTableSnapshotsResult {
  value: unknown[];
  failed: number;
}

/**
 * Recorre el árbol y recalcula `snapshot` de cada nodo `data_table` contra `resolve`
 * (los datos frescos del documento en ese momento). `resolve` devuelve `null` cuando la
 * fuente todavía no cargó — en ese caso el nodo conserva el snapshot que ya tenía.
 */
export async function ensureDataTableSnapshots(
  nodes: unknown[],
  resolve: DataTableResolver,
): Promise<EnsureDataTableSnapshotsResult> {
  let failed = 0;

  const walk = (node: unknown): unknown => {
    if (typeof node !== 'object' || node === null) return node;
    if ('text' in node) return node;

    const el = node as Record<string, unknown>;
    const children = Array.isArray(el.children) ? (el.children as unknown[]).map(walk) : el.children;

    if (el.type !== DATA_TABLE_KEY) {
      return children === el.children ? el : { ...el, children };
    }

    try {
      const resolved = resolve(el as unknown as DataTableElement);
      if (!resolved) return { ...el, children };

      const snapshot: DataTableSnapshot = {
        headers: resolved.headers,
        rows: resolved.rows,
        capturedAt: new Date().toISOString(),
      };
      return { ...el, children, snapshot };
    } catch {
      failed += 1;
      return { ...el, children };
    }
  };

  const value = nodes.map(walk);
  return { value, failed };
}

/** Escapa `|` y saltos de línea — una celda de tabla GFM no puede tener ninguno de los dos. */
function escapeGfmCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Arma una tabla en Markdown GFM (`remarkGfm` ya registrado en `markdown-kit.ts`) a partir
 * del snapshot congelado del nodo. Sin snapshot (nodo insertado y guardado antes de resolver
 * datos) devuelve solo el título, si lo hay — nunca una tabla con cabeceras y cero filas.
 */
export function buildGfmTableMarkdown(title: string | null | undefined, snapshot: DataTableSnapshot | null | undefined): string {
  const heading = title?.trim() ? `**${title.trim()}**\n\n` : '';

  if (!snapshot || snapshot.headers.length === 0) return heading.trim();

  const headerRow = `| ${snapshot.headers.map(escapeGfmCell).join(' | ')} |`;
  const separatorRow = `| ${snapshot.headers.map(() => '---').join(' | ')} |`;
  const bodyRows = snapshot.rows.map((row) => `| ${row.map(escapeGfmCell).join(' | ')} |`);

  return `${heading}${[headerRow, separatorRow, ...bodyRows].join('\n')}`;
}
