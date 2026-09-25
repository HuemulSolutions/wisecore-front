import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { DataTablePreviewResult } from '@/contexts/document-data-context';
import type { DataTableColumnSpec, DataTableSourceDef } from '@/types/data-table-resolve';

import { buildDisplayTable } from './build-display-table';
import { PreviewTable } from './preview-table';

interface PreviewPanelProps {
  sourceDef: DataTableSourceDef | undefined;
  columns: DataTableColumnSpec[];
  title: string;
  limit: number | null;
  activeFilterCount: number;
  refreshOnApproval: boolean;
  preview: DataTablePreviewResult;
  onReorder: (from: number, to: number) => void;
  onRemoveColumn: (id: string) => void;
  onAddColumn: (id: string) => void;
  onClearFilters: () => void;
}

function Notice({
  tone,
  title,
  children,
  action,
}: {
  tone: 'amber' | 'red';
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg border px-3.5 py-3 text-[13px]',
        tone === 'amber' ? 'border-[#fde68a] bg-[#fffbeb] text-[#78350f]' : 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
      )}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <p className="text-xs">{children}</p>}
      {action}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-6" />
      ))}
    </div>
  );
}

function GhostGrid({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-px rounded-md border border-dashed border-[#cbd5e1] p-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={cn('h-5 rounded-sm', i < 4 ? 'bg-[#eef1f5]' : 'bg-[#f6f7f9]')} />
        ))}
      </div>
      <p className="text-center text-[13px] text-[#64748b]">{message}</p>
    </div>
  );
}

/** Columna derecha del sheet — vista previa con datos reales y edición directa de columnas/filas. */
export function PreviewPanel({
  sourceDef,
  columns,
  title,
  limit,
  activeFilterCount,
  refreshOnApproval,
  preview,
  onReorder,
  onRemoveColumn,
  onAddColumn,
  onClearFilters,
}: PreviewPanelProps) {
  const { t } = useTranslation(['editor', 'assets']);
  const tt = t as unknown as (key: string) => string;
  const table = preview.table;

  const display = React.useMemo(
    () => buildDisplayTable(preview.table, sourceDef, columns, tt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preview.table, sourceDef, columns, t],
  );

  // Posición visible → índice real en `columns` (las omitidas por el backend no se pintan).
  const visibleIndexes = React.useMemo(() => {
    const omitted = table?.omitted_columns ?? [];
    return columns.map((_, i) => i).filter((i) => !omitted.includes(columns[i].id));
  }, [columns, table]);

  const editable =
    !!sourceDef &&
    !!display &&
    (sourceDef.layout === 'keyValue' ? display.rows.length : display.headers.length) === visibleIndexes.length;

  const availableFields = (sourceDef?.fields ?? []).filter((f) => !columns.some((c) => c.id === f.id));

  const handleReorder = (from: number, to: number) => {
    const a = visibleIndexes[from];
    const b = visibleIndexes[to];
    if (a !== undefined && b !== undefined) onReorder(a, b);
  };
  const handleRemove = (visibleIndex: number) => {
    const real = visibleIndexes[visibleIndex];
    if (real !== undefined) onRemoveColumn(columns[real].id);
  };

  let body: React.ReactNode;
  if (!sourceDef) {
    body = <GhostGrid message={t('editor:dataTable.preview.noSource')} />;
  } else if (columns.length === 0) {
    body = (
      <div className="flex flex-col gap-1 py-6 text-center">
        <p className="text-sm font-semibold text-[#0f172a]">{t('editor:dataTable.preview.noColumnsTitle')}</p>
        <p className="text-[13px] text-[#64748b]">{t('editor:dataTable.preview.noColumnsBody')}</p>
      </div>
    );
  } else if (!preview.hasDocument) {
    body = <p className="text-[13px] text-[#64748b]">{t('editor:dataTable.preview.noContext')}</p>;
  } else if (preview.isError && !table) {
    body = (
      <Notice
        tone="red"
        title={t('editor:dataTable.preview.errorTitle')}
        action={
          <button
            type="button"
            onClick={preview.refetch}
            className="mt-1 self-start text-xs font-semibold underline hover:cursor-pointer"
          >
            {t('editor:dataTable.preview.retry')}
          </button>
        }
      />
    );
  } else if (!table) {
    body = <SkeletonTable />;
  } else if (table.status === 'forbidden') {
    body = (
      <Notice tone="amber" title={t('editor:dataTable.preview.forbiddenTitle')}>
        {table.message}
      </Notice>
    );
  } else if (table.status === 'unavailable_source') {
    body = (
      <Notice tone="red" title={t('editor:dataTable.preview.unavailableTitle')}>
        {table.message}
      </Notice>
    );
  } else if (table.status === 'error') {
    body = (
      <Notice
        tone="red"
        title={t('editor:dataTable.preview.errorTitle')}
        action={
          <button
            type="button"
            onClick={preview.refetch}
            className="mt-1 self-start text-xs font-semibold underline hover:cursor-pointer"
          >
            {t('editor:dataTable.preview.retry')}
          </button>
        }
      >
        {table.message}
      </Notice>
    );
  } else if (display) {
    body = (
      <div className="flex flex-col gap-2.5">
        <PreviewTable
          layout={sourceDef.layout}
          headers={display.headers}
          aligns={table.aligns}
          rows={display.rows}
          availableFields={availableFields}
          editable={editable}
          onReorder={handleReorder}
          onRemove={handleRemove}
          onAdd={onAddColumn}
        />
        {table.rows.length === 0 && (
          <p className="text-[13px] text-[#64748b]">
            {t('editor:dataTable.preview.noRows')}{' '}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClearFilters}
                className="font-medium text-[#2563eb] hover:underline hover:cursor-pointer"
              >
                {t('editor:dataTable.preview.removeFilters')}
              </button>
            )}
          </p>
        )}
        {table.truncated && (
          <p className="text-xs text-[#64748b]">
            {t('editor:dataTable.preview.truncated', { count: limit ?? table.rows.length, total: table.total_rows })}
          </p>
        )}
        {table.omitted_columns.length > 0 && table.message && (
          <Notice tone="amber">{table.message}</Notice>
        )}
        <p className="text-xs text-[#94a3b8]">
          {sourceDef.layout === 'keyValue'
            ? t('editor:dataTable.preview.helpKeyValue')
            : t('editor:dataTable.preview.helpRows')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold tracking-wide text-[#64748b] uppercase">
          {t('editor:dataTable.preview.title')}
        </span>
        <span className="text-xs text-[#94a3b8]">{t('editor:dataTable.preview.subtitle')}</span>
        <button
          type="button"
          onClick={preview.refetch}
          disabled={!preview.enabled}
          title={t('editor:dataTable.preview.recalculate')}
          className="ml-auto flex h-7 items-center gap-1.5 rounded-md border border-[#d7dde5] bg-white px-2 text-xs font-medium text-[#334155] hover:cursor-pointer hover:bg-[#f8fafc] disabled:opacity-50 disabled:hover:cursor-not-allowed"
        >
          <RefreshCw className={cn('size-3.5', preview.isFetching && 'animate-spin')} />
          {t('editor:dataTable.preview.recalculate')}
        </button>
      </div>

      <div className="rounded-xl border border-[#e6e9ee] bg-white p-[22px]">
        {title.trim() && <p className="mb-3 text-[15px] font-semibold text-[#0f172a]">{title.trim()}</p>}
        {body}
      </div>

      <div className="rounded-xl border border-[#e6e9ee] bg-white p-4">
        <p className="mb-3 text-[13px] font-semibold text-[#0f172a]">{t('editor:dataTable.preview.freshnessTitle')}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="font-medium text-[#334155]">{t('editor:dataTable.preview.freshnessEditor')}</span>
          <span className="text-[#64748b]">{t('editor:dataTable.preview.freshnessEditorBody')}</span>
          <span className="font-medium text-[#334155]">{t('editor:dataTable.preview.freshnessExport')}</span>
          <span className="text-[#64748b]">
            {refreshOnApproval
              ? t('editor:dataTable.preview.freshnessExportOn')
              : t('editor:dataTable.preview.freshnessExportOff')}
          </span>
        </div>
      </div>
    </div>
  );
}
