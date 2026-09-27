import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, MessageCircle, RefreshCw, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { useUsers } from '@/hooks/useUsers';
import { getDocumentContent } from '@/services/assets';
import { listDiscussions } from '@/services/discussions';
import { formatCommentDate } from '@/lib/comment-utils';
import { parseApiDate } from '@/lib/utils';
import type { DiscussionComment, DiscussionWithComments } from '@/types/discussions';
import { HomeAvatar } from './home-avatar';

export interface HomeCommentsPopoverProps {
  organizationId: string;
  documentId: string;
  executionId: string;
  documentName: string;
  /** Conteo de comentarios sin resolver de la fila (lo que muestra el trigger). */
  count: number;
  /** Sin permiso de listado de discusiones el conteo queda estático (sin popover). */
  canList: boolean;
  onOpenAsset: () => void;
}

interface SectionGroup {
  key: string;
  name: string | null;
  threads: DiscussionWithComments[];
}

/** Los comentarios guardan Plate JSON serializado; acá solo hace falta el texto plano. */
function plainText(raw: string): string {
  const collect = (nodes: unknown): string => {
    if (!Array.isArray(nodes)) return '';
    return nodes
      .map((node) => {
        if (typeof node !== 'object' || node === null) return '';
        const n = node as { text?: unknown; children?: unknown };
        if (typeof n.text === 'string') return n.text;
        return collect(n.children);
      })
      .join('');
  };
  try {
    return collect(JSON.parse(raw)).trim();
  } catch {
    return raw;
  }
}

const byCreatedAt = (a: DiscussionComment, b: DiscussionComment) =>
  parseApiDate(a.created_at).getTime() - parseApiDate(b.created_at).getTime();

/**
 * Trigger del conteo de comentarios sin resolver de la tabla "Todos los
 * activos": abre un popover de solo lectura con el hilo agrupado por sección
 * (orden estructural del documento) y un único CTA para abrir el activo.
 * Los datos se piden recién al abrir.
 */
export function HomeCommentsPopover({
  organizationId,
  documentId,
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

  const discussionsQuery = useQuery({
    queryKey: ['home', 'comments-popover', 'discussions', documentId, executionId],
    queryFn: () =>
      listDiscussions(
        { document_id: documentId, execution_id: executionId, include_comments: true, page_size: 200 },
        organizationId,
      ),
    enabled: open && canList,
    staleTime: 30_000,
  });
  const contentQuery = useQuery({
    queryKey: ['home', 'comments-popover', 'sections', documentId, executionId],
    queryFn: () => getDocumentContent(documentId, organizationId, executionId),
    enabled: open && canList,
    staleTime: 30_000,
  });
  const { data: usersResponse } = useUsers(open && canList, organizationId);

  const authorName = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersResponse?.data ?? []) {
      map.set(u.id, `${u.name} ${u.last_name}`.trim() || u.email);
    }
    return (id: string | null | undefined) => (id ? map.get(id) : undefined) ?? t('commentsPopover.unknownAuthor');
  }, [usersResponse?.data, t]);

  const groups = useMemo<SectionGroup[]>(() => {
    const open_ = (discussionsQuery.data?.data ?? []).filter(
      (d): d is DiscussionWithComments => !d.is_resolved && ((d as DiscussionWithComments).comments?.length ?? 0) > 0,
    );
    const sections = contentQuery.data?.content ?? [];
    const bySection = new Map<string, DiscussionWithComments[]>();
    const documentScope: DiscussionWithComments[] = [];
    for (const d of open_) {
      if (!d.section_execution_id) documentScope.push(d);
      else bySection.set(d.section_execution_id, [...(bySection.get(d.section_execution_id) ?? []), d]);
    }
    const result: SectionGroup[] = [];
    if (documentScope.length > 0) {
      result.push({ key: '__document__', name: t('commentsPopover.documentScope'), threads: documentScope });
    }
    for (const s of sections) {
      const threads = bySection.get(s.id);
      if (!threads) continue;
      result.push({ key: s.id, name: s.section_name || t('commentsPopover.unknownSection'), threads });
      bySection.delete(s.id);
    }
    // Hilos de secciones que ya no existen en el contenido: al final.
    for (const [key, threads] of bySection) {
      result.push({ key, name: t('commentsPopover.unknownSection'), threads });
    }
    return result;
  }, [discussionsQuery.data?.data, contentQuery.data?.content, t]);

  if (!canList) return trigger;

  const isFetching = discussionsQuery.isFetching || contentQuery.isFetching;
  const isLoading = discussionsQuery.isLoading || contentQuery.isLoading;
  const isError = discussionsQuery.isError || contentQuery.isError;
  const refetchAll = () => {
    void discussionsQuery.refetch();
    void contentQuery.refetch();
  };

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
                loading={isFetching}
                onClick={refetchAll}
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
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
                <p>{t('commentsPopover.error')}</p>
                <HuemulButton variant="outline" label={t('common:retry')} onClick={refetchAll} />
              </div>
            ) : groups.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">{t('commentsPopover.empty')}</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {groups.map((group) => (
                  <section key={group.key} className="flex flex-col gap-2">
                    <h4 className="flex items-center gap-1 text-2xs font-semibold text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {group.name}
                      <span className="font-normal">
                        · {group.threads.reduce((acc, d) => acc + d.comments.length, 0)}
                      </span>
                    </h4>
                    {group.threads.flatMap((d) =>
                      [...d.comments].sort(byCreatedAt).map((c) => {
                        const name = authorName(c.user_id ?? c.created_by);
                        return (
                          <div key={c.id} className="flex items-start gap-2">
                            <HomeAvatar name={name} className="h-5 w-5 text-[9px]" />
                            <div className="min-w-0">
                              <p className="text-2xs">
                                <span className="font-semibold text-foreground">{name}</span>{' '}
                                <span className="text-muted-foreground">{formatCommentDate(parseApiDate(c.created_at))}</span>
                              </p>
                              <p className="whitespace-pre-line break-words text-xs text-foreground">
                                {plainText(c.content_rich)}
                              </p>
                            </div>
                          </div>
                        );
                      }),
                    )}
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
