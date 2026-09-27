import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Loader2 } from 'lucide-react';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { HuemulVersionPicker } from '@/huemul/components/huemul-version-picker';
import type { HuemulVersionPickerValue } from '@/huemul/components/huemul-version-picker';
import type { AssignVersionDialogProps } from '@/types/assets';
export type { AssignVersionDialogProps } from '@/types/assets';

const INITIAL_VALUE: HuemulVersionPickerValue = {
  major: 1,
  minor: 0,
  patch: 0,
  versionString: '1.0.0',
  isValid: false,
  isFetchingSuggestion: false,
};

export function AssignVersionDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
  executionId,
  organizationId,
  existingVersions,
}: AssignVersionDialogProps) {
  const { t } = useTranslation('assets');
  const [value, setValue] = useState<HuemulVersionPickerValue>(INITIAL_VALUE);

  function handleConfirm() {
    if (!value.isValid) return;
    onConfirm({ major: value.major, minor: value.minor, patch: value.patch });
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(o) => { if (!isProcessing) onOpenChange(o); }}
      title={t('assignVersion.title')}
      description={t('assignVersion.description')}
      icon={Tag}
      iconClassName="h-4 w-4 text-[#4464f7]"
      maxWidth="sm:max-w-lg"
      footerLeft={
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">{t('assignVersion.resultLabel')}</span>
          <span className="text-lg font-semibold font-mono text-gray-900">
            {value.isFetchingSuggestion ? <Loader2 className="h-4 w-4 animate-spin" /> : value.versionString}
          </span>
        </div>
      }
      saveAction={{
        label: isProcessing ? t('assignVersion.assigning') : t('assignVersion.submitLabel'),
        onClick: handleConfirm,
        disabled: !value.isValid || value.isFetchingSuggestion,
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <HuemulVersionPicker
        open={open}
        executionId={executionId}
        organizationId={organizationId}
        existingVersions={existingVersions}
        disabled={isProcessing}
        onChange={setValue}
      />
    </HuemulDialog>
  );
}
