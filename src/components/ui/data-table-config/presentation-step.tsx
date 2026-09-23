import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const LIMIT_OPTIONS: (number | null)[] = [null, 5, 10, 25, 50];

interface PresentationStepProps {
  title: string;
  onTitleChange: (value: string) => void;
  supportsLimit: boolean;
  limit: number | null;
  onLimitChange: (value: number | null) => void;
  refreshOnApproval: boolean;
  onRefreshOnApprovalChange: (value: boolean) => void;
}

/** Paso 4 — título, máximo de filas y actualización de la copia guardada. */
export function PresentationStep({
  title,
  onTitleChange,
  supportsLimit,
  limit,
  onLimitChange,
  refreshOnApproval,
  onRefreshOnApprovalChange,
}: PresentationStepProps) {
  const { t } = useTranslation(['editor']);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="data-table-title" className="text-[13px] font-medium text-[#0f172a]">
          {t('editor:dataTable.sheet.titleLabel')}
        </label>
        <input
          id="data-table-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('editor:dataTable.sheet.titlePlaceholder')}
          className="h-[38px] w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.14)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[#0f172a]">{t('editor:dataTable.sheet.limitLabel')}</span>
        {supportsLimit ? (
          <div role="radiogroup" className="flex gap-0.5 rounded-lg bg-[#f1f4f7] p-0.5">
            {LIMIT_OPTIONS.map((option) => {
              const active = option === limit;
              return (
                <button
                  key={option ?? 'all'}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onLimitChange(option)}
                  className={cn(
                    'h-8 flex-1 rounded-md text-[13px] font-medium transition-colors hover:cursor-pointer',
                    active ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]',
                  )}
                >
                  {option ?? t('editor:dataTable.sheet.limitAll')}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#64748b]">{t('editor:dataTable.sheet.limitUnsupported')}</p>
        )}
      </div>

      <div
        role="switch"
        aria-checked={refreshOnApproval}
        tabIndex={0}
        onClick={() => onRefreshOnApprovalChange(!refreshOnApproval)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onRefreshOnApprovalChange(!refreshOnApproval);
          }
        }}
        className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] px-3.5 py-3 outline-none hover:cursor-pointer focus-visible:border-[#2563eb] focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.14)]"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[13px] font-semibold text-[#0f172a]">{t('editor:dataTable.sheet.refreshOnApproval')}</span>
          <span className="text-xs text-[#64748b]">
            {refreshOnApproval
              ? t('editor:dataTable.sheet.refreshOnApprovalOn')
              : t('editor:dataTable.sheet.refreshOnApprovalOff')}
          </span>
        </div>
        <Switch
          checked={refreshOnApproval}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none h-[22px] w-[38px] shrink-0 data-[state=checked]:bg-[#2563eb] data-[state=unchecked]:bg-[#cbd5e1]"
        />
      </div>
    </div>
  );
}
