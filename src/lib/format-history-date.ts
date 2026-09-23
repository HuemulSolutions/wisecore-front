import i18next from 'i18next';
import { parseApiDate } from '@/services/utils';

// Formateo de fecha del sheet de historial angosto — un solo formato por
// vista (agrupador de día + hora), nunca "hace 7h" junto a fechas absolutas.
// Hermano de `format-relative-time.ts`, pero ese resuelve relativo
// ("hace 3h"); acá siempre hay un ancla absoluta (día calendario + hora).

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function yesterday(reference: Date): Date {
  const d = new Date(reference);
  d.setDate(d.getDate() - 1);
  return d;
}

/**
 * "Hoy, 11:49" / "Ayer, 18:07" / "12 sept, 09:41" (año distinto: "12 sept, 09:41 2024").
 * Compara día calendario LOCAL contra `now`, no una ventana de 24h.
 */
export function formatHistoryDateTime(dateInput: Date | string, now: Date = new Date()): string {
  const date = dateInput instanceof Date ? dateInput : parseApiDate(dateInput);
  const locale = i18next.language || navigator.language || 'en-US';
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  if (isSameLocalDay(date, now)) {
    return `${i18next.t('common:relativeTime.today')}, ${time}`;
  }
  if (isSameLocalDay(date, yesterday(now))) {
    return `${i18next.t('common:relativeTime.yesterday')}, ${time}`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  const day = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  return `${day}, ${time}`;
}

/**
 * Encabezado de grupo por día: "Hoy · 16 de septiembre" / "Ayer · 15 de septiembre"
 * / "12 de septiembre" (año distinto: "12 de septiembre, 2024"). El caller la pone
 * en mayúscula con CSS (`uppercase`), no acá — mantiene el string legible en el locale.
 */
export function formatHistoryDayHeading(dateInput: Date | string, now: Date = new Date()): string {
  const date = dateInput instanceof Date ? dateInput : parseApiDate(dateInput);
  const locale = i18next.language || navigator.language || 'en-US';
  const sameYear = date.getFullYear() === now.getFullYear();
  const day = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });

  if (isSameLocalDay(date, now)) return `${i18next.t('common:relativeTime.today')} · ${day}`;
  if (isSameLocalDay(date, yesterday(now))) return `${i18next.t('common:relativeTime.yesterday')} · ${day}`;
  return day;
}

/** Duración compacta ("2d 4h" / "45m" / "<1m"). Unidades universales, no requieren i18n (ver formatBytes). */
export function formatDurationCompact(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  if (totalMinutes < 1) return "<1m";
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}
