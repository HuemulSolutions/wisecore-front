import { useTranslation } from 'react-i18next';
import { FileUp, Plus, RefreshCw } from 'lucide-react';
import { HuemulButton } from '@/huemul/components/huemul-button';
import type { HomeWorkGroupCount } from '@/types/home';

export interface HomeHeaderProps {
  greetingPeriod: 'morning' | 'afternoon' | 'evening';
  /** Estado de primera vez (checklist incompleto + "Mi trabajo" vacío) — cambia saludo y subtítulo, ver home.tsx. */
  isFirstTime: boolean;
  /** Cantidad de pasos del checklist — interpola el subtítulo de primera vez, nunca hardcodear "N pasos". */
  onboardingStepsCount: number;
  userName: string;
  formattedDate: string;
  /** `null` = todavía no resolvió ningún grupo real — no se reclama un total. */
  pendingCount: HomeWorkGroupCount | null;
  /** Solo se muestra cuando `pendingCount.exact` — ver home.tsx. `null` = se omite la cláusula. */
  dueSoonCount: number | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  canUpload: boolean;
  onUpload: () => void;
  canCreate: boolean;
  onCreate: () => void;
  canListNotifications: boolean;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
}

/**
 * Header custom (no `PageHeader`) — mismo precedente que ya documentaba
 * `ia context/refresh-button-guide.md` §2 para este archivo:
 * `PageHeaderProps` no tiene slot para contenido debajo del título (los tabs
 * necesitan vivir ahí), así que se mantiene la construcción a mano.
 *
 * El botón "Revisiones Pendientes" se elimina en este rediseño — el panel
 * (`ChangeHistoryPanel`) pasa a vivir solo en la pestaña "Actividad del
 * equipo".
 */
export function HomeHeader({
  greetingPeriod,
  isFirstTime,
  onboardingStepsCount,
  userName,
  formattedDate,
  pendingCount,
  dueSoonCount,
  isRefreshing,
  onRefresh,
  canUpload,
  onUpload,
  canCreate,
  onCreate,
  canListNotifications,
  unreadNotificationsCount,
  onOpenNotifications,
}: HomeHeaderProps) {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');

  return (
    <div className="flex flex-col gap-1 px-4 md:px-6 pt-4 pb-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-[-0.015em]">
          {isFirstTime ? t('greeting.welcome', { name: userName }) : t(`greeting.${greetingPeriod}`, { name: userName })}
        </h1>
        <div className="flex items-center gap-2">
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            icon={RefreshCw}
            tooltip={tCommon('refresh')}
            loading={isRefreshing}
            onClick={onRefresh}
          />
          {/* En primera vez duplican el paso 2 del checklist ("Crear") — se ocultan para no repetir la misma acción dos veces en la misma pantalla. */}
          {!isFirstTime && canUpload && <HuemulButton variant="outline" icon={FileUp} label={t('actions.uploadDocument')} onClick={onUpload} />}
          {!isFirstTime && canCreate && <HuemulButton icon={Plus} label={t('actions.createAsset')} onClick={onCreate} />}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {isFirstTime ? (
          t('rail.gettingStarted.subtitle', { count: onboardingStepsCount })
        ) : (
          <>
            {pendingCount && (
              <>
                {pendingCount.exact ? (
                  <>
                    {t('subtitle.pendingPrefix')} <span className="font-semibold text-foreground">{pendingCount.value}</span>{' '}
                    {t('subtitle.pendingSuffix')}
                    {dueSoonCount !== null && dueSoonCount > 0 && (
                      <>
                        {', '}
                        <span className="font-semibold text-foreground">{dueSoonCount}</span> {t('subtitle.dueSoonSuffix')}
                      </>
                    )}
                  </>
                ) : (
                  t('subtitle.pendingUnknown')
                )}
                {' · '}
              </>
            )}
            {formattedDate}
            {canListNotifications && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="text-primary underline-offset-2 hover:underline transition-colors"
                >
                  {t('greeting.unreadNotifications', { count: unreadNotificationsCount })}
                </button>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}
