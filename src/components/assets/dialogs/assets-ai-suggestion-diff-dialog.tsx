import { GitCompare } from 'lucide-react';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import MarkdownDiffViewer from '@/components/MarkdownDiffViewer';
import { useTranslation } from 'react-i18next';
import { collectCommentFragmentsFromMarkdown, stripCommentMarkers } from '@/lib/plate-comment-markers';
import type { AiSuggestionDiffDialogProps } from '@/types/assets';
export type { AiSuggestionDiffDialogProps } from '@/types/assets';

export function AiSuggestionDiffDialog({
    open,
    onOpenChange,
    sectionOutput,
    aiSuggestionInstruction,
    aiSuggestionContent,
    aiSuggestionComments,
    aiPreview,
    onAccept,
    onReject,
}: AiSuggestionDiffDialogProps) {
    const { t } = useTranslation('assets');
    const suggestionMarkdown = aiPreview ?? aiSuggestionContent ?? '';
    const newComments = (aiSuggestionComments ?? []).filter((c) => c.is_new && c.body);
    const fragments = collectCommentFragmentsFromMarkdown(suggestionMarkdown);

    return (
        <HuemulDialog
            open={open}
            onOpenChange={onOpenChange}
            title={t('section.diffDialogTitle')}
            description={
                aiSuggestionInstruction
                    ? `${t('section.diffInstruction')} "${aiSuggestionInstruction}"`
                    : undefined
            }
            icon={GitCompare}
            iconClassName="text-amber-600"
            maxWidth="w-[95vw]"
            maxHeight="max-h-[90vh]"
            className="!max-w-[95vw]"
            cancelLabel={t('section.diffDismiss')}
            extraActions={[{
                label: t('section.diffReject'),
                variant: 'destructive',
                closeOnSuccess: false,
                onClick: onReject,
            }]}
            saveAction={{
                label: t('section.diffAccept'),
                onClick: onAccept,
                closeOnSuccess: false,
            }}
        >
            <MarkdownDiffViewer
                oldContent={sectionOutput.replace(/\\n/g, "\n")}
                newContent={stripCommentMarkers(suggestionMarkdown)}
                oldLabel={t('section.diffCurrentLabel')}
                newLabel={t('section.diffSuggestionLabel')}
                defaultMode='rendered'
                showModeToggle={false}
                showRenderedDiffPanel={false}
            />
            {newComments.length > 0 && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-900">
                        {t('section.aiSuggestionCommentsTitle', { count: newComments.length })}
                    </p>
                    <ul className="mt-2 space-y-2">
                        {newComments.map((c) => (
                            <li key={c.ref} className="text-sm text-gray-700">
                                {fragments.get(c.ref) && (
                                    <blockquote className="mb-0.5 border-l-2 border-amber-300 pl-2 text-xs text-gray-500">
                                        {fragments.get(c.ref)}
                                    </blockquote>
                                )}
                                {c.body}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </HuemulDialog>
    );
}
