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

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return 'Yesterday';

  const locale = navigator.language || navigator.languages?.[0] || 'en-US';
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
