export interface HandleApiErrorOptions {
  /** Custom fallback message if error.message is not available */
  fallbackMessage?: string;
  /** Whether to show a toast notification (default: true) */
  showToast?: boolean;
  /** Whether to show the error detail as toast description (default: true) */
  showDescription?: boolean;
  /** Custom handler for specific error codes */
  onErrorCode?: (code: string) => boolean;
}
