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
  showOverview: boolean;
  overviewRows: HomeOverviewRow[];
  overviewLoading: boolean;
}

/** Rail derecho (306px) — orquesta las 3 cards según el estado de la página. */
export function HomeRail({
  isFirstTime,
  showGettingStarted,
  onboarding,
  onOnboardingStepAction,
  recentAssets,
  showOverview,
  overviewRows,
  overviewLoading,
}: HomeRailProps) {
  return (
    <div className="flex w-[306px] shrink-0 flex-col gap-3.5">
      {showGettingStarted && (
        <HomeGettingStartedCard
          steps={onboarding.steps}
          dismissed={onboarding.dismissed}
          onDismiss={onboarding.dismiss}
          onResume={onboarding.resume}
          onStepAction={onOnboardingStepAction}
        />
      )}
      {!isFirstTime && <HomeContinueCard recentAssets={recentAssets} />}
      {!isFirstTime && showOverview && <HomeOverviewCard rows={overviewRows} isLoading={overviewLoading} />}
    </div>
  );
}
