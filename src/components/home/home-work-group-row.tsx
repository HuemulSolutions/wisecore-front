import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatAbsoluteDate, formatRelativeTime } from '@/lib/format-relative-time';
import { HomeAvatar } from './home-avatar';
import type { HomeWorkGroupRow as HomeWorkGroupRowData } from '@/types/home';

/** A partir de cuántos días detenido en el estado se resalta la razón temporal. */
const OVERDUE_DAYS_THRESHOLD = 5;

export interface HomeWorkGroupRowProps {
  row: HomeWorkGroupRowData;
  onOpen: () => void;
  /** Botones inline gateados por `can(...)` — vacío si el usuario no tiene permiso de acción. */
  actions?: ReactNode;
  /** Fade+slide de salida al resolverse (mismo mecanismo que `asset-form-section.tsx`). */
  isExiting?: boolean;
  /** Solo usado por el grupo "mentions" (hoy oculto, listo para cuando se active). */
  commentExcerpt?: string;
  commentAuthorName?: string;
}

/** Fila de un `HomeWorkGroupCard` — reusada por los 4 grupos de "Mi trabajo". */
export function HomeWorkGroupRow({ row, onOpen, actions, isExiting, commentExcerpt, commentAuthorName }: HomeWorkGroupRowProps) {
  const { t } = useTranslation('home');

  const temporalText = (() => {
    if (!row.temporalDate) return null;
    if (row.temporalKind === 'estimatedPublicationDate') {
      return { text: t('workGroups.common.publishesOn', { date: formatAbsoluteDate(row.temporalDate) }), overdue: false };
    }
    const days = (Date.now() - new Date(row.temporalDate).getTime()) / 86_400_000;
    if (row.temporalKind === 'sinceLifecycleState') {
      // Entrada al `lifecycle_state` actual — exacto de acá en adelante (ver
      // spec Punto 6). El resalte de "detenido hace N días" ahora sí refleja
      // tiempo en el estado, no la última edición de contenido.
      return {
        text: t('workGroups.common.pendingSince', { time: formatRelativeTime(row.temporalDate) }),
        overdue: days > OVERDUE_DAYS_THRESHOLD,
      };
    }
    // 'sinceUpdated' — fallback si `lifecycle_state_since` viniera ausente:
    // impreciso a propósito, se mueve con cualquier edición del documento, no
    // solo con la transición de estado.
    return {
      text: t('workGroups.common.updatedAgo', { time: formatRelativeTime(row.temporalDate) }),
      overdue: days > OVERDUE_DAYS_THRESHOLD,
    };
  })();

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-[#f1f4f7] px-[15px] py-3 last:border-b-0 hover:bg-[#fafbfd]',
        isExiting && 'pointer-events-none animate-out fade-out slide-out-to-top-1 duration-150',
      )}
    >
      {commentAuthorName && <HomeAvatar name={commentAuthorName} className="h-[26px] w-[26px] text-[11px]" />}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left hover:cursor-pointer">
        <p className="truncate text-[13.5px] font-medium">{row.documentName}</p>
        <p className="truncate text-[12px] text-[#64748b]">
          {[row.versionLabel, row.ownerName, row.stepName].filter(Boolean).join(' · ')}
          {temporalText && (
            <>
              {(row.versionLabel || row.ownerName || row.stepName) && ' · '}
              <span className={temporalText.overdue ? 'font-semibold text-[#b45309]' : undefined}>{temporalText.text}</span>
            </>
          )}
        </p>
        {commentExcerpt && (
          <p className="mt-1 line-clamp-2 text-[12.5px] text-[#334155]">&ldquo;{commentExcerpt}&rdquo;</p>
        )}
      </button>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}
