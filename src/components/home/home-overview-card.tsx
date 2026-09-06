import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface HomeOverviewRow {
  key: string;
  label: string;
  value: number;
  /** Clase Tailwind del punto de color (hex arbitrario — replica el mock exacto). */
  dotClassName: string;
  /** Override de color del número (solo "Por expirar" lo usa cuando no está activa). */
  valueClassName?: string;
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

// Fondo/texto de la fila activa, derivado del mismo hex que ya trae
// `row.dotClassName` (formato `bg-[#rrggbb]`) — evita sumar 2 props más por
// fila solo para el estado activo. Mismo espíritu que `activeBg`/`activeBorder`
// de `COLOR_CLASSES` en huemul-stat-card.tsx, con los hex exactos de este mock
// (no coinciden con los hues nombrados de esa paleta).
const ACCENT_STYLES: Record<string, { bg: string; text: string }> = {
  '#2563eb': { bg: 'bg-[#eff6ff]', text: 'text-[#2563eb]' },
  '#f59e0b': { bg: 'bg-[#fffbeb]', text: 'text-[#b45309]' },
  '#7c3aed': { bg: 'bg-[#f5f3ff]', text: 'text-[#7c3aed]' },
  '#16a34a': { bg: 'bg-[#f0fdf4]', text: 'text-[#16a34a]' },
  '#b45309': { bg: 'bg-[#fffbeb]', text: 'text-[#b45309]' },
  '#db2777': { bg: 'bg-[#fdf2f8]', text: 'text-[#db2777]' },
};
const DEFAULT_ACCENT = { bg: 'bg-[#eff6ff]', text: 'text-[#2563eb]' };

function accentStylesFor(dotClassName: string) {
  const match = dotClassName.match(/#([0-9a-fA-F]{6})/);
  const hex = match ? `#${match[1]}` : undefined;
  return (hex && ACCENT_STYLES[hex]) || DEFAULT_ACCENT;
}

function OverviewRowButton({ row, isLoading }: { row: HomeOverviewRow; isLoading: boolean }) {
  const accent = row.active ? accentStylesFor(row.dotClassName) : null;
  return (
    <button
      type="button"
      onClick={row.onClick}
      disabled={isLoading}
      className={cn(
        'flex w-full items-center justify-between gap-2 px-[15px] py-[7px] text-left hover:cursor-pointer disabled:cursor-default',
        accent ? accent.bg : 'hover:bg-[#fafbfd]',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', row.dotClassName)} />
        <span className={cn('truncate text-[12.5px]', accent ? cn(accent.text, 'font-semibold') : 'text-[#475569]')}>{row.label}</span>
      </span>
      <span className={cn('shrink-0 text-[13px] font-semibold', accent ? accent.text : (row.valueClassName ?? 'text-[#0f172a]'))}>
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
    <div className="rounded-[11px] border border-[#e2e7ee] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-[15px] py-3 border-b border-[#f1f4f7]">
        <span className="text-[13px] font-semibold">{t('rail.overview.title')}</span>
        <span className="text-[11.5px] text-[#64748b]">{t('rail.overview.scopeOrganization')}</span>
      </div>
      {personalRows && personalRows.length > 0 && (
        <div className="border-b border-[#f1f4f7] pb-1">
          <div className="px-[15px] pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            {t('rail.overview.scopeMine')}
          </div>
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
