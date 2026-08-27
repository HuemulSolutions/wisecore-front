/**
 * Catálogo declarativo de fuentes de datos para el nodo Plate `data_table`
 * (ver `src/components/ui/data-table-node.tsx`). Agregar una fuente nueva o
 * una columna nueva a una fuente existente se hace acá — el nodo, el diálogo
 * de configuración y la serialización a Markdown no cambian.
 */
import { formatDate, formatApiDateTime, parseApiDate } from '@/lib/utils';
import { getExecutionCompactLabel } from '@/components/assets/content/utils/version-utils';
import type { AssetContentResponse } from '@/types/assets';
import type { DataTableExecutionRow, DataTableSourceId } from '@/types/data-table-node';

export type DataTableDocumentContent = AssetContentResponse['data'];

/** Firma mínima de `t` que necesitan los accessors — evita acoplar el catálogo al tipo
 * completo (con overloads) de `TFunction` de `react-i18next`. */
export type DataTableTranslate = (key: string, options?: Record<string, unknown>) => string;

/** Datos frescos disponibles para resolver una fuente — ver `document-data-context.tsx`. */
export interface DataTableContext {
  t: DataTableTranslate;
  documentContent: DataTableDocumentContent | null | undefined;
  executions: DataTableExecutionRow[] | null | undefined;
}

export interface DataTableFieldDef {
  id: string;
  labelKey: string;
  align?: 'left' | 'right';
  /** Siempre devuelve el valor ya formateado para mostrar; '' cuando no hay dato. */
  accessor: (row: unknown, ctx: DataTableContext) => string;
}

export interface DataTableSourceDef {
  id: DataTableSourceId;
  labelKey: string;
  /** `rows`: cada fila del catálogo es un registro (ej. una versión). `keyValue`: una sola
   * fila lógica, cada campo del catálogo se muestra como par nombre/valor. */
  layout: 'rows' | 'keyValue';
  fields: DataTableFieldDef[];
  defaultColumns: string[];
  getRows: (ctx: DataTableContext) => unknown[];
}

const dateField = (value: string | null | undefined): string =>
  value ? formatDate(parseApiDate(value), { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const dateTimeField = (value: string | null | undefined): string =>
  value ? formatApiDateTime(value) : '';

const userField = (user: { name: string; last_name: string } | null | undefined): string =>
  user ? `${user.name} ${user.last_name}`.trim() : '';

const lifecycleStateLabel = (state: string | null | undefined, t: DataTableTranslate): string =>
  state ? t(`assets:lifecycle.stateLabels.${state}`, { defaultValue: state }) : '';

const versionsSource: DataTableSourceDef = {
  id: 'document_versions',
  labelKey: 'dataTable.sources.documentVersions',
  layout: 'rows',
  getRows: (ctx) => ctx.executions ?? [],
  defaultColumns: ['version', 'created_at', 'created_by_user_name', 'lifecycle_state', 'change_summary'],
  fields: [
    {
      id: 'version',
      labelKey: 'dataTable.fields.version',
      accessor: (row) => getExecutionCompactLabel(row as DataTableExecutionRow),
    },
    {
      id: 'name',
      labelKey: 'dataTable.fields.name',
      accessor: (row) => (row as DataTableExecutionRow).name ?? '',
    },
    {
      id: 'lifecycle_state',
      labelKey: 'dataTable.fields.lifecycleState',
      accessor: (row, ctx) => lifecycleStateLabel((row as DataTableExecutionRow).lifecycle_state, ctx.t),
    },
    {
      id: 'created_at',
      labelKey: 'dataTable.fields.createdAt',
      accessor: (row) => dateTimeField((row as DataTableExecutionRow).created_at),
    },
    {
      id: 'updated_at',
      labelKey: 'dataTable.fields.updatedAt',
      accessor: (row) => dateTimeField((row as DataTableExecutionRow).updated_at),
    },
    {
      id: 'created_by_user_name',
      labelKey: 'dataTable.fields.createdBy',
      accessor: (row) => userField((row as DataTableExecutionRow).created_by_user),
    },
    {
      id: 'updated_by_user_name',
      labelKey: 'dataTable.fields.updatedBy',
      accessor: (row) => userField((row as DataTableExecutionRow).updated_by_user),
    },
    {
      id: 'change_summary',
      labelKey: 'dataTable.fields.changeSummary',
      accessor: (row) => (row as DataTableExecutionRow).change_summary ?? '',
    },
    {
      id: 'review_date',
      labelKey: 'dataTable.fields.reviewDate',
      accessor: (row) => dateField((row as DataTableExecutionRow).review_date),
    },
    {
      id: 'audit_date',
      labelKey: 'dataTable.fields.auditDate',
      accessor: (row) => dateField((row as DataTableExecutionRow).audit_date),
    },
    {
      id: 'expiration_date',
      labelKey: 'dataTable.fields.expirationDate',
      accessor: (row) => dateField((row as DataTableExecutionRow).expiration_date),
    },
    {
      id: 'estimated_publication_date',
      labelKey: 'dataTable.fields.estimatedPublicationDate',
      accessor: (row) => dateField((row as DataTableExecutionRow).estimated_publication_date),
    },
  ],
};

/** Fila única sintética — el layout `keyValue` la recorre campo a campo, no fila a fila. */
const metadataSource: DataTableSourceDef = {
  id: 'document_metadata',
  labelKey: 'dataTable.sources.documentMetadata',
  layout: 'keyValue',
  getRows: (ctx) => (ctx.documentContent ? [ctx.documentContent] : []),
  defaultColumns: ['document_name', 'document_type', 'internal_code', 'lifecycle_state', 'current_version'],
  fields: [
    {
      id: 'document_name',
      labelKey: 'dataTable.fields.documentName',
      accessor: (row) => (row as DataTableDocumentContent).document_name ?? '',
    },
    {
      id: 'internal_code',
      labelKey: 'dataTable.fields.internalCode',
      accessor: (row) => (row as DataTableDocumentContent).internal_code ?? '',
    },
    {
      id: 'description',
      labelKey: 'dataTable.fields.description',
      accessor: (row) => (row as DataTableDocumentContent).description ?? '',
    },
    {
      id: 'document_type',
      labelKey: 'dataTable.fields.documentType',
      accessor: (row) => (row as DataTableDocumentContent).document_type?.name ?? '',
    },
    {
      id: 'template_name',
      labelKey: 'dataTable.fields.templateName',
      accessor: (row) => (row as DataTableDocumentContent).template_name ?? '',
    },
    {
      id: 'access_level',
      labelKey: 'dataTable.fields.accessLevel',
      accessor: (row) => (row as DataTableDocumentContent).access_level ?? '',
    },
    {
      id: 'execution_name',
      labelKey: 'dataTable.fields.executionName',
      accessor: (row) => (row as DataTableDocumentContent).execution_name ?? '',
    },
    {
      id: 'current_version',
      labelKey: 'dataTable.fields.currentVersion',
      accessor: (row) => {
        const content = row as DataTableDocumentContent;
        const current = content.executions?.find((e) => e.id === content.execution_id);
        return current ? getExecutionCompactLabel(current) : (content.lifecycle_status?.version ?? '');
      },
    },
    {
      id: 'lifecycle_state',
      labelKey: 'dataTable.fields.lifecycleState',
      accessor: (row, ctx) => lifecycleStateLabel((row as DataTableDocumentContent).lifecycle_status?.state, ctx.t),
    },
    {
      id: 'created_by_user',
      labelKey: 'dataTable.fields.createdBy',
      accessor: (row) => userField((row as DataTableDocumentContent).created_by_user),
    },
    {
      id: 'updated_by_user',
      labelKey: 'dataTable.fields.updatedBy',
      accessor: (row) => userField((row as DataTableDocumentContent).updated_by_user),
    },
  ],
};

export const DATA_TABLE_SOURCES: DataTableSourceDef[] = [versionsSource, metadataSource];

export function getDataTableSource(id: DataTableSourceId): DataTableSourceDef | undefined {
  return DATA_TABLE_SOURCES.find((s) => s.id === id);
}
