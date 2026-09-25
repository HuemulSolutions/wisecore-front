import { ApiError } from '@/types/api-error';
import type { ErrorReport } from '@/types/error-utils';

/**
 * Construye un ErrorReport a partir de un error capturado, o `null` cuando
 * el error no trae nada reportable (network errors, respuestas no
 * estandarizadas, etc.) — su nullness sirve directo de predicado para
 * decidir si mostrar la acción "Ver detalles" en el toast.
 */
export function buildErrorReport(error: unknown): ErrorReport | null {
  if (!ApiError.isApiError(error)) return null;
  if (!error.transactionId && !error.code) return null;

  return {
    message: error.message,
    code: error.code || undefined,
    detail: error.detail || undefined,
    statusCode: error.statusCode,
    path: error.path || undefined,
    transactionId: error.transactionId || undefined,
    timestamp: error.timestamp || undefined,
    capturedAt: new Date().toISOString(),
    route: window.location.pathname + window.location.search,
    appVersion: __APP_VERSION__,
  };
}

/**
 * Formatea un reporte como texto plano pegable (ticket, chat, email).
 * Los labels se traducen vía `t`, pero `message`/`detail` siempre son los
 * valores verbatim del backend — nunca se traducen.
 *
 * Sin fences de markdown: los tickets de Jira/Teams/email los renderizan
 * de forma inconsistente. Columna de labels de ancho fijo para legibilidad;
 * líneas vacías se omiten enteras.
 */
export function formatErrorReport(report: ErrorReport, t: (key: string) => string): string {
  const rows: Array<[string, string]> = [];

  const push = (labelKey: string, value: string | number | undefined) => {
    if (value === undefined || value === '') return;
    rows.push([t(labelKey), String(value)]);
  };

  push('error-details:transactionId', report.transactionId);
  push('error-details:code', report.code);
  push('error-details:statusCode', report.statusCode);
  push('error-details:message', report.message);
  push('error-details:detail', report.detail);
  push('error-details:path', report.path);
  push('error-details:timestamp', report.timestamp);
  push('error-details:appVersion', report.appVersion);
  push('error-details:route', report.route);
  push('error-details:clientTime', report.capturedAt);

  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  const indent = ' '.repeat(labelWidth + 2);

  const lines = rows.map(([label, value]) => {
    const padded = label.padEnd(labelWidth);
    const [firstLine, ...rest] = value.split('\n');
    const continuation = rest.map((line) => `${indent}${line}`).join('\n');
    return continuation ? `${padded} : ${firstLine}\n${continuation}` : `${padded} : ${firstLine}`;
  });

  const header = t('error-details:reportHeader');
  return [header, '='.repeat(header.length), ...lines].join('\n') + '\n';
}
