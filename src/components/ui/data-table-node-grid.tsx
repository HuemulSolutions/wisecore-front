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
    <div>
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
          {/* Mismo diseño que la tabla normal del editor (`table-node.tsx`): cabecera oscura,
              celdas `p-0` con contenido en `px-3 py-2`, solo borde inferior por fila. */}
          <div className="overflow-x-auto">
            <table className="my-4 mr-0 ml-px table h-px min-w-full table-auto border-collapse border border-gray-300 text-sm">
              <tbody>
                <tr>
                  {resolved.headers.map((header, i) => (
                    <th
                      key={i}
                      className="h-full min-w-[120px] max-w-[240px] bg-gray-900 p-0 text-left font-semibold text-white"
                    >
                      <div className={`px-3 py-2 ${resolved.aligns[i] === 'right' ? 'text-right' : 'text-left'}`}>
                        {header}
                      </div>
                    </th>
                  ))}
                </tr>
                {resolved.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="h-full min-w-[120px] max-w-[240px] border-b border-gray-200 bg-background p-0 align-top"
                      >
                        <div className={`px-3 py-2 ${resolved.aligns[ci] === 'right' ? 'text-right' : 'text-left'}`}>
                          {cell || '—'}
                        </div>
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
