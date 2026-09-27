import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/error-utils';
import { toneDot, toneStyle, type ColorHue } from '@/lib/lifecycle-colors';
import { useHomeCardCollapsed } from '@/hooks/useHomeCardCollapsed';
import { HOME_CARD_MUTED, HOME_RAIL_TITLE } from './home-surface';
import { HomeCollapsibleHeader } from './home-collapsible-header';

export interface HomeOverviewRow {
  key: string;
  label: string;
  value: number;
  /** Hue del dominio (ver `lifecycle-colors.ts`) — resuelve punto, fondo activo y color del valor. */
  hue: ColorHue;
  /** KPI de alarma ("Por expirar"): el valor se pinta en ámbar cuando es > 0, aunque el filtro no esté aplicado. */
  alert?: boolean;
  /** Este KPI es el filtro actualmente aplicado en "Todos los activos" — ver `selectOverviewKpi` en home.tsx. */
  active?: boolean;
  onClick: () => void;
}

export interface HomeOverviewCardProps {
  rows: HomeOverviewRow[];
  isLoading: boolean;
  /** Los 3 contadores personales (`scope=me`) — se pintan arriba, bajo su propio título. `undefined` mientras `useDocumentStatistics` no resolvió con ese scope, u oculto directamente si el caller no lo pide (ver `home.tsx`). */
  personalRows?: HomeOverviewRow[];
  /** `documents/statistics` falló — en vez de pintar los 8+3 KPIs en `0` (un dato falso), se reemplaza toda la lista por este error state con reintento. */
  error?: unknown;
  onRetry?: () => void;
  /**
   * `false` cuando el usuario no tiene `listExecutions`: los KPIs son solo
   * consulta (no hay tabla que filtrar), así que las filas no son clicables y
   * el hint lo explica.
   */
  interactive?: boolean;
}

function OverviewRowButton({ row, isLoading, interactive }: { row: HomeOverviewRow; isLoading: boolean; interactive: boolean }) {
  return (
    <button
      type="button"
      onClick={row.onClick}
      disabled={isLoading || !interactive}
      className={cn(
        'flex w-full items-center justify-between gap-2 px-4 py-2 text-left disabled:cursor-default',
        interactive && 'hover:cursor-pointer',
        row.active ? toneStyle(row.hue).soft : interactive && 'hover:bg-muted',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', toneDot(row.hue))} />
        <span className={cn('truncate text-xs', row.active ? 'font-semibold' : 'text-muted-foreground')}>{row.label}</span>
      </span>
      <span
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          row.active ? '' : row.alert && row.value > 0 ? toneStyle('amber').text : 'text-foreground',
        )}
      >
        {isLoading ? '···' : row.value}
      </span>
    </button>
  );
}

/**
 * "Panorama" — los 8 KPIs pasan de grid de cards a lista vertical compacta
 * dentro del rail. A diferencia del grid viejo (`home.tsx` original), esta
 * versión **no** oculta filas en 0: el diseño pide 8 filas fijas siempre
 * visibles (ver `respuestas/promp-diseno-home.md` §4.3).
 *
 * Sin selector de alcance interactivo: backend confirmó que `scope=team` es
 * alias exacto de `organization` (no existe concepto de equipo) y que los 8
 * contadores de siempre no cambian de valor con `scope` — un selector de 3
 * opciones sería decorativo. En su lugar, `personalRows` agrega arriba un
 * bloque corto con los 3 contadores reales que sí son relativos al usuario
 * (`scope=me`: pendientes de mi revisión/aprobación, aprobados míos); los 8
 * de abajo siguen etiquetados con el label estático "Organización".
 */
export function HomeOverviewCard({ rows, isLoading, personalRows, error, onRetry, interactive = true }: HomeOverviewCardProps) {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const [collapsed, toggleCollapsed] = useHomeCardCollapsed('overview');

  // Hint del header: explica qué pasa al clickear según el estado actual.
  const hasActive = [...rows, ...(personalRows ?? [])].some((r) => r.active);
  const hint = !interactive
    ? t('rail.overview.hintReadOnly')
    : hasActive
      ? t('rail.overview.hintActive')
      : t('rail.overview.hintDefault');

  return (
    <div className={HOME_CARD_MUTED}>
      <HomeCollapsibleHeader collapsed={collapsed} onToggle={toggleCollapsed}>
        <span className="flex items-start justify-between gap-2">
          <span className={HOME_RAIL_TITLE}>{t('rail.overview.title')}</span>
          {!collapsed && <span className="max-w-[170px] text-right text-2xs text-muted-foreground">{hint}</span>}
        </span>
      </HomeCollapsibleHeader>
      {collapsed ? null : error ? (
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-xs text-muted-foreground">{getErrorMessage(error, t('rail.overview.errorFallback'))}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {tCommon('retry')}
            </button>
          )}
        </div>
      ) : (
        <>
          {personalRows && personalRows.length > 0 && (
            <div className="border-b border-divider pb-1">
              <div className={cn('px-4 pt-2.5 pb-1', HOME_RAIL_TITLE)}>{t('rail.overview.scopeMine')}</div>
              {personalRows.map((row) => (
                <OverviewRowButton key={row.key} row={row} isLoading={isLoading} interactive={interactive} />
              ))}
            </div>
          )}
          <div className="pb-1">
            <div className={cn('px-4 pt-2.5 pb-1', HOME_RAIL_TITLE)}>{t('rail.overview.scopeOrganization')}</div>
            {rows.map((row) => (
              <OverviewRowButton key={row.key} row={row} isLoading={isLoading} interactive={interactive} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
