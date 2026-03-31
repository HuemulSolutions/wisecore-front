import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';

interface RenameVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
  currentName: string;
  isProcessing?: boolean;
}

export function RenameVersionDialog({
  open,
  onOpenChange,
  onConfirm,
  currentName,
  isProcessing = false,
}: RenameVersionDialogProps) {
  const { t } = useTranslation('assets');
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const isValid = name.trim().length > 0;

  function handleConfirm() {
    if (!isValid) return;
    onConfirm(name.trim());
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(o) => { if (!isProcessing) onOpenChange(o); }}
      title={t('content.renameVersionTitle')}
      description={t('content.renameVersionDescription')}
      icon={Pencil}
      iconClassName="h-4 w-4 text-[#4464f7]"
      maxWidth="sm:max-w-sm"
      saveAction={{
        label: t('content.renameVersionConfirm'),
        onClick: handleConfirm,
        disabled: !isValid || name.trim() === currentName,
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <div className="flex flex-col gap-3 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="version-name" className="text-sm font-medium">
            {t('content.renameVersionLabel')}
          </Label>
          <Input
            id="version-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('content.renameVersionPlaceholder')}
            autoFocus
          />
        </div>
      </div>
    </HuemulDialog>
  );
}
