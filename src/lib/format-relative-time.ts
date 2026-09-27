import i18next from 'i18next';
import { parseApiDate } from '@/services/utils';

export interface FormatRelativeTimeOptions {
  /** Format for the month in absolute dates. Default: 'long' ("mayo") */
  monthFormat?: 'short' | 'long';
  /** Include the time (HH:mm) in absolute dates. Default: false */
  showTime?: boolean;
  /** Skip relative labels and always render an absolute date. Default: false */
  absolute?: boolean;
}

export type RelativeTimeBucket =
  | { kind: 'justNow' }
  | { kind: 'minutes'; count: number }
  | { kind: 'hours'; count: number }
  | { kind: 'yesterday' }
  | { kind: 'date'; date: string };

/**
 * Misma clasificación que `formatRelativeTime`, pero sin texto: para copys que
 * necesitan armar su propia frase ("en espera desde ayer") en vez de
 * concatenar el resultado ya redactado ("Ayer") dentro de otra frase.
 */
export function getRelativeTimeBucket(dateInput: Date | string): RelativeTimeBucket {
  const date = dateInput instanceof Date ? dateInput : parseApiDate(dateInput);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMinutes < 1) return { kind: 'justNow' };
  if (diffMinutes < 60) return { kind: 'minutes', count: diffMinutes };
  if (diffHours < 24) return { kind: 'hours', count: diffHours };
  if (diffHours < 48) return { kind: 'yesterday' };
  return { kind: 'date', date: formatRelativeTime(date, { absolute: true }) };
}

/**
 * Formats a date string from the API into a human-friendly relative time.
 *
 * - "Just now"       — less than 1 minute ago
 * - "3m ago"         — less than 60 minutes ago
 * - "2h ago"         — less than 24 hours ago
 * - "Yesterday"      — between 24 and 48 hours ago
 * - "20 de mayo"     — same year, older than 48 hours  (monthFormat:'long')
 * - "20 may"         — same year, older than 48 hours  (monthFormat:'short')
 * - "20 de mayo, 2025" — different year
 */
export function formatRelativeTime(dateInput: Date | string, options: FormatRelativeTimeOptions = {}): string {
  const { monthFormat = 'long', showTime = false, absolute = false } = options;

  const date = dateInput instanceof Date ? dateInput : parseApiDate(dateInput);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  const locale = i18next.language || navigator.language || 'en-US';

  if (!absolute) {
    const t = (key: string, opts?: Record<string, unknown>) =>
      i18next.t(`common:relativeTime.${key}`, opts);

    if (diffMinutes < 1) return t('justNow');
    if (diffMinutes < 60) return t('minutesAgo', { count: diffMinutes });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    if (diffHours < 48) return t('yesterday');
  }

  const timeOptions: Intl.DateTimeFormatOptions = showTime
    ? { hour: '2-digit', minute: '2-digit' }
    : {};

  const sameYear = date.getFullYear() === now.getFullYear();

  if (sameYear) {
    return date.toLocaleDateString(locale, { month: monthFormat, day: 'numeric', ...timeOptions });
  }

  return date.toLocaleDateString(locale, {
    month: monthFormat,
    day: 'numeric',
    year: 'numeric',
    ...timeOptions,
  });
}

/**
 * Formats a date string as a locale-aware absolute date (no relative time).
 * Uses the browser's language setting.
 */
export function formatAbsoluteDate(dateInput: Date | string): string {
  const date = dateInput instanceof Date ? dateInput : parseApiDate(dateInput);
  const locale = navigator.language || 'en-US';
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
