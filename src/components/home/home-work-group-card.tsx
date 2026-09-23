import type { ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { cn } from '@/lib/utils';
import type { SectionToneClasses } from '@/lib/lifecycle-colors';
import { HOME_CARD, HOME_CARD_MUTED, HOME_CARD_TITLE, HOME_LINK } from './home-surface';
import type { HomeWorkGroupCount, HomeWorkGroupRow as HomeWorkGroupRowData } from '@/types/home';

export interface HomeWorkGroupCardProps {
  accent: SectionToneClasses;
  title: string;
  /** "Ordenado por antigüedad" — se omite mientras carga. */
  meta?: string;
  /** `null` = todavía no llegó `useDocumentStatistics` (píldora vacía, no "0" — ver §6 del diseño). */
  count: HomeWorkGroupCount | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  rows: HomeWorkGroupRowData[];
  renderRow: (row: HomeWorkGroupRowData) => ReactNode;
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Pie del grupo: link si hay `onClick`, texto plano si no (sin `listExecutions` no hay adónde saltar). */
  footer?: { label: string; onClick?: () => void };
  /** Grupo en 0 pero otros grupos sí tienen datos — colapsa a una línea con check verde. */
  emptyCollapsedLabel?: string;
}

/**
 * Card de grupo de la pestaña "Mi trabajo" — genérica y reusable por los 3
 * grupos con datos reales ("Esperando tu revisión", "Esperan tu aprobación",
 * "Aprobados, listos para publicar"; ver `useMyWork`). El cuarto grupo del
 * diseño ("Comentarios que te mencionan") sigue sin backend y no se monta.
 */
export function HomeWorkGroupCard({
  accent,
  title,
  meta,
  count,
  collapsed,
  onToggleCollapse,
  rows,
  renderRow,
  isLoading,
  error,
  onRetry,
  footer,
  emptyCollapsedLabel,
}: HomeWorkGroupCardProps) {
  const { t } = useTranslation('home');

  // Grupo vacío con hermanos que sí tienen datos: 1 línea de 36px, nunca un
  // card vacío grande (ver §3 "Grupo vacío" del diseño).
  if (!isLoading && !error && rows.length === 0 && emptyCollapsedLabel) {
    return (
      <div className={cn(HOME_CARD_MUTED, 'flex h-9 items-center gap-2 px-4 text-xs text-muted-foreground')}>
        <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
        {emptyCollapsedLabel}
      </div>
    );
  }

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={() => onToggleCollapse()}
      className={cn(HOME_CARD, 'overflow-hidden border-l-[3px] transition-shadow hover:shadow-card-raised', accent.accentBorder)}
    >
      <div className={cn('flex items-center justify-between gap-2 border-b px-4 py-2.5', accent.surface, accent.headerBorder)}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex min-w-0 items-center gap-2 hover:cursor-pointer">
            <ChevronDown
              className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', collapsed && '-rotate-90', accent.text)}
            />
            <span className={HOME_CARD_TITLE}>{title}</span>
            {error ? (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground">—</span>
            ) : (
              count && (
                <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums', accent.pill)}>
                  {count.exact ? count.value : t('workGroups.common.countApprox', { count: count.value })}
                </span>
              )
            )}
          </button>
        </CollapsibleTrigger>
        <div className="flex shrink-0 items-center gap-2">
          {meta && !isLoading && <span className="text-xs text-muted-foreground">{meta}</span>}
        </div>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        {error ? (
          <div className="flex items-center justify-between gap-2 px-4 py-4">
            <span className="text-xs text-muted-foreground">{t('workGroups.common.errorTitle')}</span>
            {onRetry && <HuemulButton variant="outline" size="sm" label={t('common:retry')} onClick={onRetry} />}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3 px-4 py-3.5">
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
                  className={cn('block w-full border-t border-divider px-4 py-2.5 text-left', HOME_LINK)}
                >
                  {footer.label}
                </button>
              ) : (
                <p className="border-t border-divider px-4 py-2.5 text-xs text-muted-foreground">{footer.label}</p>
              ))}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
