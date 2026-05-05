import i18next from 'i18next';
import { parseApiDate } from '@/services/utils';

/**
 * Formats a date string from the API into a human-friendly relative time.
 *
 * - "Just now"     — less than 1 minute ago
 * - "3m ago"       — less than 60 minutes ago
 * - "2h ago"       — less than 24 hours ago
 * - "Yesterday"    — between 24 and 48 hours ago
 * - "Mar 3"        — same year, older than 48 hours
 * - "Mar 3, 2025"  — different year
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseApiDate(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  const t = (key: string, opts?: Record<string, unknown>) =>
    i18next.t(`common:relativeTime.${key}`, opts);

  if (diffMinutes < 1) return t('justNow');
  if (diffMinutes < 60) return t('minutesAgo', { count: diffMinutes });
  if (diffHours < 24) return t('hoursAgo', { count: diffHours });
  if (diffHours < 48) return t('yesterday');

  const locale = i18next.language || navigator.language || 'en-US';
  const sameYear = date.getFullYear() === now.getFullYear();

  if (sameYear) {
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
