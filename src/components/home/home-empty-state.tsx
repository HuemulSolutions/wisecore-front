import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { cn } from '@/lib/utils';
import { lifecycleStateSectionTone } from '@/lib/lifecycle-colors';

const FIRST_TIME_GROUPS = [
  { key: 'review', state: 'in_review' },
  { key: 'approval', state: 'in_approval' },
  { key: 'approved', state: 'approved' },
] as const;

export interface HomeEmptyStateProps {
  /**
   * `firstTime`: checklist de onboarding todavía incompleto — presenta los 3
   * grupos que va a ordenar la lista, sin CTA propio (el CTA vive en la
   * checklist).
   * `noPending`: la organización ya opera pero el usuario no tiene nada
   * propio pendiente ("Estás al día").
   */
  variant: 'firstTime' | 'noPending';
  /** CTA "Explorar todos los activos" — solo se pasa si el usuario tiene `listExecutions`. */
  onViewAllAssets?: () => void;
  /** CTA "Crear activo" — solo se pasa si el usuario tiene `createAsset`. */
  onCreateAsset?: () => void;
}

/** Estado vacío de la pestaña "Mi trabajo". */
export function HomeEmptyState({ variant, onViewAllAssets, onCreateAsset }: HomeEmptyStateProps) {
  const { t } = useTranslation('home');

  if (variant === 'noPending') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-8 text-center shadow-card">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
          <Check className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-foreground">{t('emptyState.noPending.title')}</p>
        <p className="max-w-[420px] text-xs text-muted-foreground">{t('emptyState.noPending.description')}</p>
        {(onViewAllAssets || onCreateAsset) && (
          <div className="flex items-center gap-2 pt-1">
            {onViewAllAssets && <HuemulButton variant="outline" label={t('emptyState.noPending.explore')} onClick={onViewAllAssets} />}
            {onCreateAsset && <HuemulButton label={t('emptyState.noPending.create')} onClick={onCreateAsset} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{t('emptyState.firstTime.title')}</p>
        <p className="text-xs text-muted-foreground">{t('emptyState.firstTime.description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {FIRST_TIME_GROUPS.map(({ key, state }) => {
          const tone = lifecycleStateSectionTone(state);
          return (
            <div key={key} className={cn('rounded-md border px-3 py-2.5', tone.surface, tone.headerBorder)}>
              <p className={cn('text-xs font-semibold', tone.text)}>{t(`emptyState.firstTime.groups.${key}.title`)}</p>
              <p className="text-2xs text-muted-foreground">{t(`emptyState.firstTime.groups.${key}.subtitle`)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
