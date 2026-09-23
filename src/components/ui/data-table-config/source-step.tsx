import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { labelForSource } from '@/lib/data-table-catalog-labels';
import type { DataTableSourceDef } from '@/types/data-table-resolve';

interface SourceStepProps {
  sources: DataTableSourceDef[];
  isLoading: boolean;
  value: string;
  onChange: (id: string) => void;
  /** Aviso tras cambiar de fuente cuando ya había una elegida. */
  changedNotice: { sourceLabel: string } | null;
  onUndo: () => void;
}

function metaFor(t: (k: string, o?: Record<string, unknown>) => string, source: DataTableSourceDef): string {
  const filters = source.filters?.length
    ? t('editor:dataTable.sheet.source.filtersCount', { n: source.filters.length })
    : t('editor:dataTable.sheet.source.noFilters');
  return source.layout === 'keyValue'
    ? t('editor:dataTable.sheet.source.metaKeyValue', { n: source.fields.length, filters })
    : t('editor:dataTable.sheet.source.metaColumns', { columns: source.fields.length, filters });
}

/** Paso 1 — una tarjeta radio por fuente del catálogo + línea fija de alcance. */
export function SourceStep({ sources, isLoading, value, onChange, changedNotice, onUndo }: SourceStepProps) {
  const { t } = useTranslation(['editor']);

  return (
    <div className="flex flex-col gap-2.5">
      <div role="radiogroup" className="flex flex-col gap-2">
        {isLoading && (
          <>
            <Skeleton className="h-[58px] rounded-[10px]" />
            <Skeleton className="h-[58px] rounded-[10px]" />
          </>
        )}
        {sources.map((source) => {
          const selected = source.id === value;
          return (
            <button
              key={source.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(source.id)}
              className={cn(
                'flex items-center gap-3 rounded-[10px] border px-3.5 py-[11px] text-left transition-colors hover:cursor-pointer',
                selected ? 'border-[#2563eb] bg-[#fbfcff]' : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]',
              )}
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-[#2563eb]' : 'border-[#cbd5e1]',
                )}
              >
                {selected && <span className="size-2 rounded-full bg-[#2563eb]" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[13.5px] font-semibold text-[#0f172a]">{labelForSource(t, source)}</span>
                <span className="text-xs text-[#64748b]">{metaFor(t, source)}</span>
              </span>
              <span className="shrink-0 rounded-md bg-[#f1f4f7] px-2 py-0.5 text-[11px] font-semibold text-[#475569]">
                {source.layout === 'keyValue'
                  ? t('editor:dataTable.sheet.source.badgeKeyValue')
                  : t('editor:dataTable.sheet.source.badgeRows')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-[#64748b]">
        <span className="rounded-md bg-[#f1f4f7] px-2 py-0.5 font-semibold text-[#334155]">
          {t('editor:dataTable.sheet.source.scopeCurrent')}
        </span>
        {t('editor:dataTable.sheet.source.scopeNote')}
      </div>

      {changedNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs text-[#1e3a8a]">
          <span className="flex-1">
            {t('editor:dataTable.sheet.source.changed', { source: changedNotice.sourceLabel })}
          </span>
          <button
            type="button"
            onClick={onUndo}
            className="shrink-0 font-semibold text-[#2563eb] hover:underline hover:cursor-pointer"
          >
            {t('editor:dataTable.sheet.source.undo')}
          </button>
        </div>
      )}
    </div>
  );
}
