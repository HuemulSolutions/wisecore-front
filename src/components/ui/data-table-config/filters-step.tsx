import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { hintForFilter, labelForFilter, labelForFilterOption } from '@/lib/data-table-catalog-labels';
import type { DataTableFilterDef } from '@/types/data-table-resolve';

interface FiltersStepProps {
  filterDefs: DataTableFilterDef[];
  filters: Record<string, string[]>;
  /** Setea los valores de un filtro; array vacío (o solo strings vacíos) lo elimina. */
  onChange: (filterId: string, values: string[]) => void;
}

const INPUT_CLASS =
  'h-[34px] w-full rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-[13px] text-[#0f172a] outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.14)]';

function FilterCard({
  def,
  values,
  onChange,
}: {
  def: DataTableFilterDef;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const { t } = useTranslation(['editor', 'assets']);
  const hint = hintForFilter(t, def);

  const header = (
    <div className="flex items-start gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-[#0f172a]">{labelForFilter(t, def)}</span>
        {hint && <span className="text-xs text-[#64748b]">{hint}</span>}
      </div>
      {def.kind === 'multi_enum' &&
        (values.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="shrink-0 text-xs font-medium text-[#2563eb] hover:underline hover:cursor-pointer"
          >
            {t('editor:dataTable.sheet.filterClear')}
          </button>
        ) : (
          <span className="shrink-0 text-xs text-[#94a3b8]">{t('editor:dataTable.sheet.filterAll')}</span>
        ))}
      {def.kind === 'boolean' && (
        <Switch
          checked={values[0] === 'true'}
          onCheckedChange={(checked) => onChange(checked ? ['true'] : [])}
          className="h-[22px] w-[38px] data-[state=checked]:bg-[#2563eb] data-[state=unchecked]:bg-[#cbd5e1]"
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#e2e8f0] px-3.5 py-3">
      {header}

      {def.kind === 'multi_enum' && (
        <div className="flex flex-wrap gap-1.5">
          {(def.options ?? []).map((option) => {
            const active = values.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(active ? values.filter((v) => v !== option.value) : [...values, option.value])}
                className={cn(
                  'flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors hover:cursor-pointer',
                  active
                    ? 'border-[#bcd0fb] bg-[#eff4ff] text-[#1d4ed8]'
                    : 'border-[#e2e8f0] bg-white text-[#334155] hover:border-[#cbd5e1]',
                )}
              >
                {active && <Check className="size-3" strokeWidth={3} />}
                {labelForFilterOption(t, def.id, option)}
              </button>
            );
          })}
        </div>
      )}

      {def.kind === 'date_range' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={values[0] ?? ''}
            onChange={(e) => onChange([e.target.value, values[1] ?? ''])}
            className={INPUT_CLASS}
          />
          <span className="text-xs text-[#64748b]">{t('editor:dataTable.sheet.dateTo')}</span>
          <input
            type="date"
            value={values[1] ?? ''}
            onChange={(e) => onChange([values[0] ?? '', e.target.value])}
            className={INPUT_CLASS}
          />
        </div>
      )}

      {def.kind === 'text' && (
        <input value={values[0] ?? ''} onChange={(e) => onChange([e.target.value])} className={INPUT_CLASS} />
      )}
    </div>
  );
}

/** Paso 3 — una tarjeta por filtro del catálogo, con el control según su `kind`. */
export function FiltersStep({ filterDefs, filters, onChange }: FiltersStepProps) {
  const { t } = useTranslation(['editor']);

  if (filterDefs.length === 0) {
    return <p className="text-xs text-[#64748b]">{t('editor:dataTable.sheet.noFiltersForSource')}</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {filterDefs.map((def) => (
        <FilterCard key={def.id} def={def} values={filters[def.id] ?? []} onChange={(values) => onChange(def.id, values)} />
      ))}
    </div>
  );
}
