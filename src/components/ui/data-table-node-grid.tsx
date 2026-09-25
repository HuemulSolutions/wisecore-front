'use client';

import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ResolvedDataTable } from '@/contexts/document-data-context';

/**
 * Cuerpo visual del nodo `data_table` — estados + tabla HTML. Extraído de `data-table-node.tsx`
 * para que el nodo insertado y la previsualización en vivo del sheet de configuración
 * (`data-table-config-sheet.tsx`) se pinten exactamente igual.
 */
export function DataTableNodeBody({
  resolved,
  title,
}: {
  resolved: ResolvedDataTable;
  title?: string | null;
}) {
  const { t } = useTranslation('editor');

  const stateMessage: Record<Exclude<ResolvedDataTable['state'], 'ok' | 'empty'>, string> = {
    loading: t('dataTable.states.loading'),
    'no-context': t('dataTable.states.noContext'),
    'unavailable-source': t('dataTable.states.unavailable'),
    forbidden: t('dataTable.states.forbidden'),
    error: t('dataTable.states.error'),
  };

  return (
    <div className="rounded-md border border-border bg-background p-3">
      {title && (
        <div className="mb-2 flex items-center gap-1.5">
          <p className="text-sm font-semibold">{title}</p>
          {resolved.isStale && resolved.state !== 'loading' && (
            <RefreshCw
              className="size-3 animate-spin text-muted-foreground"
              aria-label={t('dataTable.states.stale')}
            />
          )}
        </div>
      )}

      {resolved.state === 'ok' ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {resolved.headers.map((header, i) => (
                    <th
                      key={i}
                      className={`border border-border bg-muted/50 px-2 py-1 font-medium ${
                        resolved.aligns[i] === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resolved.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`border border-border px-2 py-1 align-top ${
                          resolved.aligns[ci] === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {cell || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resolved.truncated && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t('dataTable.states.truncated', { count: resolved.rows.length, total: resolved.totalRows })}
            </p>
          )}
          {resolved.omittedColumns.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('dataTable.states.omittedColumns', { columns: resolved.omittedColumns.join(', ') })}
            </p>
          )}
        </>
      ) : resolved.state === 'empty' ? (
        <p className="text-sm italic text-muted-foreground">{t('dataTable.states.empty')}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          {stateMessage[resolved.state]}
          {resolved.state === 'error' && resolved.message ? ` — ${resolved.message}` : ''}
        </p>
      )}
    </div>
  );
}
