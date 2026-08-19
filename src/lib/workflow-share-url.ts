// Rutas de la vista "responder" a pantalla completa de un workflow, ver
// ia context/fullscreen-share-route-guide.md. El primer segmento DEBE ser
// "workflow": scripts/validate-rbac.mjs mapea rutas de App.tsx a RBAC_PAGES
// por el primer segmento del path, así que estas dos rutas heredan
// RBAC_PAGES.workflow sin tocar la matriz.
export const WORKFLOW_SHARE_TEMPLATE_PATH = "workflow/share/template"
export const WORKFLOW_SHARE_EXECUTION_PATH = "workflow/share/execution"

/**
 * Link a compartir para iniciar un express nuevo desde un template. Cada
 * persona que lo abre crea SU propio documento (modelo Google Forms).
 * Lleva document_type_id además de template_id porque GET /templates/ solo
 * lo devuelve filtrando por mostrar_en_workflow=true (ver WorkflowTemplateItem).
 */
export function buildTemplateShareUrl(
  organizationId: string,
  documentTypeId: string,
  templateId: string,
): string {
  return `${window.location.origin}/${organizationId}/${WORKFLOW_SHARE_TEMPLATE_PATH}/${documentTypeId}/${templateId}`
}

/**
 * Link a compartir para responder una ejecución ya existente (fila de la
 * tabla). Todos los que lo abren responden el MISMO documento.
 */
export function buildExecutionShareUrl(
  organizationId: string,
  documentId: string,
  executionId: string,
): string {
  return `${window.location.origin}/${organizationId}/${WORKFLOW_SHARE_EXECUTION_PATH}/${documentId}/${executionId}`
}
