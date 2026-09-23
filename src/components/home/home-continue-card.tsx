import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '@/hooks/useOrgRouter';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { HOME_CARD_MUTED, HOME_LINK, HOME_RAIL_TITLE } from './home-surface';
import type { RecentAssetEntry } from '@/types/home';

export interface HomeContinueCardProps {
  recentAssets: RecentAssetEntry[];
  /** Pie "Ver toda tu actividad reciente" — salta a "Todos los activos" ordenada por última edición. */
  onViewAll?: () => void;
}

/**
 * "Continuar donde quedaste" — no se renderiza si no hay historial (no hay
 * CTA vacío que ofrecer acá, a diferencia de los otros dos cards del rail).
 */
export function HomeContinueCard({ recentAssets, onViewAll }: HomeContinueCardProps) {
  const { t } = useTranslation('home');
  const { t: tAssets } = useTranslation('assets');
  const navigate = useOrgNavigate();

  if (recentAssets.length === 0) return null;

  return (
    <div className={HOME_CARD_MUTED}>
      <div className="border-b border-divider px-4 py-2.5">
        <span className={HOME_RAIL_TITLE}>{t('rail.continue.title')}</span>
        <p className="text-2xs text-muted-foreground">{t('rail.continue.subtitle')}</p>
      </div>
      <div className="pb-1">
        {recentAssets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => navigate(`/asset/${asset.id}`)}
            className="flex w-full flex-col items-start gap-0.5 border-b border-divider px-4 py-2.5 text-left last:border-b-0 hover:cursor-pointer hover:bg-muted"
          >
            <span className="w-full truncate text-xs font-medium text-foreground">{asset.name}</span>
            <span className="text-2xs text-muted-foreground">
              {asset.lifecycleState
                ? tAssets(`lifecycle.stateLabels.${asset.lifecycleState}`, { defaultValue: asset.lifecycleState })
                : ''}
              {asset.lifecycleState ? ' · ' : ''}
              {formatRelativeTime(asset.viewedAt)}
            </span>
          </button>
        ))}
      </div>
      {onViewAll && (
        <div className="border-t border-divider px-4 py-2.5 text-center">
          <button type="button" onClick={onViewAll} className={HOME_LINK}>
            {t('rail.continue.viewAll')}
          </button>
        </div>
      )}
    </div>
  );
}
