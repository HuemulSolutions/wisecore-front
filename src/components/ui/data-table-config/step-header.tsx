import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StepHeaderProps {
  number: number;
  title: string;
  done?: boolean;
  /** Fila fantasma: el paso todavía no se habilita (no hay fuente). */
  ghost?: boolean;
  summary?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

/** Cabecera de un paso numerado: círculo (número → ✓ al completarse), título, resumen y link de acción. */
export function StepHeader({ number, title, done, ghost, summary, actionLabel, onAction }: StepHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2.5', ghost && 'opacity-50')}>
      <span
        className={cn(
          'flex size-[22px] shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          ghost
            ? 'border border-[#cbd5e1] text-[#94a3b8]'
            : done
              ? 'bg-[#eefaf1] text-[#16a34a]'
              : 'bg-[#eff4ff] text-[#2563eb]',
        )}
      >
        {done && !ghost ? <Check className="size-3.5" strokeWidth={3} /> : number}
      </span>
      <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
      {summary && !ghost && <span className="min-w-0 truncate text-xs text-[#94a3b8]">{summary}</span>}
      {actionLabel && onAction && !ghost && (
        <button
          type="button"
          onClick={onAction}
          className="ml-auto shrink-0 text-xs font-medium text-[#2563eb] hover:underline hover:cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
