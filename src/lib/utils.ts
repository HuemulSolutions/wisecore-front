import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the user's locale from browser settings
 */
export function getUserLocale(): string {
  return navigator.language || navigator.languages?.[0] || 'en-US';
}

/**
 * Format a date according to user's locale
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const locale = getUserLocale();
  return date.toLocaleDateString(locale, options);
}

/**
 * Format a time according to user's locale
 */
export function formatTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const locale = getUserLocale();
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  });
}

/**
 * Format a date and time together according to user's locale
 */
export function formatDateTime(date: Date, dateOptions?: Intl.DateTimeFormatOptions, timeOptions?: Intl.DateTimeFormatOptions): string {
  const locale = getUserLocale();
  const isToday = date.toDateString() === new Date().toDateString();
  
  const timeStr = formatTime(date, timeOptions);
  const dateStr = isToday ? getLocalizedToday() : formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...dateOptions
  });
  
  return `${dateStr} ${timeStr}`;
}

/**
 * Get "Today" text in user's locale
 */
export function getLocalizedToday(): string {
  const locale = getUserLocale();
  
  // Common translations for "Today"
  const todayTranslations: Record<string, string> = {
    'en': 'Today',
    'en-US': 'Today',
    'en-GB': 'Today',
    'es': 'Hoy',
    'es-ES': 'Hoy',
    'es-MX': 'Hoy',
    'es-AR': 'Hoy',
    'fr': 'Aujourd\'hui',
    'fr-FR': 'Aujourd\'hui',
    'de': 'Heute',
    'de-DE': 'Heute',
    'it': 'Oggi',
    'it-IT': 'Oggi',
    'pt': 'Hoje',
    'pt-BR': 'Hoje',
    'pt-PT': 'Hoje',
    'nl': 'Vandaag',
    'nl-NL': 'Vandaag',
    'ru': 'Сегодня',
    'ru-RU': 'Сегодня',
    'ja': '今日',
    'ja-JP': '今日',
    'ko': '오늘',
    'ko-KR': '오늘',
    'zh': '今天',
    'zh-CN': '今天',
    'zh-TW': '今天'
  };
  
  // Try exact match first, then language prefix
  return todayTranslations[locale] || 
         todayTranslations[locale.split('-')[0]] || 
         'Today';
}
