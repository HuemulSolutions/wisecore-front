import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Tag, ChevronUp, ChevronDown, Loader2, Check, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { getExecutionVersionSuggestion } from '@/services/executions';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { cn } from '@/lib/utils';
import type { AssignVersionDialogProps } from '@/types/assets';
export type { AssignVersionDialogProps } from '@/types/assets';

function isVersionNewer(a: [number, number, number], b: [number, number, number]) {
  if (a[0] !== b[0]) return a[0] > b[0];
  if (a[1] !== b[1]) return a[1] > b[1];
  return a[2] > b[2];
}

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
  const { canRead } = useUserPermissions();
  const canReadVersion = canRead('version');
  const [major, setMajor] = useState('1');
  const [minor, setMinor] = useState('0');
  const [patch, setPatch] = useState('0');

  const { data: suggestion, isFetching: isFetchingSuggestionQuery, isError: isSuggestionError } = useQuery({
    queryKey: ['execution-version-suggestion', executionId],
    queryFn: () => getExecutionVersionSuggestion(executionId!, organizationId!),
    enabled: open && !!executionId && !!organizationId && canReadVersion,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  });

  const isFetchingSuggestion = open && !!executionId && !!organizationId && canReadVersion && isFetchingSuggestionQuery;

  // Seed inputs whenever the dialog opens or a fresh suggestion arrives
  useEffect(() => {
    if (!open) return;
    setMajor(suggestion ? String(suggestion.major) : '1');
    setMinor(suggestion ? String(suggestion.minor) : '0');
    setPatch(suggestion ? String(suggestion.patch) : '0');
  }, [open, suggestion]);

  const majorNum = parseInt(major || '0', 10);
  const minorNum = parseInt(minor || '0', 10);
  const patchNum = parseInt(patch || '0', 10);

  const baseParsed = useMemo(() => {
    if (!suggestion?.based_on) return null;
    const parts = suggestion.based_on.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => isNaN(n))) return null;
    return { major: parts[0], minor: parts[1], patch: parts[2] };
  }, [suggestion?.based_on]);

  const isNewer = !baseParsed || isVersionNewer([majorNum, minorNum, patchNum], [baseParsed.major, baseParsed.minor, baseParsed.patch]);

  const versionString = `${majorNum}.${minorNum}.${patchNum}`;
  const isUnique = !existingVersions?.includes(versionString);

  const hintKey: 'major' | 'minor' | 'patch' | null = !baseParsed
    ? null
    : majorNum > baseParsed.major
    ? 'major'
    : minorNum > baseParsed.minor
    ? 'minor'
    : patchNum > baseParsed.patch
    ? 'patch'
    : null;

  const isValid =
    major.length > 0 && minor.length > 0 && patch.length > 0 &&
    !isNaN(majorNum) && !isNaN(minorNum) && !isNaN(patchNum) &&
    isNewer && isUnique;

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

  const stepperColumns: Array<{
    key: 'major' | 'minor' | 'patch';
    label: string;
    value: string;
    setValue: (v: string) => void;
    num: number;
    base: number | null;
  }> = [
    { key: 'major', label: t('assignVersion.major'), value: major, setValue: setMajor, num: majorNum, base: baseParsed?.major ?? null },
    { key: 'minor', label: t('assignVersion.minor'), value: minor, setValue: setMinor, num: minorNum, base: baseParsed?.minor ?? null },
    { key: 'patch', label: t('assignVersion.patch'), value: patch, setValue: setPatch, num: patchNum, base: baseParsed?.patch ?? null },
  ];

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
            {isFetchingSuggestion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `${majorNum}.${minorNum}.${patchNum}`
            )}
          </span>
        </div>
      }
      saveAction={{
        label: isProcessing ? t('assignVersion.assigning') : t('assignVersion.submitLabel'),
        onClick: handleConfirm,
        disabled: !isValid || isFetchingSuggestion,
        loading: isProcessing,
        closeOnSuccess: false,
      }}
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="flex items-start gap-2 w-full">
          {stepperColumns.map((column, index) => (
            <div key={column.key} className="contents">
              {index > 0 && <span className="text-2xl font-semibold text-gray-400 pt-7">.</span>}
              <div className="group flex flex-col gap-1 flex-1 items-center">
                <Label className="text-xs text-gray-500 font-medium text-center group-focus-within:text-blue-600 transition-colors">
                  {column.label}
                </Label>
                <div className="flex flex-col items-center gap-0.5 w-full rounded-md border border-gray-200 bg-white px-1 py-1.5 transition-colors group-focus-within:border-blue-500 group-focus-within:bg-blue-50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:cursor-pointer"
                    disabled={isProcessing || isFetchingSuggestion}
                    onClick={() => increment(column.setValue, column.value)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={column.value}
                    onChange={(e) => column.setValue(sanitize(e.target.value))}
                    className="h-8 border-0 bg-transparent px-0 text-center font-mono text-base shadow-none focus-visible:ring-0"
                    disabled={isProcessing || isFetchingSuggestion}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:cursor-pointer"
                    disabled={isProcessing || isFetchingSuggestion || column.num <= 0}
                    onClick={() => decrement(column.setValue, column.value)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                {column.base !== null && (
                  <span className="text-[11px] text-gray-400">{t('assignVersion.era', { value: column.base })}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Validation checklist */}
        <div className="flex flex-col gap-1.5 w-full">
          {baseParsed && (
            <div className={cn('flex items-center gap-1.5 text-xs', isNewer ? 'text-emerald-600' : 'text-amber-600')}>
              {isNewer ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
              <span>
                {isNewer
                  ? t('assignVersion.validation.isNewer', { version: suggestion?.based_on })
                  : t('assignVersion.validation.isNewerFail', { version: suggestion?.based_on })}
              </span>
            </div>
          )}
          <div className={cn('flex items-center gap-1.5 text-xs', isUnique ? 'text-emerald-600' : 'text-amber-600')}>
            {isUnique ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
            <span>{isUnique ? t('assignVersion.validation.isUnique') : t('assignVersion.validation.isUniqueFail')}</span>
          </div>
          {hintKey && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>{t(`assignVersion.hint.${hintKey}`)}</span>
            </div>
          )}
        </div>

        {/* Suggestion origin hint */}
        {isFetchingSuggestion ? (
          <span className="text-xs text-gray-400">{t('assignVersion.loadingSuggestion')}</span>
        ) : !isSuggestionError && suggestion ? (
          <span className="text-xs text-gray-400">
            {suggestion.based_on
              ? t('assignVersion.basedOn', { version: suggestion.based_on })
              : t('assignVersion.basedOnNone')}
          </span>
        ) : null}
      </div>
    </HuemulDialog>
  );
}
