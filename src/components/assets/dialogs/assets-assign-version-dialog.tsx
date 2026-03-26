import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';

interface AssignVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (version: { major: number; minor: number; patch: number }) => void;
  isProcessing?: boolean;
}

export function AssignVersionDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
}: AssignVersionDialogProps) {
  const { t } = useTranslation('assets');
  const [major, setMajor] = useState('1');
  const [minor, setMinor] = useState('0');
  const [patch, setPatch] = useState('0');

  // Reset to defaults when dialog opens
  useEffect(() => {
    if (open) {
      setMajor('1');
      setMinor('0');
      setPatch('0');
    }
  }, [open]);

  const majorNum = parseInt(major || '0', 10);
  const minorNum = parseInt(minor || '0', 10);
  const patchNum = parseInt(patch || '0', 10);

  const isValid =
    major.length > 0 && minor.length > 0 && patch.length > 0 &&
    !isNaN(majorNum) && !isNaN(minorNum) && !isNaN(patchNum);

  function sanitize(value: string) {
    return value.replace(/\D/g, '');
  }

  function increment(setter: (v: string) => void, current: string) {
    const num = parseInt(current || '0', 10);
    setter(String(num + 1));
  }

  function decrement(setter: (v: string) => void, current: string) {
    const num = parseInt(current || '0', 10);
    if (num > 0) setter(String(num - 1));
  }

  function handleConfirm() {
    if (!isValid) return;
    onConfirm({ major: majorNum, minor: minorNum, patch: patchNum });
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(o) => { if (!isProcessing) onOpenChange(o); }}
      title={t('assignVersion.title')}
      description={t('assignVersion.description')}
      icon={Tag}
      iconClassName="h-4 w-4 text-[#4464f7]"
      maxWidth="sm:max-w-sm"
      saveAction={{
        label: isProcessing ? t('assignVersion.assigning') : t('assignVersion.submitLabel'),
        onClick: handleConfirm,
        disabled: !isValid,
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="flex items-end gap-2 w-full">
          <div className="flex flex-col gap-1 flex-1 items-center">
            <Label className="text-xs text-gray-500 font-medium text-center">{t('assignVersion.major')}</Label>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer" disabled={isProcessing} onClick={() => increment(setMajor, major)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={major}
              onChange={(e) => setMajor(sanitize(e.target.value))}
              className="text-center font-mono text-base"
              disabled={isProcessing}
            />
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer" disabled={isProcessing || majorNum <= 0} onClick={() => decrement(setMajor, major)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-2xl font-semibold text-gray-400 pb-5">.</span>

          <div className="flex flex-col gap-1 flex-1 items-center">
            <Label className="text-xs text-gray-500 font-medium text-center">{t('assignVersion.minor')}</Label>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer" disabled={isProcessing} onClick={() => increment(setMinor, minor)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={minor}
              onChange={(e) => setMinor(sanitize(e.target.value))}
              className="text-center font-mono text-base"
              disabled={isProcessing}
            />
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer" disabled={isProcessing || minorNum <= 0} onClick={() => decrement(setMinor, minor)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-2xl font-semibold text-gray-400 pb-5">.</span>

          <div className="flex flex-col gap-1 flex-1 items-center">
            <Label className="text-xs text-gray-500 font-medium text-center">{t('assignVersion.patch')}</Label>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer" disabled={isProcessing} onClick={() => increment(setPatch, patch)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={patch}
              onChange={(e) => setPatch(sanitize(e.target.value))}
              className="text-center font-mono text-base"
              disabled={isProcessing}
            />
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer" disabled={isProcessing || patchNum <= 0} onClick={() => decrement(setPatch, patch)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Version preview */}
        <div className="px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
          <span className="text-sm font-mono font-medium text-gray-700">
            v{majorNum}.{minorNum}.{patchNum}
          </span>
        </div>
      </div>
    </HuemulDialog>
  );
}
