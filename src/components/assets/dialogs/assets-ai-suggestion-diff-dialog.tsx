import { GitCompare } from 'lucide-react';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import MarkdownDiffViewer from '@/components/MarkdownDiffViewer';
import { useTranslation } from 'react-i18next';

interface AiSuggestionDiffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sectionOutput: string;
    aiSuggestionInstruction?: string | null;
    aiSuggestionContent?: string | null;
    aiPreview: string | null;
    onAccept: () => Promise<void>;
    onReject: () => Promise<void>;
}

export function AiSuggestionDiffDialog({
    open,
    onOpenChange,
    sectionOutput,
    aiSuggestionInstruction,
    aiSuggestionContent,
    aiPreview,
    onAccept,
    onReject,
}: AiSuggestionDiffDialogProps) {
    const { t } = useTranslation('assets');

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
                newContent={aiPreview ?? aiSuggestionContent ?? ''}
                oldLabel={t('section.diffCurrentLabel')}
                newLabel={t('section.diffSuggestionLabel')}
                defaultMode='rendered'
                showModeToggle={false}
                showRenderedDiffPanel={false}
            />
        </HuemulDialog>
    );
}
