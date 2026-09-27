import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { cn } from '@/lib/utils';
import { HOME_CARD, HOME_CARD_MUTED, HOME_CARD_HEADER, HOME_CARD_TITLE, HOME_RAIL_TITLE } from './home-surface';
import type { OnboardingStepId, OnboardingStepState } from '@/types/home';

export interface HomeGettingStartedCardProps {
  steps: OnboardingStepState[];
  dismissed: boolean;
  onDismiss: () => void;
  onResume: () => void;
  onStepAction: (stepId: OnboardingStepId) => void;
  /**
   * Qué pasos puede resolver el usuario (RBAC). Sin permiso, el paso no lleva
   * botón sino "Lo configura un administrador" y nunca es el "siguiente".
   * Un paso ausente del mapa se asume permitido.
   */
  stepPermissions?: Partial<Record<OnboardingStepId, boolean>>;
  /**
   * `rail` (default): se monta en el rail derecho, secundaria por peso.
   * `main`: se monta en la columna principal (estado de primera vez,
   * `home.tsx`), donde es la superficie primaria — necesita elevación real.
   */
  variant?: 'main' | 'rail';
}

const STEP_ORDER: OnboardingStepId[] = ['defaultLlm', 'embeddingProvider', 'assetType', 'firstAsset', 'inviteTeam'];

function ProgressBar({ done, total, className }: { done: number; total: number; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-full bg-primary/10', className)}>
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: total ? `${(done / total) * 100}%` : 0 }} />
    </div>
  );
}

/**
 * Checklist "Puesta en marcha" (estado de primera vez del Home). No existe
 * ningún endpoint de onboarding — los pasos se derivan en
 * `useOnboardingChecklist` de endpoints ya existentes. El caller (home.tsx)
 * decide si renderizar esto: la card no se monta si `allDone` (los pasos ya
 * están cumplidos de verdad, no por localStorage).
 */
export function HomeGettingStartedCard({
  steps,
  dismissed,
  onDismiss,
  onResume,
  onStepAction,
  stepPermissions,
  variant = 'rail',
}: HomeGettingStartedCardProps) {
  const { t } = useTranslation('home');
  const doneCount = steps.filter((s) => s.done).length;
  const canResolve = (id: OnboardingStepId) => stepPermissions?.[id] !== false;
  // Calculado sobre STEP_ORDER, no sobre `steps` (el orden que devuelve el
  // hook) — son arrays potencialmente en orden distinto, comparar por índice
  // entre uno y otro daba falsos positivos de "paso actual". El "siguiente" es
  // el primer pendiente que el usuario puede resolver.
  const firstPendingStepId = STEP_ORDER.find((id) => !steps.find((s) => s.id === id)?.done && canResolve(id));
  const firstMissingStepId = STEP_ORDER.find((id) => !steps.find((s) => s.id === id)?.done);
  const isMain = variant === 'main';

  if (dismissed) {
    if (!isMain) {
      return (
        <button
          type="button"
          onClick={onResume}
          className={cn(HOME_CARD_MUTED, 'w-full px-3 py-2 text-left text-xs text-muted-foreground hover:cursor-pointer hover:bg-muted')}
        >
          {t('rail.gettingStarted.hiddenLink', { done: doneCount, total: steps.length })}
        </button>
      );
    }
    return (
      <div className={cn(HOME_CARD, 'flex items-center gap-3 px-4 py-2.5')}>
        <ProgressBar done={doneCount} total={steps.length} className="h-1 w-16 shrink-0" />
        <div className="min-w-0 flex-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{t('rail.gettingStarted.title')}</span>
          {' · '}
          {t('rail.gettingStarted.hiddenBanner', {
            done: doneCount,
            total: steps.length,
            step: firstMissingStepId ? t(`rail.gettingStarted.steps.${firstMissingStepId}.title`) : '',
          })}
        </div>
        <HuemulButton variant="outline" size="sm" className="shrink-0" label={t('rail.gettingStarted.resume')} onClick={onResume} />
      </div>
    );
  }

  return (
    <div className={isMain ? HOME_CARD : HOME_CARD_MUTED}>
      <div className={cn(HOME_CARD_HEADER, 'flex-wrap')}>
        <span className={isMain ? HOME_CARD_TITLE : HOME_RAIL_TITLE}>{t('rail.gettingStarted.title')}</span>
        <div className="flex items-center gap-2">
          <span className="text-2xs tabular-nums text-muted-foreground">
            {t('rail.gettingStarted.stepCount', { done: doneCount, total: steps.length })}
          </span>
          {isMain ? (
            <HuemulButton variant="ghost" size="sm" label={t('rail.gettingStarted.hide')} onClick={onDismiss} />
          ) : (
            <HuemulButton
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              icon={X}
              tooltip={t('rail.gettingStarted.hide')}
              onClick={onDismiss}
            />
          )}
        </div>
      </div>
      {isMain && <ProgressBar done={doneCount} total={steps.length} className="h-1 rounded-none" />}
      <div>
        {STEP_ORDER.map((stepId, index) => {
          const step = steps.find((s) => s.id === stepId);
          const isDone = step?.done ?? false;
          const isCurrent = !isDone && stepId === firstPendingStepId;
          const allowed = canResolve(stepId);
          return (
            <div
              key={stepId}
              className={cn('flex items-start gap-3 border-b border-divider px-4 py-3.5 last:border-b-0', isCurrent && 'bg-primary/[0.03]')}
            >
              <span
                className={cn(
                  'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-2xs font-semibold',
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'border border-primary text-primary'
                      : 'border border-border text-muted-foreground',
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', isDone ? 'text-muted-foreground' : 'text-foreground')}>
                  {t(`rail.gettingStarted.steps.${stepId}.title`)}
                </p>
                <p className="text-xs text-muted-foreground">{t(`rail.gettingStarted.steps.${stepId}.description`)}</p>
              </div>
              {isDone ? (
                <span className="shrink-0 text-xs text-green-600 dark:text-green-400">{t('rail.gettingStarted.done')}</span>
              ) : allowed ? (
                <HuemulButton
                  variant={isCurrent ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0"
                  label={t(`rail.gettingStarted.steps.${stepId}.action`)}
                  onClick={() => onStepAction(stepId)}
                />
              ) : (
                <span className="max-w-[9rem] shrink-0 text-right text-xs text-muted-foreground">{t('rail.gettingStarted.adminOnly')}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
