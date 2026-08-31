import { History, Bot, FileEdit, AlertCircle, GitCompare, Zap, Copy, Check, ClipboardList } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MarkdownDiffViewer from '@/components/MarkdownDiffViewer';
import {
    getSectionExecutionHistory,
    type SectionHistoryChangeType,
    type SectionHistoryEntry,
} from '@/services/section_execution';
import { useOrganization } from '@/contexts/organization-context';
import { cn } from '@/lib/utils';
import type { SectionHistorySheetProps } from '@/types/section-history-sheet';
export type { SectionHistorySheetProps } from '@/types/section-history-sheet';

// ── Config ─────────────────────────────────────────────────────────────────

const CHANGE_TYPE_CONFIG: Record<
    SectionHistoryChangeType,
    {
        icon: React.ComponentType<{ className?: string }>;
        iconColorClass: string;
        activeBgClass: string;
        activeTextClass: string;
        activeBorderClass: string;
        badgeClass: string;
        dotClass: string;
    }
> = {
    manual: {
        icon: FileEdit,
        iconColorClass: 'text-blue-500',
        activeBgClass: 'bg-blue-50',
        activeTextClass: 'text-blue-700',
        activeBorderClass: 'border-l-blue-500',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-400',
    },
    modify_ai: {
        icon: Bot,
        iconColorClass: 'text-purple-500',
        activeBgClass: 'bg-purple-50',
        activeTextClass: 'text-purple-700',
        activeBorderClass: 'border-l-purple-500',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-400',
    },
    run_ai: {
        icon: Zap,
        iconColorClass: 'text-amber-500',
        activeBgClass: 'bg-amber-50',
        activeTextClass: 'text-amber-700',
        activeBorderClass: 'border-l-amber-500',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-400',
    },
    modify_form: {
        icon: ClipboardList,
        iconColorClass: 'text-green-500',
        activeBgClass: 'bg-green-50',
        activeTextClass: 'text-green-700',
        activeBorderClass: 'border-l-green-500',
        badgeClass: 'bg-green-50 text-green-700 border-green-200',
        dotClass: 'bg-green-400',
    },
};

// ── Left panel list item ───────────────────────────────────────────────────

function HistoryListItem({
    entry,
    displayNumber,
    isSelected,
    onClick,
}: {
    entry: SectionHistoryEntry;
    displayNumber: number;
    isSelected: boolean;
    onClick: () => void;
}) {
    const { t } = useTranslation('assets');
    const config = CHANGE_TYPE_CONFIG[entry.change_type] ?? CHANGE_TYPE_CONFIG.manual;
    const Icon = config.icon;

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left px-3 py-2.5 border-l-2 transition-colors duration-100 hover:cursor-pointer',
                isSelected
                    ? cn('border-l-2', config.activeBorderClass, config.activeBgClass)
                    : 'border-l-transparent hover:bg-gray-50',
            )}
        >
            {/* Row 1: icon + label + number */}
            <div className="flex items-center gap-1.5">
                <Icon className={cn('h-3.5 w-3.5 shrink-0', config.iconColorClass)} />
                <span className={cn(
                    'text-xs font-medium truncate',
                    isSelected ? config.activeTextClass : 'text-gray-700',
                )}>
                    {t(`history.changeType.${entry.change_type}`)} #{displayNumber}
                </span>
            </div>

            {/* Row 2: instruction preview */}
            {entry.user_instruction ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground italic line-clamp-2 pl-5">
                    "{entry.user_instruction}"
                </p>
            ) : null}

            {/* Row 3: date */}
            <p className={cn('mt-0.5 text-[10px] pl-5', isSelected ? config.activeTextClass : 'text-muted-foreground')}>
                {formatRelativeTime(entry.created_at)}
            </p>
        </button>
    );
}

// ── Skeletons ──────────────────────────────────────────────────────────────

function ListSkeleton() {
    return (
        <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="h-3.5 w-3.5 rounded" />
                        <Skeleton className="h-3 w-28 rounded" />
                    </div>
                    <Skeleton className="h-2.5 w-36 rounded ml-5" />
                    <Skeleton className="h-2 w-20 rounded ml-5" />
                </div>
            ))}
        </div>
    );
}

function DiffSkeleton() {
    return (
        <div className="p-6 space-y-4">
            <div className="flex gap-2 mb-4">
                <Skeleton className="h-7 w-20 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-3.5 w-full rounded" />
                    ))}
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-3.5 w-full rounded" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Component ──────────────────────────────────────────────────────────────

export function SectionHistorySheet({
    open,
    onOpenChange,
    sectionExecutionId,
    sectionName,
}: SectionHistorySheetProps) {
    const { t } = useTranslation('assets');
    const { selectedOrganizationId } = useOrganization();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ['section-history', sectionExecutionId],
        queryFn: () =>
            getSectionExecutionHistory(sectionExecutionId, selectedOrganizationId ?? undefined),
        enabled: open && !!sectionExecutionId,
        staleTime: 30_000,
    });

    const items = data?.items ?? [];
    const total = data?.total ?? 0;

    // Auto-select first item once data arrives
    const effectiveSelectedId = selectedId ?? items[0]?.id ?? null;
    const selectedEntry = items.find((e) => e.id === effectiveSelectedId) ?? null;
    const selectedIndex = items.findIndex((e) => e.id === effectiveSelectedId);
    const selectedConfig = selectedEntry
        ? (CHANGE_TYPE_CONFIG[selectedEntry.change_type] ?? CHANGE_TYPE_CONFIG.manual)
        : null;

    return (
        <HuemulSheet
            open={open}
            onOpenChange={onOpenChange}
            title={sectionName ? t('history.titleWithName', { name: sectionName }) : t('history.title')}
            description={total > 0 ? t('history.totalChanges', { count: total }) : t('history.description')}
            icon={History}
            iconClassName="text-blue-600"
            showFooter={false}
            maxWidth="sm:max-w-[95vw]"
            side="right"
        >
            {/* ── Full-bleed split layout ── */}
            {/* -mx-6 -my-2 escapes HuemulSheet's px-6 py-2 body padding */}
            <div className="-mx-6 -my-2 flex overflow-hidden" style={{ height: 'calc(100% + 1rem)' }}>

                {/* ── Left panel: entry list ── */}
                <div className="w-64 shrink-0 flex flex-col border-r bg-gray-50/60 overflow-hidden">
                    {/* List header */}
                    <div className="px-3 py-2 border-b bg-white">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t('history.listHeader')}
                        </p>
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading && <ListSkeleton />}

                        {isError && (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
                                <AlertCircle className="h-6 w-6 text-red-400" />
                                <p className="text-xs text-muted-foreground">{t('history.loadError')}</p>
                            </div>
                        )}

                        {!isLoading && !isError && items.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
                                <History className="h-7 w-7 text-gray-200" />
                                <p className="text-xs text-muted-foreground">{t('history.empty')}</p>
                            </div>
                        )}

                        {!isLoading && !isError && items.length > 0 && (
                            <div className="py-1">
                                {items.map((entry, index) => (
                                    <HistoryListItem
                                        key={entry.id}
                                        entry={entry}
                                        displayNumber={items.length - index}
                                        isSelected={entry.id === effectiveSelectedId}
                                        onClick={() => setSelectedId(entry.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right panel: diff viewer ── */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Right panel header */}
                    {selectedEntry && selectedConfig && (
                        <div className="px-5 py-2.5 border-b flex items-center gap-2 shrink-0">
                            <Badge
                                variant="outline"
                                className={cn('text-[11px] px-1.5 py-0 font-medium leading-5', selectedConfig.badgeClass)}
                            >
                                {t(`history.changeType.${selectedEntry.change_type}`)} #{items.length - selectedIndex}
                            </Badge>
                            <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                                {formatRelativeTime(selectedEntry.created_at)}
                            </span>
                        </div>
                    )}

                    {/* Instruction block */}
                    {selectedEntry?.user_instruction && (
                        <div className="px-5 py-3 border-b bg-amber-50/60 dark:bg-amber-950/20 flex items-start gap-3 shrink-0">
                            <span className="text-amber-500 mt-0.5 shrink-0 text-base leading-none select-none">“”</span>
                            <p className="flex-1 text-xs text-foreground/80 italic leading-relaxed">
                                {selectedEntry.user_instruction}
                            </p>
                            <button
                                onClick={() => handleCopy(selectedEntry.user_instruction!)}
                                title={t('history.copyInstruction')}
                                className="shrink-0 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:cursor-pointer transition-colors"
                            >
                                {copied
                                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                                    : <Copy className="h-3.5 w-3.5 text-amber-500" />}
                            </button>
                        </div>
                    )}

                    {/* Diff content */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading && <DiffSkeleton />}

                        {!isLoading && !isError && !selectedEntry && items.length > 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                                <GitCompare className="h-10 w-10 text-gray-200" />
                                <p className="text-sm text-muted-foreground">{t('history.selectEntry')}</p>
                            </div>
                        )}

                        {!isLoading && !isError && items.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                                <History className="h-10 w-10 text-gray-200" />
                                <p className="text-sm text-muted-foreground">{t('history.empty')}</p>
                            </div>
                        )}

                        {selectedEntry && (
                            <MarkdownDiffViewer
                                oldContent={selectedEntry.previous_text ?? ''}
                                newContent={selectedEntry.new_text}
                                oldLabel={t('history.diffPreviousLabel')}
                                newLabel={t('history.diffNewLabel')}
                                defaultMode='rendered'
                                showModeToggle={false}
                                showRenderedDiffPanel={false}
                                className="p-4"
                            />
                        )}
                    </div>
                </div>
            </div>
        </HuemulSheet>
    );
}
