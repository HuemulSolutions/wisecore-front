import { labelForField } from '@/lib/data-table-catalog-labels';
import { applyPreviewLabels } from '@/lib/data-table-node-utils';
import type { DataTableColumnSpec, DataTableResolvedTable, DataTableSourceDef } from '@/types/data-table-resolve';

export interface PreviewDisplayTable {
  headers: string[];
  rows: string[][];
}

/** Tabla `ok` ya con los nombres de columna del usuario aplicados (los usa también el snapshot). */
export function buildDisplayTable(
  table: DataTableResolvedTable | null,
  sourceDef: DataTableSourceDef | undefined,
  columns: DataTableColumnSpec[],
  t: (key: string) => string,
): PreviewDisplayTable | null {
  if (!table || table.status !== 'ok' || !sourceDef) return null;
  const names = columns.map((col) => {
    const field = sourceDef.fields.find((f) => f.id === col.id);
    return col.label?.trim() || (field ? labelForField(t, field) : col.id);
  });
  return applyPreviewLabels(table, columns, names, table.omitted_columns, sourceDef.layout);
}
