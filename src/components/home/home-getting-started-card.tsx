import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { cn } from '@/lib/utils';
import type { OnboardingStepId, OnboardingStepState } from '@/types/home';

export interface HomeGettingStartedCardProps {
  steps: OnboardingStepState[];
  dismissed: boolean;
  onDismiss: () => void;
  onResume: () => void;
  onStepAction: (stepId: OnboardingStepId) => void;
}

const STEP_ORDER: OnboardingStepId[] = ['defaultLlm', 'embeddingProvider', 'assetType', 'firstAsset', 'inviteTeam'];

/**
 * Checklist "Puesta en marcha" (estado de primera vez del Home). No existe
 * ningún endpoint de onboarding — los 3 pasos se derivan en
 * `useOnboardingChecklist` de endpoints ya existentes. El caller (home.tsx)
 * decide si renderizar esto: la card no se monta si `allDone` (los pasos ya
 * están cumplidos de verdad, no por localStorage).
 */
export function HomeGettingStartedCard({ steps, dismissed, onDismiss, onResume, onStepAction }: HomeGettingStartedCardProps) {
  const { t } = useTranslation('home');
  const doneCount = steps.filter((s) => s.done).length;
  // Calculado sobre STEP_ORDER, no sobre `steps` (el orden que devuelve el
  // hook) — son arrays potencialmente en orden distinto, comparar por índice
  // entre uno y otro daba falsos positivos de "paso actual".
  const firstPendingStepId = STEP_ORDER.find((id) => !steps.find((s) => s.id === id)?.done);

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={onResume}
        className="w-full rounded-[8px] border border-[#e2e7ee] bg-white px-3 py-2 text-left text-[12px] text-[#475569] hover:bg-[#fafbfd] hover:cursor-pointer"
      >
        {t('rail.gettingStarted.dismissBanner', { done: doneCount, total: steps.length })}
      </button>
    );
  }

  return (
    <div className="rounded-[11px] border border-[#e2e7ee] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-[15px] py-3 border-b border-[#f1f4f7]">
        <span className="text-[13.5px] font-semibold">{t('rail.gettingStarted.title')}</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#64748b]">
            {t('rail.gettingStarted.stepCount', { done: doneCount, total: steps.length })}
          </span>
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            icon={X}
            tooltip={t('rail.gettingStarted.dismissBanner', { done: doneCount, total: steps.length })}
            onClick={onDismiss}
          />
        </div>
      </div>
      <div>
        {STEP_ORDER.map((stepId, index) => {
          const step = steps.find((s) => s.id === stepId);
          const isDone = step?.done ?? false;
          const isCurrent = !isDone && stepId === firstPendingStepId;
          return (
            <div
              key={stepId}
              className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f1f4f7] last:border-b-0"
            >
              <span
                className={cn(
                  'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  isDone
                    ? 'bg-[#2563eb] text-white'
                    : isCurrent
                      ? 'border border-[#2563eb] text-[#2563eb]'
                      : 'border border-[#cbd5e1] text-[#94a3b8]',
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{t(`rail.gettingStarted.steps.${stepId}.title`)}</p>
                <p className="text-[12px] text-[#64748b]">{t(`rail.gettingStarted.steps.${stepId}.description`)}</p>
              </div>
              <HuemulButton
                variant={isCurrent ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                label={t(`rail.gettingStarted.steps.${stepId}.action`)}
                disabled={isDone}
                onClick={() => onStepAction(stepId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
