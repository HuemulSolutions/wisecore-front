/**
 * Standardized API Error Response Format
 * 
 * All backend error responses follow this format:
 * {
 *   "transaction_id": "uuid-string",
 *   "status_code": 404,
 *   "timestamp": "2024-01-01T00:00:00Z",
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "User not found.",
 *     "detail": "User with ID 'abc123' does not exist.",
 *     "path": "/api/v1/users/abc123"
 *   }
 * }
 */

export interface ApiErrorDetail {
  code: string;
  message: string;
  detail: string;
  path: string;
}

export interface ApiErrorResponse {
  transaction_id: string;
  status_code: number;
  timestamp: string;
  error: ApiErrorDetail;
}

/**
 * Custom Error class for API errors
 * Extends Error to work seamlessly with try/catch and TanStack Query
 */
export class ApiError extends Error {
  readonly transactionId: string;
  readonly statusCode: number;
  readonly code: string;
  readonly detail: string;
  readonly path: string;
  readonly timestamp: string;

  constructor(response: ApiErrorResponse) {
    super(response.error.message);
    this.name = 'ApiError';
    this.transactionId = response.transaction_id;
    this.statusCode = response.status_code;
    this.code = response.error.code;
    this.detail = response.error.detail;
    this.path = response.error.path;
    this.timestamp = response.timestamp;

    // Maintain proper stack trace in V8 environments (Chrome, Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if an unknown error is an ApiError
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  /**
   * Check if an object has the shape of an ApiErrorResponse
   */
  static isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
    if (typeof obj !== 'object' || obj === null) return false;
    
    const response = obj as Record<string, unknown>;
    
    return (
      typeof response.transaction_id === 'string' &&
      typeof response.status_code === 'number' &&
      typeof response.timestamp === 'string' &&
      typeof response.error === 'object' &&
      response.error !== null &&
      typeof (response.error as Record<string, unknown>).code === 'string' &&
      typeof (response.error as Record<string, unknown>).message === 'string'
    );
  }
}
