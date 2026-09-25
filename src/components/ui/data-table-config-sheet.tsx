'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table2 } from 'lucide-react';

import { useOrganization } from '@/contexts/organization-context';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { useDataTableSources } from '@/hooks/useDataTables';
import { labelForSource } from '@/lib/data-table-catalog-labels';
import { DATA_TABLE_KEY } from '@/lib/plate-data-table-utils';
import {
  buildPreviewResolveTable,
  dataTableSpecHash,
  normalizeDataTableNode,
  type AnyDataTableElement,
} from '@/lib/data-table-node-utils';
import { useDataTablePreview } from '@/contexts/document-data-context';
import { ColumnsStep } from '@/components/ui/data-table-config/columns-step';
import { FiltersStep } from '@/components/ui/data-table-config/filters-step';
import { PresentationStep } from '@/components/ui/data-table-config/presentation-step';
import { buildDisplayTable } from '@/components/ui/data-table-config/build-display-table';
import { PreviewPanel } from '@/components/ui/data-table-config/preview-panel';
import { SourceStep } from '@/components/ui/data-table-config/source-step';
import { StepHeader } from '@/components/ui/data-table-config/step-header';
import { moveItem } from '@/components/ui/data-table-config/use-reorder-dnd';
import type { DataTableColumnSpec, DataTableSourceDef } from '@/types/data-table-resolve';
import type { DataTableConfig, DataTableElement, DataTableSnapshot } from '@/types/data-table-node';

export interface DataTableConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Config de partida — presente al reconfigurar un nodo existente, ausente al insertar uno nuevo.
   * Se normaliza al abrir (`normalizeDataTableNode`) para aceptar tanto el shape nuevo como
   * nodos legacy (`columns: string[]`, `filters` camelCase). */
  initial?: DataTableElement | DataTableConfig | null;
  /** `snapshot` viene de la última respuesta `ok` de la vista previa (o `null` si no hubo). */
  onConfirm: (config: DataTableConfig, snapshot: DataTableSnapshot | null) => void;
}

const DEFAULT_LIMIT = 10;

interface PreviousConfig {
  source: string;
  columns: DataTableColumnSpec[];
  filters: Record<string, string[]>;
  limit: number | null;
}

/**
 * Sheet único para insertar o reconfigurar un nodo `data_table` — mismo componente en ambos
 * casos (ver `data-table-toolbar-button.tsx` y `data-table-node.tsx`). Izquierda: cuatro pasos
 * numerados. Derecha: vista previa con datos reales (`useDataTablePreview`, query propia
 * debounceada) que además permite reordenar/quitar/agregar columnas directamente.
 *
 * El catálogo (fuentes/columnas/filtros) viene de `/data-table/sources` — nada hardcodeado acá.
 */
export function DataTableConfigSheet({ open, onOpenChange, initial, onConfirm }: DataTableConfigSheetProps) {
  const { t } = useTranslation(['editor', 'assets']);
  const { selectedOrganizationId } = useOrganization();
  const sourcesQuery = useDataTableSources(selectedOrganizationId || undefined);
  const sources = React.useMemo(() => sourcesQuery.data ?? [], [sourcesQuery.data]);

  const normalizedInitial = React.useMemo(
    () => (initial ? normalizeDataTableNode(initial as AnyDataTableElement) : null),
    [initial],
  );

  const getSourceDef = React.useCallback(
    (id: string): DataTableSourceDef | undefined => sources.find((s) => s.id === id),
    [sources],
  );

  const [source, setSource] = React.useState<string>(normalizedInitial?.source ?? '');
  const [columns, setColumns] = React.useState<DataTableColumnSpec[]>(normalizedInitial?.columns ?? []);
  const [filters, setFilters] = React.useState<Record<string, string[]>>(normalizedInitial?.filters ?? {});
  const [limit, setLimit] = React.useState<number | null>(normalizedInitial ? normalizedInitial.limit : DEFAULT_LIMIT);
  const [title, setTitle] = React.useState<string>(normalizedInitial?.title ?? '');
  const [refreshOnApproval, setRefreshOnApproval] = React.useState<boolean>(
    normalizedInitial?.refresh_on_approval ?? false,
  );
  const [previousConfig, setPreviousConfig] = React.useState<PreviousConfig | null>(null);

  // Reset del formulario a lo que trae el nodo (normalizado) cada vez que se abre.
  React.useEffect(() => {
    if (!open) return;
    setSource(normalizedInitial?.source ?? '');
    setColumns(normalizedInitial?.columns ?? []);
    setFilters(normalizedInitial?.filters ?? {});
    setLimit(normalizedInitial ? normalizedInitial.limit : DEFAULT_LIMIT);
    setTitle(normalizedInitial?.title ?? '');
    setRefreshOnApproval(normalizedInitial?.refresh_on_approval ?? false);
    setPreviousConfig(null);
  }, [open, normalizedInitial]);

  const sourceDef = getSourceDef(source);
  const filterDefs = sourceDef?.filters ?? [];
  const supportsLimit = sourceDef?.supports_limit ?? true;
  const effectiveLimit = supportsLimit ? limit : null;

  // ── Handlers de config ─────────────────────────────────────────────

  const handleSourceChange = (next: string) => {
    if (next === source) return;
    const nextDef = getSourceDef(next);
    if (source) setPreviousConfig({ source, columns, filters, limit });
    setSource(next);
    setColumns((nextDef?.default_columns ?? []).map((id) => ({ id })));
    setFilters({});
  };

  const handleUndoSource = () => {
    if (!previousConfig) return;
    setSource(previousConfig.source);
    setColumns(previousConfig.columns);
    setFilters(previousConfig.filters);
    setLimit(previousConfig.limit);
    setPreviousConfig(null);
  };

  const reorderColumns = (from: number, to: number) => {
    setPreviousConfig(null);
    setColumns((prev) => moveItem(prev, from, to));
  };

  const removeColumn = (id: string) => {
    setPreviousConfig(null);
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const addColumn = (id: string) => {
    setPreviousConfig(null);
    setColumns((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, { id }]));
  };

  const renameColumn = (id: string, label: string | undefined) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { id: c.id, ...(label !== undefined ? { label } : {}) } : c)));
  };

  const resetColumns = () => {
    setColumns((sourceDef?.default_columns ?? []).map((id) => ({ id })));
  };

  const setFilterValues = (filterId: string, values: string[]) => {
    setPreviousConfig(null);
    setFilters((prev) => {
      const next = { ...prev };
      if (values.every((v) => v === '')) delete next[filterId];
      else next[filterId] = values;
      return next;
    });
  };

  const activeFilterCount = Object.keys(filters).length;

  const columnsDiffer =
    !!sourceDef &&
    (columns.length !== sourceDef.default_columns.length ||
      columns.some((c, i) => c.id !== sourceDef.default_columns[i] || !!c.label));

  // ── Vista previa y guardado ─────────────────────────────────────────

  const draftElement = React.useMemo<DataTableElement>(
    () => ({
      type: DATA_TABLE_KEY,
      scope: { kind: 'current' },
      source,
      columns,
      filters,
      limit: effectiveLimit,
      title: title.trim() || null,
      refresh_on_approval: refreshOnApproval,
      children: [{ text: '' }],
    }),
    [source, columns, filters, effectiveLimit, title, refreshOnApproval],
  );
  const preview = useDataTablePreview(draftElement);

  const hasSource = !!sourceDef;
  const hasColumns = columns.length > 0;
  const canConfirm = hasSource && hasColumns;
  const disabledReason = !hasSource ? t('editor:dataTable.sheet.missingSource') : t('editor:dataTable.sheet.missingColumns');

  const handleConfirm = React.useCallback(() => {
    if (!sourceDef || columns.length === 0) return;

    const cleanColumns = columns.map((c) => {
      const label = c.label?.trim();
      return label ? { id: c.id, label } : { id: c.id };
    });
    const config: DataTableConfig = {
      source,
      columns: cleanColumns,
      filters,
      limit: effectiveLimit,
      title: title.trim() || null,
      refresh_on_approval: refreshOnApproval,
    };

    let snapshot: DataTableSnapshot | null = null;
    const display = buildDisplayTable(preview.table, sourceDef, cleanColumns, t as unknown as (key: string) => string);
    if (display && preview.resolvedAt) {
      snapshot = { headers: display.headers, rows: display.rows, captured_at: preview.resolvedAt };
    } else if (normalizedInitial?.snapshot) {
      // Sin preview `ok` (p. ej. fuera de un documento): se conserva la copia previa solo si la
      // config de datos no cambió; si cambió, `null` y el pre-save recompone el snapshot.
      const draftHash = dataTableSpecHash([
        buildPreviewResolveTable({ ...normalizedInitial, source, columns: cleanColumns, filters, limit: effectiveLimit }),
      ]);
      const initialHash = dataTableSpecHash([buildPreviewResolveTable(normalizedInitial)]);
      if (draftHash === initialHash) snapshot = normalizedInitial.snapshot;
    }

    onConfirm(config, snapshot);
  }, [
    sourceDef,
    columns,
    source,
    filters,
    effectiveLimit,
    title,
    refreshOnApproval,
    preview,
    normalizedInitial,
    onConfirm,
    t,
  ]);

  // ── Render ─────────────────────────────────────────────────────────

  const isEditing = !!initial;
  const isKeyValue = sourceDef?.layout === 'keyValue';
  const orphanIds = React.useMemo(() => new Set(preview.table?.omitted_columns ?? []), [preview.table]);

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      icon={Table2}
      iconVariant="tile"
      title={isEditing ? t('editor:dataTable.sheet.title') : t('editor:dataTable.sheet.titleInsert')}
      description={t('editor:dataTable.sheet.description')}
      size="wide"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0 lg:flex-row lg:overflow-hidden"
      onOpenAutoFocus={(e) => e.preventDefault()}
      cancelLabel={t('editor:dataTable.sheet.cancel')}
      footerLeft={
        <p className="text-xs text-[#64748b]">
          {isEditing ? t('editor:dataTable.sheet.footerNoteConfigure') : t('editor:dataTable.sheet.footerNoteInsert')}
        </p>
      }
      saveAction={{
        label: isEditing ? t('editor:dataTable.sheet.apply') : t('editor:dataTable.sheet.insert'),
        onClick: handleConfirm,
        disabled: !canConfirm,
        title: canConfirm ? undefined : disabledReason,
      }}
    >
      {/* ── Config ─────────────────────────────────────────────────────── */}
      <aside className="flex w-full shrink-0 flex-col gap-[26px] overflow-y-auto border-b border-[#eef1f5] px-7 pt-[22px] pb-7 lg:min-h-0 lg:w-[470px] lg:border-r lg:border-b-0">
        <section className="flex flex-col gap-3">
          <StepHeader number={1} title={t('editor:dataTable.sheet.steps.source')} done={hasSource} />
          <SourceStep
            sources={sources}
            isLoading={sourcesQuery.isPending}
            value={source}
            onChange={handleSourceChange}
            changedNotice={previousConfig && sourceDef ? { sourceLabel: labelForSource(t, sourceDef) } : null}
            onUndo={handleUndoSource}
          />
        </section>

        <section className="flex flex-col gap-3">
          <StepHeader
            number={2}
            title={isKeyValue ? t('editor:dataTable.sheet.steps.columnsKeyValue') : t('editor:dataTable.sheet.steps.columns')}
            done={hasColumns}
            ghost={!hasSource}
            actionLabel={columnsDiffer ? t('editor:dataTable.sheet.reset') : undefined}
            onAction={resetColumns}
          />
          {hasSource && (
            <ColumnsStep
              sourceDef={sourceDef}
              columns={columns}
              orphanIds={orphanIds}
              onReorder={reorderColumns}
              onRename={renameColumn}
              onRemove={removeColumn}
              onAdd={addColumn}
            />
          )}
        </section>

        <section className="flex flex-col gap-3">
          <StepHeader
            number={3}
            title={t('editor:dataTable.sheet.steps.filters')}
            done={hasSource}
            ghost={!hasSource}
            summary={
              filterDefs.length > 0
                ? activeFilterCount > 0
                  ? t('editor:dataTable.sheet.filtersActive', { n: activeFilterCount })
                  : t('editor:dataTable.sheet.filtersNone')
                : undefined
            }
            actionLabel={activeFilterCount > 0 ? t('editor:dataTable.sheet.clearAll') : undefined}
            onAction={() => setFilters({})}
          />
          {hasSource && <FiltersStep filterDefs={filterDefs} filters={filters} onChange={setFilterValues} />}
        </section>

        <section className="flex flex-col gap-3">
          <StepHeader
            number={4}
            title={t('editor:dataTable.sheet.steps.presentation')}
            done={hasSource}
            ghost={!hasSource}
            summary={t('editor:dataTable.sheet.optional')}
          />
          {hasSource && (
            <PresentationStep
              title={title}
              onTitleChange={setTitle}
              supportsLimit={supportsLimit}
              limit={limit}
              onLimitChange={setLimit}
              refreshOnApproval={refreshOnApproval}
              onRefreshOnApprovalChange={setRefreshOnApproval}
            />
          )}
        </section>

        {!hasSource && <p className="text-xs text-[#64748b]">{t('editor:dataTable.sheet.ghostNote')}</p>}
      </aside>

      {/* ── Preview ────────────────────────────────────────────────────── */}
      <section className="min-h-0 min-w-0 flex-1 overflow-auto bg-[#f6f7f9] px-[26px] py-[22px] lg:border-l lg:border-[#eef1f5]">
        <PreviewPanel
          sourceDef={sourceDef}
          columns={columns}
          title={title}
          limit={effectiveLimit}
          activeFilterCount={activeFilterCount}
          refreshOnApproval={refreshOnApproval}
          preview={preview}
          onReorder={reorderColumns}
          onRemoveColumn={removeColumn}
          onAddColumn={addColumn}
          onClearFilters={() => setFilters({})}
        />
      </section>
    </HuemulSheet>
  );
}
