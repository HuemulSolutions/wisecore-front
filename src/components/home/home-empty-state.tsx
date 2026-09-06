import { useTranslation } from 'react-i18next';

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
    <div className="flex flex-col items-center gap-3 rounded-[11px] border border-dashed border-[#d4dbe4] bg-white px-[26px] py-[26px] text-center">
      <div
        className="h-16 w-[220px] rounded-md"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #f7f9fb 0 8px, #f1f4f8 8px 16px)',
        }}
      />
      <p className="text-[13.5px] font-semibold">
        {t(variant === 'firstTime' ? 'emptyState.firstTime.title' : 'emptyState.noPending.title')}
      </p>
      <p className="max-w-[420px] text-[12.5px] text-[#64748b]">
        {t(variant === 'firstTime' ? 'emptyState.firstTime.description' : 'emptyState.noPending.description')}
      </p>
      {variant === 'noPending' && onViewAllAssets && (
        <button
          type="button"
          onClick={onViewAllAssets}
          className="text-[12.5px] font-medium text-[#2563eb] hover:cursor-pointer hover:underline"
        >
          {t('emptyState.noPending.cta')}
        </button>
      )}
    </div>
  );
}
