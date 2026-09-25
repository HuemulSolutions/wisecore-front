import { useTranslation } from 'react-i18next';
import { HomeOverviewCard, type HomeOverviewRow } from './home-overview-card';
import { HomeContinueCard } from './home-continue-card';
import { HomeGettingStartedCard } from './home-getting-started-card';
import type { UseOnboardingChecklistResult } from '@/hooks/useOnboardingChecklist';
import type { OnboardingStepId, RecentAssetEntry } from '@/types/home';

export interface HomeRailProps {
  /**
   * Primera vez del Home (checklist incompleto o completo-pero-sin-datos):
   * "Continuar donde quedaste" y "Panorama" no aportan nada en 0, así que no
   * se muestran — ver `respuestas/promp-diseno-home.md` §5.3.
   */
  isFirstTime: boolean;
  showGettingStarted: boolean;
  onboarding: UseOnboardingChecklistResult;
  onOnboardingStepAction: (stepId: OnboardingStepId) => void;
  recentAssets: RecentAssetEntry[];
  /** Pie de "Continuar donde quedaste" — ver `HomeContinueCard`. */
  onViewAllRecent?: () => void;
  showOverview: boolean;
  overviewRows: HomeOverviewRow[];
  overviewLoading: boolean;
  /** Los contadores personales del bloque "Personal" — ver `HomeOverviewCard`. */
  overviewPersonalRows?: HomeOverviewRow[];
  /** `documents/statistics` falló — ver `HomeOverviewCard`. */
  overviewError?: unknown;
  onOverviewRetry?: () => void;
  /** `false` sin `listExecutions`: el Panorama queda solo de consulta — ver `HomeOverviewCard`. */
  overviewInteractive?: boolean;
  /** Pasos del checklist que el usuario puede resolver (RBAC) — ver `HomeGettingStartedCard`. */
  stepPermissions?: Partial<Record<OnboardingStepId, boolean>>;
}

/** Rail derecho (306px) — orquesta las 3 cards según el estado de la página. */
export function HomeRail({
  isFirstTime,
  showGettingStarted,
  onboarding,
  onOnboardingStepAction,
  recentAssets,
  onViewAllRecent,
  showOverview,
  overviewRows,
  overviewLoading,
  overviewPersonalRows,
  overviewError,
  onOverviewRetry,
  overviewInteractive = true,
  stepPermissions,
}: HomeRailProps) {
  const { t } = useTranslation('home');

  return (
    <div className="flex w-[306px] shrink-0 flex-col gap-3">
      {showGettingStarted && (
        <HomeGettingStartedCard
          steps={onboarding.steps}
          dismissed={onboarding.dismissed}
          onDismiss={onboarding.dismiss}
          onResume={onboarding.resume}
          onStepAction={onOnboardingStepAction}
          stepPermissions={stepPermissions}
        />
      )}
      {!isFirstTime && <HomeContinueCard recentAssets={recentAssets} onViewAll={onViewAllRecent} />}
      {!isFirstTime && showOverview && (
        <HomeOverviewCard
          rows={overviewRows}
          isLoading={overviewLoading}
          personalRows={overviewPersonalRows}
          error={overviewError}
          onRetry={onOverviewRetry}
          interactive={overviewInteractive}
        />
      )}
      {!isFirstTime && !showOverview && (
        <div className="rounded-lg border border-dashed border-border px-4 py-3">
          <p className="text-xs font-semibold text-foreground">{t('rail.overview.unavailable.title')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('rail.overview.unavailable.description')}</p>
        </div>
      )}
    </div>
  );
}
