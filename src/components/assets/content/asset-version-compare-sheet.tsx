import { GitCompare, AlertCircle, FileText, Plus, Minus, Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulField } from '@/huemul/components/huemul-field';
import { Skeleton } from '@/components/ui/skeleton';
import MarkdownDiffViewer from '@/components/MarkdownDiffViewer';
import { getDocumentContent } from '@/services/assets';
import { useOrganization } from '@/contexts/organization-context';
import { parseApiDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getExecutionDisplayLabel } from './utils/version-utils';
import type { ContentSection } from '@/types/assets';
import type { HuemulFieldOption } from '@/types/huemul';
import type { AssetVersionCompareSheetProps } from '@/types/asset-version-compare-sheet';
export type { AssetVersionCompareSheetProps } from '@/types/asset-version-compare-sheet';

// ── Types ────────────────────────────────────────────────────────────────────

type ChangeStatus = 'unchanged' | 'changed' | 'added' | 'removed';

interface MergedSection {
    sectionId: string;
    name: string;
    leftContent: string;
    rightContent: string;
    changeStatus: ChangeStatus;
}

// ── Config ─────────────────────────────────────────────────────────────────

const CHANGE_STATUS_CONFIG: Record<
    ChangeStatus,
    { icon: React.ComponentType<{ className?: string }>; dotClass: string; textClass: string; activeBgClass: string; activeBorderClass: string }
> = {
    changed: {
        icon: Pencil,
        dotClass: 'bg-amber-400',
        textClass: 'text-amber-700',
        activeBgClass: 'bg-amber-50',
        activeBorderClass: 'border-l-amber-500',
    },
    added: {
        icon: Plus,
        dotClass: 'bg-green-400',
        textClass: 'text-green-700',
        activeBgClass: 'bg-green-50',
        activeBorderClass: 'border-l-green-500',
    },
    removed: {
        icon: Minus,
        dotClass: 'bg-red-400',
        textClass: 'text-red-700',
        activeBgClass: 'bg-red-50',
        activeBorderClass: 'border-l-red-500',
    },
    unchanged: {
        icon: FileText,
        dotClass: 'bg-gray-300',
        textClass: 'text-gray-700',
        activeBgClass: 'bg-gray-100',
        activeBorderClass: 'border-l-gray-400',
    },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeContent(value: string | undefined | null): string {
    return (value ?? '').replace(/\\n/g, '\n');
}

/**
 * Merge the sections of two versions, joined by `section_id` (stable across
 * versions). Right-version order is primary; left-only sections (removed) are
 * appended afterwards preserving their relative order.
 */
function mergeSections(
    left: ContentSection[],
    right: ContentSection[],
): MergedSection[] {
    const leftById = new Map<string, ContentSection>();
    for (const s of left) {
        if (s.section_id) leftById.set(s.section_id, s);
    }
    const rightIds = new Set<string>();
    const merged: MergedSection[] = [];

    for (const rs of right) {
        if (!rs.section_id) continue;
        rightIds.add(rs.section_id);
        const ls = leftById.get(rs.section_id);
        const leftContent = normalizeContent(ls?.content);
        const rightContent = normalizeContent(rs.content);
        merged.push({
            sectionId: rs.section_id,
            name: rs.section_name || ls?.section_name || rs.section_id,
            leftContent,
            rightContent,
            changeStatus: !ls
                ? 'added'
                : leftContent === rightContent
                    ? 'unchanged'
                    : 'changed',
        });
    }

    for (const ls of left) {
        if (!ls.section_id || rightIds.has(ls.section_id)) continue;
        merged.push({
            sectionId: ls.section_id,
            name: ls.section_name || ls.section_id,
            leftContent: normalizeContent(ls.content),
            rightContent: '',
            changeStatus: 'removed',
        });
    }

    return merged;
}

// ── Left panel list item ───────────────────────────────────────────────────

function SectionListItem({
    section,
    isSelected,
    onClick,
}: {
    section: MergedSection;
    isSelected: boolean;
    onClick: () => void;
}) {
    const { t } = useTranslation('assets');
    const config = CHANGE_STATUS_CONFIG[section.changeStatus];
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
            <div className="flex items-center gap-1.5">
                <Icon className={cn('h-3.5 w-3.5 shrink-0', config.textClass)} />
                <span className={cn(
                    'text-xs font-medium truncate',
                    isSelected ? config.textClass : 'text-gray-700',
                )}>
                    {section.name}
                </span>
            </div>
            <p className={cn('mt-0.5 text-[10px] pl-5', isSelected ? config.textClass : 'text-muted-foreground')}>
                {t(`versionCompare.changeStatus.${section.changeStatus}`)}
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
                    <Skeleton className="h-2 w-20 rounded ml-5" />
                </div>
            ))}
        </div>
    );
}

function DiffSkeleton() {
    return (
        <div className="p-6 grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, col) => (
                <div key={col} className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-3.5 w-full rounded" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ── Component ──────────────────────────────────────────────────────────────

export function AssetVersionCompareSheet({
    open,
    onOpenChange,
    documentId,
    executions,
    defaultRightExecutionId,
    defaultLeftExecutionId,
}: AssetVersionCompareSheetProps) {
    const { t } = useTranslation('assets');
    const { selectedOrganizationId } = useOrganization();

    // Executions sorted newest-first, used for defaults and selector options.
    const sortedExecutions = useMemo(
        () =>
            [...executions].sort(
                (a, b) => parseApiDate(b.created_at).getTime() - parseApiDate(a.created_at).getTime(),
            ),
        [executions],
    );

    const resolvedRightDefault = defaultRightExecutionId ?? sortedExecutions[0]?.id ?? null;
    const resolvedLeftDefault = useMemo(() => {
        if (defaultLeftExecutionId) return defaultLeftExecutionId;
        // Version immediately older than the right default.
        const rightIndex = sortedExecutions.findIndex((e) => e.id === resolvedRightDefault);
        return sortedExecutions[rightIndex + 1]?.id ?? sortedExecutions[rightIndex]?.id ?? null;
    }, [defaultLeftExecutionId, resolvedRightDefault, sortedExecutions]);

    const [leftId, setLeftId] = useState<string | null>(resolvedLeftDefault);
    const [rightId, setRightId] = useState<string | null>(resolvedRightDefault);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

    const versionOptions: HuemulFieldOption[] = sortedExecutions.map((exec, index) => ({
        value: exec.id,
        label: getExecutionDisplayLabel(exec) || `v${sortedExecutions.length - index}`,
    }));

    // Same query key as assets-content.tsx so cached version content is reused.
    const leftQuery = useQuery({
        queryKey: ['document-content', documentId, leftId],
        queryFn: () => getDocumentContent(documentId, selectedOrganizationId!, leftId ?? undefined),
        enabled: open && !!leftId && !!selectedOrganizationId,
        staleTime: 30_000,
    });
    const rightQuery = useQuery({
        queryKey: ['document-content', documentId, rightId],
        queryFn: () => getDocumentContent(documentId, selectedOrganizationId!, rightId ?? undefined),
        enabled: open && !!rightId && !!selectedOrganizationId,
        staleTime: 30_000,
    });

    const isLoading = leftQuery.isLoading || rightQuery.isLoading;
    const isError = leftQuery.isError || rightQuery.isError;
    const sameVersion = !!leftId && leftId === rightId;

    const merged = useMemo(() => {
        if (sameVersion) return [];
        const leftSections: ContentSection[] = leftQuery.data?.content ?? [];
        const rightSections: ContentSection[] = rightQuery.data?.content ?? [];
        return mergeSections(leftSections, rightSections);
    }, [sameVersion, leftQuery.data, rightQuery.data]);

    const effectiveSelectedId = selectedSectionId ?? merged[0]?.sectionId ?? null;
    const selectedSection = merged.find((s) => s.sectionId === effectiveSelectedId) ?? null;

    const leftLabel =
        getExecutionDisplayLabel(sortedExecutions.find((e) => e.id === leftId)) || t('versionCompare.leftVersionLabel');
    const rightLabel =
        getExecutionDisplayLabel(sortedExecutions.find((e) => e.id === rightId)) || t('versionCompare.rightVersionLabel');

    return (
        <HuemulSheet
            open={open}
            onOpenChange={onOpenChange}
            title={t('versionCompare.title')}
            description={t('versionCompare.description')}
            icon={GitCompare}
            iconClassName="text-blue-600"
            showFooter={false}
            maxWidth="sm:max-w-[95vw]"
            side="right"
        >
            <div className="-mx-6 -my-2 flex flex-col overflow-hidden" style={{ height: 'calc(100% + 1rem)' }}>
                {/* ── Version selector bar ── */}
                <div className="flex items-end gap-3 px-5 py-3 border-b bg-white shrink-0">
                    <HuemulField
                        type="select"
                        label={t('versionCompare.leftVersionLabel')}
                        value={leftId ?? ''}
                        onChange={(v) => { setLeftId(String(v)); setSelectedSectionId(null); }}
                        options={versionOptions}
                        placeholder={t('versionCompare.selectVersion')}
                        selectSize="sm"
                        className="w-48"
                    />
                    <span className="pb-2 text-xs font-medium text-muted-foreground">{t('versionCompare.versus')}</span>
                    <HuemulField
                        type="select"
                        label={t('versionCompare.rightVersionLabel')}
                        value={rightId ?? ''}
                        onChange={(v) => { setRightId(String(v)); setSelectedSectionId(null); }}
                        options={versionOptions}
                        placeholder={t('versionCompare.selectVersion')}
                        selectSize="sm"
                        className="w-48"
                    />
                </div>

                {/* ── Split layout ── */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left panel: section list */}
                    <div className="w-64 shrink-0 flex flex-col border-r bg-gray-50/60 overflow-hidden">
                        <div className="px-3 py-2 border-b bg-white">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('versionCompare.listHeader')}
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoading && <ListSkeleton />}

                            {isError && (
                                <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
                                    <AlertCircle className="h-6 w-6 text-red-400" />
                                    <p className="text-xs text-muted-foreground">{t('versionCompare.loadError')}</p>
                                </div>
                            )}

                            {!isLoading && !isError && sameVersion && (
                                <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
                                    <AlertCircle className="h-6 w-6 text-amber-400" />
                                    <p className="text-xs text-muted-foreground">{t('versionCompare.sameVersion')}</p>
                                </div>
                            )}

                            {!isLoading && !isError && !sameVersion && merged.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
                                    <GitCompare className="h-7 w-7 text-gray-200" />
                                    <p className="text-xs text-muted-foreground">{t('versionCompare.empty')}</p>
                                </div>
                            )}

                            {!isLoading && !isError && !sameVersion && merged.length > 0 && (
                                <div className="py-1">
                                    {merged.map((section) => (
                                        <SectionListItem
                                            key={section.sectionId}
                                            section={section}
                                            isSelected={section.sectionId === effectiveSelectedId}
                                            onClick={() => setSelectedSectionId(section.sectionId)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right panel: diff viewer */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        <div className="flex-1 overflow-y-auto">
                            {isLoading && <DiffSkeleton />}

                            {!isLoading && !isError && !sameVersion && !selectedSection && merged.length > 0 && (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                                    <GitCompare className="h-10 w-10 text-gray-200" />
                                    <p className="text-sm text-muted-foreground">{t('versionCompare.selectSection')}</p>
                                </div>
                            )}

                            {!isLoading && !isError && sameVersion && (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                                    <AlertCircle className="h-10 w-10 text-amber-200" />
                                    <p className="text-sm text-muted-foreground">{t('versionCompare.sameVersion')}</p>
                                </div>
                            )}

                            {!isLoading && !isError && !sameVersion && selectedSection && (
                                <MarkdownDiffViewer
                                    oldContent={selectedSection.leftContent}
                                    newContent={selectedSection.rightContent}
                                    oldLabel={leftLabel}
                                    newLabel={rightLabel}
                                    defaultMode="rendered"
                                    showModeToggle={false}
                                    showRenderedDiffPanel={false}
                                    className="p-4"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HuemulSheet>
    );
}
