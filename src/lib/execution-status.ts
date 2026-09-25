/**
 * Constantes de estado de ejecución, compartidas entre el polling de estado
 * global (`GET /execution/{id}/status`) y el de estado por sección
 * (`GET /execution/{id}/sections_status`).
 *
 * Antes cada consumidor (banners, hooks de polling) declaraba su propio array
 * de estados terminales, y divergían entre sí: algunos incluían 'cancelled'
 * entre los fallos, otros no; 'import_failed' solo aparecía en un lugar.
 * Centralizado acá para que un ajuste del contrato del backend se actualice
 * en un solo sitio.
 */
import type { ExecutionSectionStatusValue } from '@/types/execution';

export const EXECUTION_SUCCESS_TERMINAL = ['completed', 'done', 'approved'] as const;
export const EXECUTION_FAILURE_TERMINAL = ['failed', 'cancelled', 'import_failed'] as const;
export const SECTION_TERMINAL_STATUSES: ExecutionSectionStatusValue[] = ['done', 'failed'];

export function isExecutionSuccessTerminal(status?: string | null): boolean {
  return !!status && (EXECUTION_SUCCESS_TERMINAL as readonly string[]).includes(status);
}

export function isExecutionFailureTerminal(status?: string | null): boolean {
  return !!status && (EXECUTION_FAILURE_TERMINAL as readonly string[]).includes(status);
}

export function isExecutionTerminal(status?: string | null): boolean {
  return isExecutionSuccessTerminal(status) || isExecutionFailureTerminal(status);
}

export function isSectionTerminal(status?: ExecutionSectionStatusValue): boolean {
  return !!status && SECTION_TERMINAL_STATUSES.includes(status);
}
