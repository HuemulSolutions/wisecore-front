import { toast } from 'sonner';
import { ApiError } from '@/types/api-error';

/**
 * Options for handleApiError
 */
export interface HandleApiErrorOptions {
  /** Custom fallback message if error.message is not available */
  fallbackMessage?: string;
  /** Whether to show a toast notification (default: true) */
  showToast?: boolean;
  /** Whether to show the error detail as toast description (default: false) */
  showDescription?: boolean;
  /** Custom handler for specific error codes */
  onErrorCode?: (code: string) => boolean; // Return true to prevent default handling
}

/**
 * Centralized error handler for API errors
 * 
 * @param error - The error object (typically from a catch block)
 * @param options - Configuration options
 * 
 * @example
 * // Basic usage in a mutation
 * onError: (error) => {
 *   handleApiError(error);
 * }
 * 
 * @example
 * // With custom fallback message
 * onError: (error) => {
 *   handleApiError(error, { fallbackMessage: 'Failed to save changes' });
 * }
 * 
 * @example
 * // With custom error code handling
 * onError: (error) => {
 *   handleApiError(error, {
 *     onErrorCode: (code) => {
 *       if (code === 'DUPLICATE_ENTRY') {
 *         toast.warning('This item already exists');
 *         return true; // Prevent default toast
 *       }
 *       return false;
 *     }
 *   });
 * }
 */
export function handleApiError(
  error: unknown,
  options: HandleApiErrorOptions = {}
): void {
  const { 
    fallbackMessage = 'An unexpected error occurred', 
    showToast = true,
    showDescription = false,
    onErrorCode 
  } = options;

  if (ApiError.isApiError(error)) {
    // Log transaction ID for debugging/support
    console.error(`[API Error] Transaction: ${error.transactionId}`, {
      code: error.code,
      message: error.message,
      detail: error.detail,
      path: error.path,
      statusCode: error.statusCode
    });

    // Allow custom handling based on error code
    if (onErrorCode && onErrorCode(error.code)) {
      return; // Custom handler took care of it
    }

    // 401 is handled by httpClient (redirects to login)
    if (error.statusCode === 401) {
      return;
    }

    if (showToast) {
      // Use the user-friendly message from the backend
      // Optionally include detail as description when it adds useful context
      const description = showDescription && error.detail && error.detail !== error.message
        ? error.detail
        : undefined;
      toast.error(error.message, { description });
    }
    
    return;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    console.error('[Error]', error.message);
    
    if (showToast) {
      toast.error(error.message || fallbackMessage);
    }
    return;
  }

  // Handle unknown error types
  console.error('[Unknown Error]', error);
  
  if (showToast) {
    toast.error(fallbackMessage);
  }
}

/**
 * Get an appropriate error message from an error object
 * Useful when you need the message but don't want to show a toast
 * 
 * @param error - The error object
 * @param fallbackMessage - Message to return if no error message is available
 * @returns The error message string
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (ApiError.isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }
  
  return fallbackMessage;
}

/**
 * Check if an error is a specific API error code
 * 
 * @example
 * if (isErrorCode(error, 'NOT_FOUND')) {
 *   // Handle not found case
 * }
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return ApiError.isApiError(error) && error.code === code;
}

/**
 * Check if an error is a specific HTTP status code
 * 
 * @example
 * if (isStatusCode(error, 404)) {
 *   // Handle not found case
 * }
 */
export function isStatusCode(error: unknown, statusCode: number): boolean {
  return ApiError.isApiError(error) && error.statusCode === statusCode;
}

/**
 * Re-export ApiError for convenience
 */
export { ApiError };
