import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, MessageCircle, RefreshCw, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { useExecutionUnresolvedComments } from '@/hooks/useAllExecutions';
import { commentPlainText, formatCommentDate } from '@/lib/comment-utils';
import { parseApiDate } from '@/lib/utils';
import { HomeAvatar } from './home-avatar';

export interface HomeCommentsPopoverProps {
  organizationId: string;
  executionId: string;
  documentName: string;
  /** Conteo de comentarios sin resolver de la fila (lo que muestra el trigger). */
  count: number;
  /** Sin permiso de listado de discusiones el conteo queda estático (sin popover). */
  canList: boolean;
  onOpenAsset: () => void;
}

/**
 * Trigger del conteo de comentarios sin resolver de la tabla "Todos los
 * activos": abre un popover de solo lectura con el hilo agrupado por sección
 * (orden estructural del documento) y un único CTA para abrir el activo.
 * Los datos se piden recién al abrir.
 */
export function HomeCommentsPopover({
  organizationId,
  executionId,
  documentName,
  count,
  canList,
  onOpenAsset,
}: HomeCommentsPopoverProps) {
  const { t } = useTranslation(['home', 'common']);
  const [open, setOpen] = useState(false);

  const trigger = (
    <span className="inline-flex items-center gap-1 font-medium tabular-nums text-fuchsia-600 dark:text-fuchsia-400">
      <MessageCircle className="h-3.5 w-3.5" />
      {count}
    </span>
  );

  const query = useExecutionUnresolvedComments(organizationId, executionId, open && canList);
  const sections = query.data?.sections ?? [];

  if (!canList) return trigger;

  return (
    // La fila entera abre el activo: frenar el clic acá y dentro del contenido
    // (el Portal de Radix igual propaga eventos React al padre).
    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            title={t('commentsPopover.open')}
          >
            {trigger}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex max-h-[420px] w-[340px] flex-col gap-0 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 border-b px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{t('commentsPopover.title')}</p>
              <p className="truncate text-2xs text-muted-foreground" title={documentName}>
                {documentName}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <HuemulButton
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                icon={RefreshCw}
                tooltip={t('common:refresh')}
                loading={query.isFetching}
                onClick={() => void query.refetch()}
              />
              <HuemulButton
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                icon={X}
                tooltip={t('common:close')}
                onClick={() => setOpen(false)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-2.5">
            {query.isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : query.isError ? (
              <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
                <p>{t('commentsPopover.error')}</p>
                <HuemulButton variant="outline" label={t('common:retry')} onClick={() => void query.refetch()} />
              </div>
            ) : sections.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">{t('commentsPopover.empty')}</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {sections.map((section) => (
                  <section key={section.section_execution_id ?? `__${section.scope}__`} className="flex flex-col gap-2">
                    <h4 className="flex items-center gap-1 text-2xs font-semibold text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {section.scope === 'document'
                        ? t('commentsPopover.documentScope')
                        : (section.section_name ?? t('commentsPopover.unknownSection'))}
                      <span className="font-normal">· {section.count}</span>
                    </h4>
                    {section.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <HomeAvatar name={c.author.name} className="h-5 w-5 text-[9px]" />
                        <div className="min-w-0">
                          <p className="text-2xs">
                            <span className="font-semibold text-foreground">{c.author.name}</span>{' '}
                            <span className="text-muted-foreground">{formatCommentDate(parseApiDate(c.created_at))}</span>
                          </p>
                          <p className="whitespace-pre-line break-words text-xs text-foreground">{commentPlainText(c.text)}</p>
                        </div>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="border-t px-3.5 py-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenAsset();
              }}
              className="inline-flex w-full items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {t('commentsPopover.viewFullAsset')}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}
