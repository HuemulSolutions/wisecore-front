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

/**
 * "Panorama" — los 8 KPIs pasan de grid de cards a lista vertical compacta
 * dentro del rail. A diferencia del grid viejo (`home.tsx` original), esta
 * versión **no** oculta filas en 0: el diseño pide 8 filas fijas siempre
 * visibles (ver `respuestas/promp-diseno-home.md` §4.3).
 *
 * Sin selector de alcance: `GET /documents/statistics` no acepta ningún
 * `scope` todavía (spec Punto 3, bloqueante) — probado en vivo con las 3
 * opciones, "Solo lo mío"/"Mi equipo" no traían nada distinto de
 * "Organización" y confundían más de lo que ayudaban. Queda solo el label
 * estático; cuando el Punto 3 del spec entregue `scope`, ahí sí vuelve un
 * control interactivo real.
 */
export function HomeOverviewCard({ rows, isLoading }: HomeOverviewCardProps) {
  const { t } = useTranslation('home');

  return (
    <div className="rounded-[11px] border border-[#e2e7ee] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-[15px] py-3 border-b border-[#f1f4f7]">
        <span className="text-[13px] font-semibold">{t('rail.overview.title')}</span>
        <span className="text-[11.5px] text-[#64748b]">{t('rail.overview.scopeOrganization')}</span>
      </div>
      <div className="pb-1">
        {rows.map((row) => {
          const accent = row.active ? accentStylesFor(row.dotClassName) : null;
          return (
            <button
              key={row.key}
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
                <span className={cn('truncate text-[12.5px]', accent ? cn(accent.text, 'font-semibold') : 'text-[#475569]')}>
                  {row.label}
                </span>
              </span>
              <span className={cn('shrink-0 text-[13px] font-semibold', accent ? accent.text : (row.valueClassName ?? 'text-[#0f172a]'))}>
                {isLoading ? '···' : row.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
