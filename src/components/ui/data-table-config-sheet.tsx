'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, RefreshCw, Table2, Undo2, X } from 'lucide-react';

import { useOrganization } from '@/contexts/organization-context';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataTableSources, dataTableQueryKeys } from '@/hooks/useDataTables';
import {
  labelForSource,
  labelForField,
  labelForFilter,
  labelForFilterOption,
  hintForFilter,
} from '@/lib/data-table-catalog-labels';
import { DATA_TABLE_KEY } from '@/lib/plate-data-table-utils';
import { normalizeDataTableNode, type AnyDataTableElement } from '@/lib/data-table-node-utils';
import { DataTableNodeBody } from '@/components/ui/data-table-node-grid';
import { useDataTablePreview } from '@/contexts/document-data-context';
import type { DataTableColumnSpec, DataTableFieldDef, DataTableSourceDef } from '@/types/data-table-resolve';
import type { DataTableConfig, DataTableElement } from '@/types/data-table-node';

export interface DataTableConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Config de partida — presente al reconfigurar un nodo existente, ausente al insertar uno nuevo.
   * Se normaliza al abrir (`normalizeDataTableNode`) para aceptar tanto el shape nuevo como
   * nodos legacy (`columns: string[]`, `filters` camelCase). */
  initial?: DataTableElement | DataTableConfig | null;
  onConfirm: (config: DataTableConfig) => void;
}

function parseLimit(raw: string): number | null {
  if (!raw.trim()) return null;
  const parsed = Math.max(1, Number.parseInt(raw, 10));
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Sheet único para insertar o reconfigurar un nodo `data_table` — mismo componente en ambos
 * casos (ver `data-table-toolbar-button.tsx` y `data-table-node.tsx`). Dos columnas: config a
 * la izquierda y previsualización en vivo a la derecha (armada con el mismo `DataTableNodeBody`
 * que pinta el nodo ya insertado, vía `useDataTablePreview` — una query propia debounceada que
 * no se une al batch del resto del documento).
 *
 * El catálogo (fuentes/columnas/filtros) viene de `/data-table/sources` — nada hardcodeado acá.
 */
export function DataTableConfigSheet({ open, onOpenChange, initial, onConfirm }: DataTableConfigSheetProps) {
  const { t } = useTranslation(['editor', 'assets']);
  const queryClient = useQueryClient();
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

  const [source, setSource] = React.useState<string>(normalizedInitial?.source || 'document_versions');
  const [columns, setColumns] = React.useState<DataTableColumnSpec[]>(normalizedInitial?.columns ?? []);
  const [filters, setFilters] = React.useState<Record<string, string[]>>(normalizedInitial?.filters ?? {});
  const [limit, setLimit] = React.useState<string>(normalizedInitial?.limit ? String(normalizedInitial.limit) : '');
  const [title, setTitle] = React.useState<string>(normalizedInitial?.title ?? '');
  const [refreshOnApproval, setRefreshOnApproval] = React.useState<boolean>(
    normalizedInitial?.refresh_on_approval ?? false,
  );

  // Reset del formulario a lo que trae el nodo (normalizado) cada vez que se abre.
  React.useEffect(() => {
    if (!open) return;
    const nextSource = normalizedInitial?.source || 'document_versions';
    setSource(nextSource);
    setColumns(
      normalizedInitial?.columns.length
        ? normalizedInitial.columns
        : (getSourceDef(nextSource)?.default_columns ?? []).map((id) => ({ id })),
    );
    setFilters(normalizedInitial?.filters ?? {});
    setLimit(normalizedInitial?.limit ? String(normalizedInitial.limit) : '');
    setTitle(normalizedInitial?.title ?? '');
    setRefreshOnApproval(normalizedInitial?.refresh_on_approval ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, normalizedInitial]);

  const sourceDef = getSourceDef(source);
  const filterDefs = (sourceDef?.filters ?? []).filter((f) => f.kind === 'multi_enum');

  const handleSourceChange = (next: string) => {
    setSource(next);
    setColumns((getSourceDef(next)?.default_columns ?? []).map((id) => ({ id })));
    setFilters({});
  };

  const moveColumn = (index: number, offset: -1 | 1) => {
    setColumns((prev) => {
      const next = [...prev];
      const target = index + offset;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeColumn = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const addColumn = (id: string) => {
    setColumns((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, { id }]));
  };

  const renameColumn = (id: string, label: string) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, label: label.trim() || undefined } : c)));
  };

  const toggleFilterValue = (filterId: string, value: string, checked: boolean) => {
    setFilters((prev) => {
      const current = new Set(prev[filterId] ?? []);
      if (checked) current.add(value);
      else current.delete(value);
      const next = { ...prev };
      if (current.size) next[filterId] = [...current];
      else delete next[filterId];
      return next;
    });
  };

  const parsedLimit = React.useMemo(() => parseLimit(limit), [limit]);

  const draftElement = React.useMemo<DataTableElement>(
    () => ({
      type: DATA_TABLE_KEY,
      scope: { kind: 'current' },
      source,
      columns,
      filters,
      limit: parsedLimit,
      title: title.trim() || null,
      refresh_on_approval: refreshOnApproval,
      children: [{ text: '' }],
    }),
    [source, columns, filters, parsedLimit, title, refreshOnApproval],
  );
  const resolved = useDataTablePreview(draftElement);

  const handleRefreshPreview = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: dataTableQueryKeys.previewBase() });
  }, [queryClient]);

  const handleConfirm = React.useCallback(() => {
    if (!sourceDef || columns.length === 0) return;
    onConfirm({
      source,
      columns,
      filters,
      limit: parsedLimit,
      title: title.trim() || null,
      refresh_on_approval: refreshOnApproval,
    });
  }, [sourceDef, columns, source, filters, parsedLimit, title, refreshOnApproval, onConfirm]);

  const orphanColumnIds = React.useMemo(() => {
    const ids = new Set(resolved.omittedColumns);
    for (const col of columns) {
      if (!sourceDef?.fields.some((f) => f.id === col.id)) ids.add(col.id);
    }
    return ids;
  }, [columns, sourceDef, resolved.omittedColumns]);

  const chosenFields = columns.map((col) => ({
    col,
    field: sourceDef?.fields.find((f) => f.id === col.id) ?? null,
    isOrphan: orphanColumnIds.has(col.id),
  }));
  const availableFields = (sourceDef?.fields ?? []).filter((f: DataTableFieldDef) => !columns.some((c) => c.id === f.id));

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      icon={Table2}
      iconVariant="tile"
      title={t('dataTable.sheet.title')}
      description={t('dataTable.sheet.description')}
      size="wide"
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0 lg:flex-row lg:overflow-hidden"
      onOpenAutoFocus={(e) => e.preventDefault()}
      cancelLabel={t('dataTable.sheet.cancel')}
      saveAction={{
        label: initial ? t('dataTable.sheet.apply') : t('dataTable.sheet.insert'),
        onClick: handleConfirm,
        disabled: columns.length === 0,
      }}
    >
      {/* ── Config ─────────────────────────────────────────────────────── */}
      <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-b p-6 lg:w-100 lg:min-h-0 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="data-table-title">{t('dataTable.sheet.titleLabel')}</Label>
          <Input
            id="data-table-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('dataTable.sheet.titlePlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('dataTable.sheet.sourceLabel')}</Label>
          <Select value={source} onValueChange={handleSourceChange} disabled={sourcesQuery.isPending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {labelForSource(t, s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {sourceDef && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t('dataTable.sheet.columnsChosen')}</Label>
              <div className="flex flex-col gap-1 rounded-md border p-2">
                {chosenFields.length === 0 && (
                  <p className="px-1 py-1 text-xs text-muted-foreground">{t('dataTable.sheet.columnsRequired')}</p>
                )}
                {chosenFields.map(({ col, field, isOrphan }, index) => (
                  <div key={col.id} className="flex items-center gap-1 rounded px-1 py-1 text-sm hover:bg-accent/40">
                    <Input
                      value={col.label ?? ''}
                      onChange={(e) => renameColumn(col.id, e.target.value)}
                      placeholder={field ? labelForField(t, field) : col.id}
                      disabled={isOrphan}
                      title={isOrphan ? t('dataTable.sheet.orphanColumn') : t('dataTable.sheet.renamePlaceholder')}
                      className={`h-7 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-1 ${
                        isOrphan ? 'italic text-muted-foreground' : ''
                      }`}
                    />
                    {col.label && !isOrphan && (
                      <HuemulButton
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        icon={Undo2}
                        iconClassName="h-3.5 w-3.5"
                        tooltip={t('dataTable.sheet.resetColumnLabel')}
                        onClick={() => renameColumn(col.id, '')}
                      />
                    )}
                    <HuemulButton
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      icon={ChevronUp}
                      iconClassName="h-3.5 w-3.5"
                      tooltip={t('dataTable.sheet.moveColumnUp')}
                      disabled={index === 0}
                      onClick={() => moveColumn(index, -1)}
                    />
                    <HuemulButton
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      icon={ChevronDown}
                      iconClassName="h-3.5 w-3.5"
                      tooltip={t('dataTable.sheet.moveColumnDown')}
                      disabled={index === chosenFields.length - 1}
                      onClick={() => moveColumn(index, 1)}
                    />
                    <HuemulButton
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      icon={X}
                      iconClassName="h-3.5 w-3.5"
                      tooltip={t('dataTable.sheet.removeColumn')}
                      onClick={() => removeColumn(col.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {availableFields.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>{t('dataTable.sheet.columnsAvailable')}</Label>
                <div className="grid max-h-40 grid-cols-2 gap-x-3 gap-y-2 overflow-y-auto rounded-md border p-2.5">
                  {availableFields.map((field) => (
                    <label key={field.id} className="flex items-center gap-2 text-sm hover:cursor-pointer">
                      <Checkbox checked={false} onCheckedChange={() => addColumn(field.id)} />
                      {labelForField(t, field)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {filterDefs.map((filterDef) => (
          <div key={filterDef.id} className="flex flex-col gap-1.5">
            <Label>{labelForFilter(t, filterDef)}</Label>
            <div className="flex flex-wrap gap-x-3 gap-y-2 rounded-md border p-2.5">
              {(filterDef.options ?? []).map((option) => (
                <label key={option.value} className="flex items-center gap-1.5 text-sm hover:cursor-pointer">
                  <Checkbox
                    checked={(filters[filterDef.id] ?? []).includes(option.value)}
                    onCheckedChange={(checked) => toggleFilterValue(filterDef.id, option.value, checked === true)}
                  />
                  {labelForFilterOption(t, filterDef.id, option)}
                </label>
              ))}
            </div>
            {hintForFilter(t, filterDef) && (
              <p className="text-xs text-muted-foreground">{hintForFilter(t, filterDef)}</p>
            )}
          </div>
        ))}

        {sourceDef?.supports_limit && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data-table-limit">{t('dataTable.sheet.limitLabel')}</Label>
            <Input
              id="data-table-limit"
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder={t('dataTable.sheet.limitPlaceholder')}
              className="max-w-32"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2 text-sm hover:cursor-pointer">
            <Checkbox
              checked={refreshOnApproval}
              onCheckedChange={(checked) => setRefreshOnApproval(checked === true)}
              className="mt-0.5"
            />
            <span>
              {t('dataTable.sheet.refreshOnApproval')}
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {t('dataTable.sheet.refreshOnApprovalHint')}
              </span>
            </span>
          </label>
        </div>
      </aside>

      {/* ── Preview ────────────────────────────────────────────────────── */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-auto bg-muted/40 p-6">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">{t('dataTable.preview.title')}</Label>
          <HuemulButton
            variant="ghost"
            size="icon"
            icon={RefreshCw}
            iconClassName="h-3.5 w-3.5"
            tooltip={t('dataTable.preview.refresh')}
            onClick={handleRefreshPreview}
          />
        </div>
        <DataTableNodeBody resolved={resolved} title={title.trim() || null} />
      </section>
    </HuemulSheet>
  );
}
