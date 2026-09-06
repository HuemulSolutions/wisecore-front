import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '@/hooks/useOrgRouter';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { RecentAssetEntry } from '@/types/home';

export interface HomeContinueCardProps {
  recentAssets: RecentAssetEntry[];
}

/**
 * "Continuar donde quedaste" — no se renderiza si no hay historial (no hay
 * CTA vacío que ofrecer acá, a diferencia de los otros dos cards del rail).
 */
export function HomeContinueCard({ recentAssets }: HomeContinueCardProps) {
  const { t } = useTranslation('home');
  const { t: tAssets } = useTranslation('assets');
  const navigate = useOrgNavigate();

  if (recentAssets.length === 0) return null;

  return (
    <div className="rounded-[11px] border border-[#e2e7ee] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="px-[15px] py-3 border-b border-[#f1f4f7]">
        <span className="text-[13px] font-semibold">{t('rail.continue.title')}</span>
      </div>
      <div className="pb-1">
        {recentAssets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => navigate(`/asset/${asset.id}`)}
            className="flex w-full flex-col items-start gap-0.5 px-[14px] py-[10px] text-left border-b border-[#f6f8fa] last:border-b-0 hover:bg-[#fafbfd] hover:cursor-pointer"
          >
            <span className="truncate text-[12.5px] font-medium">{asset.name}</span>
            <span className="text-[11.5px] text-[#94a3b8]">
              {asset.lifecycleState
                ? tAssets(`lifecycle.stateLabels.${asset.lifecycleState}`, { defaultValue: asset.lifecycleState })
                : ''}
              {asset.lifecycleState ? ' · ' : ''}
              {formatRelativeTime(asset.viewedAt)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
