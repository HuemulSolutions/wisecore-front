export interface HandleApiErrorOptions {
  /** Custom fallback message if error.message is not available */
  fallbackMessage?: string;
  /** Whether to show a toast notification (default: true) */
  showToast?: boolean;
  /** Whether to show the error detail as toast description (default: true) */
  showDescription?: boolean;
  /** Custom handler for specific error codes */
  onErrorCode?: (code: string) => boolean;
  /** Muestra la acción "Ver detalles" en el toast, que abre el dialog de reporte (default: true) */
  showDetailsAction?: boolean;
}

/**
 * Datos capturados de un error para mostrarlos/copiarlos en el dialog de
 * detalles. `message` y `detail` se muestran verbatim como los envía el
 * backend — nunca se traducen.
 */
export interface ErrorReport {
  message: string;
  code?: string;
  detail?: string;
  statusCode?: number;
  path?: string;
  transactionId?: string;
  /** Timestamp ISO del servidor */
  timestamp?: string;
  /** Timestamp ISO del cliente, al momento de construir el reporte */
  capturedAt: string;
  /** Ruta de la UI (distinta del `path` de la API) */
  route?: string;
  appVersion?: string;
}
