import type { ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { cn } from '@/lib/utils';
import type { HomeWorkGroupCount, HomeWorkGroupRow as HomeWorkGroupRowData } from '@/types/home';

export interface HomeWorkGroupAccent {
  headerBg: string;
  headerBorder: string;
  /** Color del chevron y de la píldora de contador. */
  accentText: string;
  pillBg: string;
}

export interface HomeWorkGroupCardProps {
  accent: HomeWorkGroupAccent;
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
  footer?: { label: string; onClick: () => void };
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
      <div className="flex h-9 items-center gap-2 rounded-[11px] border border-[#e2e7ee] bg-white px-[15px] text-[12.5px] text-[#64748b]">
        <Check className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
        {emptyCollapsedLabel}
      </div>
    );
  }

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={() => onToggleCollapse()}
      className={cn('overflow-hidden rounded-[11px] border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]', accent.headerBorder)}
    >
      <div className={cn('flex items-center justify-between gap-2 px-[15px] py-3', accent.headerBg)}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex min-w-0 items-center gap-2 hover:cursor-pointer">
            <ChevronDown
              className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', collapsed && '-rotate-90', accent.accentText)}
            />
            <span className="truncate text-[13.5px] font-semibold">{title}</span>
            {count && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-semibold', accent.pillBg, accent.accentText)}>
                {count.exact ? count.value : t('workGroups.common.countApprox', { count: count.value })}
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        <div className="flex shrink-0 items-center gap-2">
          {meta && !isLoading && <span className="text-[12px] text-[#94a3b8]">{meta}</span>}
        </div>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        {error ? (
          <div className="flex items-center justify-between gap-2 px-[15px] py-4">
            <span className="text-[12.5px] text-[#64748b]">{t('workGroups.common.errorTitle')}</span>
            {onRetry && <HuemulButton variant="outline" size="sm" label={t('common:retry')} onClick={onRetry} />}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3 px-[15px] py-3.5">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-[9px] w-[78%] animate-pulse rounded-full bg-[#eef1f5]" />
                <div className="h-[9px] w-[60%] animate-pulse rounded-full bg-[#eef1f5]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {rows.map((row) => renderRow(row))}
            {footer && (
              <button
                type="button"
                onClick={footer.onClick}
                className="block w-full px-[15px] py-2.5 text-left text-[12.5px] font-medium text-[#2563eb] hover:cursor-pointer hover:underline"
              >
                {footer.label}
              </button>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
