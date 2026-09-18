import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { toneDot, toneStyle, type ColorHue } from '@/lib/lifecycle-colors';
import { HOME_CARD_MUTED, HOME_CARD_HEADER, HOME_RAIL_TITLE } from './home-surface';

export interface HomeOverviewRow {
  key: string;
  label: string;
  value: number;
  /** Hue del dominio (ver `lifecycle-colors.ts`) — resuelve punto, fondo activo y color del valor. */
  hue: ColorHue;
  /** KPI de alarma ("Por expirar"): el valor se pinta en rojo aunque el filtro no esté aplicado. */
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
}

function OverviewRowButton({ row, isLoading }: { row: HomeOverviewRow; isLoading: boolean }) {
  return (
    <button
      type="button"
      onClick={row.onClick}
      disabled={isLoading}
      className={cn(
        'flex w-full items-center justify-between gap-2 px-4 py-2 text-left hover:cursor-pointer disabled:cursor-default',
        row.active ? toneStyle(row.hue).soft : 'hover:bg-muted',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', toneDot(row.hue))} />
        <span className={cn('truncate text-xs', row.active ? 'font-semibold' : 'text-muted-foreground')}>{row.label}</span>
      </span>
      <span
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          row.active ? '' : row.alert ? toneStyle('red').text : 'text-foreground',
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
export function HomeOverviewCard({ rows, isLoading, personalRows }: HomeOverviewCardProps) {
  const { t } = useTranslation('home');

  return (
    <div className={HOME_CARD_MUTED}>
      <div className={HOME_CARD_HEADER}>
        <span className={HOME_RAIL_TITLE}>{t('rail.overview.title')}</span>
        <span className="text-2xs text-muted-foreground">{t('rail.overview.scopeOrganization')}</span>
      </div>
      {personalRows && personalRows.length > 0 && (
        <div className="border-b border-divider pb-1">
          <div className={cn('px-4 pt-2.5 pb-1', HOME_RAIL_TITLE)}>{t('rail.overview.scopeMine')}</div>
          {personalRows.map((row) => (
            <OverviewRowButton key={row.key} row={row} isLoading={isLoading} />
          ))}
        </div>
      )}
      <div className="pb-1">
        {rows.map((row) => (
          <OverviewRowButton key={row.key} row={row} isLoading={isLoading} />
        ))}
      </div>
    </div>
  );
}
