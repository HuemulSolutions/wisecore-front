import type { ReactNode } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { cn } from '@/lib/utils';
import type { SectionToneClasses } from '@/lib/lifecycle-colors';
import { HOME_CARD } from './home-surface';
import type { HomeWorkGroupCount, HomeWorkGroupRow as HomeWorkGroupRowData } from '@/types/home';

export interface HomeWorkGroupCardProps {
  accent: SectionToneClasses;
  /** Clase de color del punto de 7px de la cabecera (`toneDot(hue)`). */
  dotClass: string;
  title: string;
  /** Criterio de orden — se omite mientras carga o si el grupo falló. */
  meta?: string;
  /** `null` = todavía no llegó el conteo (píldora omitida, no "0"). */
  count: HomeWorkGroupCount | null;
  rows: HomeWorkGroupRowData[];
  renderRow: (row: HomeWorkGroupRowData) => ReactNode;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Pie del grupo: link si hay `onClick`, texto plano si no (sin `listExecutions` no hay adónde saltar). */
  footer?: { label: string; onClick?: () => void };
  /** Grupo en 0 pero otros grupos sí tienen datos — se reemplaza la card por una línea con check verde. */
  emptyLabel?: string;
}

/**
 * Card de grupo de la pestaña "Mi trabajo" — genérica y reusable por los 3
 * grupos con datos reales ("Esperan tu revisión", "Esperan tu aprobación",
 * "Tus aprobados"; ver `useMyWork`). El color vive solo en la cabecera: el
 * cuerpo es blanco para que las filas se lean igual en los tres grupos.
 */
export function HomeWorkGroupCard({
  accent,
  dotClass,
  title,
  meta,
  count,
  rows,
  renderRow,
  isLoading,
  error,
  onRetry,
  footer,
  emptyLabel,
}: HomeWorkGroupCardProps) {
  const { t } = useTranslation('home');

  // Grupo vacío con hermanos que sí tienen datos: una línea de 38px, nunca una
  // card vacía grande.
  if (!isLoading && !error && rows.length === 0 && emptyLabel) {
    return (
      <div className={cn(HOME_CARD, 'flex h-[38px] items-center gap-[9px] px-[15px] text-[12.5px] text-muted-foreground')}>
        <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" strokeWidth={2.6} />
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn(HOME_CARD, 'overflow-hidden')}>
      <div className={cn('flex items-center gap-2.5 border-b px-[15px] py-3', accent.surface, accent.headerBorder)}>
        <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', dotClass)} />
        <span className="truncate text-[13.5px] font-semibold text-foreground">{title}</span>
        {error ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-semibold text-muted-foreground">—</span>
        ) : (
          count && (
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums', accent.pill)}>
              {count.exact ? count.value : t('workGroups.common.countApprox', { count: count.value })}
            </span>
          )
        )}
        <span className="flex-1" />
        {meta && !isLoading && !error && <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>}
      </div>

      {error ? (
        <div className="flex items-center gap-2.5 px-[15px] py-4">
          <AlertCircle className="h-[15px] w-[15px] shrink-0 text-destructive" />
          <span className="text-[12.5px] text-muted-foreground">{t('workGroups.common.errorTitle')}</span>
          {onRetry && <HuemulButton variant="outline" size="sm" className="h-7 shrink-0" label={t('common:retry')} onClick={onRetry} />}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3 px-[15px] py-3.5">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-[9px] w-[78%] animate-pulse rounded-full bg-muted" />
              <div className="h-[9px] w-[60%] animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {rows.map((row) => renderRow(row))}
          {footer &&
            (footer.onClick ? (
              <button
                type="button"
                onClick={footer.onClick}
                className="block w-full border-t border-divider px-[15px] py-2.5 text-left text-[12.5px] font-medium text-primary hover:cursor-pointer hover:bg-muted"
              >
                {footer.label}
              </button>
            ) : (
              <p className="border-t border-divider px-[15px] py-2.5 text-xs text-muted-foreground">{footer.label}</p>
            ))}
        </>
      )}
    </div>
  );
}
