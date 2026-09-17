import { useTranslation } from 'react-i18next';
import { HOME_LINK } from './home-surface';

export interface HomeEmptyStateProps {
  /**
   * `firstTime`: checklist de onboarding todavía incompleto (o completo pero
   * sin ningún dato en el grupo real) — sin CTA propio, el CTA vive en el
   * checklist del rail.
   * `noPending`: la organización ya tiene datos, pero el usuario no tiene
   * nada propio pendiente — con link a "Todos los activos".
   */
  variant: 'firstTime' | 'noPending';
  onViewAllAssets?: () => void;
}

/** Estado vacío de la pestaña "Mi trabajo" — ver `respuestas/promp-diseno-home.md` §5.2. */
export function HomeEmptyState({ variant, onViewAllAssets }: HomeEmptyStateProps) {
  const { t } = useTranslation('home');

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-6 text-center">
      <div
        className="h-16 w-[220px] rounded-md"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--surface-sunken) 0 8px, var(--divider) 8px 16px)',
        }}
      />
      <p className="text-sm font-semibold text-foreground">
        {t(variant === 'firstTime' ? 'emptyState.firstTime.title' : 'emptyState.noPending.title')}
      </p>
      <p className="max-w-[420px] text-xs text-muted-foreground">
        {t(variant === 'firstTime' ? 'emptyState.firstTime.description' : 'emptyState.noPending.description')}
      </p>
      {variant === 'noPending' && onViewAllAssets && (
        <button type="button" onClick={onViewAllAssets} className={HOME_LINK}>
          {t('emptyState.noPending.cta')}
        </button>
      )}
    </div>
  );
}
