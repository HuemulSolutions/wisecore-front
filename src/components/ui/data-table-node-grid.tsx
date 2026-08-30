'use client';

import { useTranslation } from 'react-i18next';

import type { ResolvedDataTable } from '@/contexts/document-data-context';

/**
 * Cuerpo visual del nodo `data_table` — estados loading/vacío/no-disponible + tabla HTML.
 * Extraído de `data-table-node.tsx` para que el nodo insertado y la previsualización en vivo del
 * sheet de configuración (`data-table-config-sheet.tsx`) se pinten exactamente igual.
 */
export function DataTableNodeBody({
  resolved,
  title,
}: {
  resolved: ResolvedDataTable;
  title?: string | null;
}) {
  const { t } = useTranslation('editor');

  return (
    <div className="rounded-md border border-border bg-background p-3">
      {title && <p className="mb-2 text-sm font-semibold">{title}</p>}
      {resolved.isUnavailable ? (
        <p className="text-sm italic text-muted-foreground">{t('dataTable.states.unavailable')}</p>
      ) : resolved.isLoading ? (
        <p className="text-sm text-muted-foreground">{t('dataTable.states.loading')}</p>
      ) : resolved.isEmpty ? (
        <p className="text-sm italic text-muted-foreground">{t('dataTable.states.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {resolved.headers.map((header, i) => (
                  <th key={i} className="border border-border bg-muted/50 px-2 py-1 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resolved.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-border px-2 py-1 align-top">
                      {cell || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
