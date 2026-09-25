import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatAbsoluteDate, formatRelativeTime } from '@/lib/format-relative-time';
import { HomeAvatar } from './home-avatar';
import { HOME_ROW, HOME_ROW_TITLE, HOME_ROW_META } from './home-surface';
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
        'flex items-center gap-3',
        HOME_ROW,
        isExiting && 'pointer-events-none animate-out fade-out slide-out-to-top-1 duration-150',
      )}
    >
      {commentAuthorName && <HomeAvatar name={commentAuthorName} className="h-6.5 w-6.5 text-2xs" />}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left hover:cursor-pointer">
        <p className={HOME_ROW_TITLE}>{row.documentName}</p>
        <p className={HOME_ROW_META}>
          {[row.versionLabel, row.ownerName, row.stepName].filter(Boolean).join(' · ')}
          {temporalText && (
            <>
              {(row.versionLabel || row.ownerName || row.stepName) && ' · '}
              <span className={temporalText.overdue ? 'font-semibold text-red-700 dark:text-red-400' : undefined}>{temporalText.text}</span>
            </>
          )}
        </p>
        {commentExcerpt && (
          <p className="mt-1 line-clamp-2 text-xs text-foreground">&ldquo;{commentExcerpt}&rdquo;</p>
        )}
      </button>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}
