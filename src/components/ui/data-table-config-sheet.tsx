'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, RefreshCw, Table2, X } from 'lucide-react';

import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATA_TABLE_SOURCES, getDataTableSource, type DataTableFieldDef } from '@/lib/data-table-sources';
import { DATA_TABLE_KEY } from '@/lib/plate-data-table-utils';
import { DataTableNodeBody } from '@/components/ui/data-table-node-grid';
import { useResolvedDataTable } from '@/contexts/document-data-context';
import type { DataTableConfig, DataTableElement, DataTableSourceId } from '@/types/data-table-node';
import type { ExecutionLifecycleState } from '@/types/execution';

const LIFECYCLE_STATES: ExecutionLifecycleState[] = [
  'draft',
  'in_review',
  'in_approval',
  'approved',
  'published',
  'archived',
  'finalized',
];

const RELATIONSHIP_DIRECTIONS: ('source' | 'target')[] = ['source', 'target'];

export interface DataTableConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Config de partida — presente al reconfigurar un nodo existente, ausente al insertar uno nuevo. */
  initial?: DataTableConfig | null;
  onConfirm: (config: DataTableConfig) => void;
}

function parseLimit(raw: string): number | null {
  if (!raw.trim()) return null;
  const parsed = Math.max(1, Number.parseInt(raw, 10));
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Sheet único para insertar o reconfigurar un nodo `data_table` — mismo componente en ambos
 * casos (ver `data-table-toolbar-button.tsx` y `data-table-node.tsx`). Reemplaza al dialog
 * angosto original: dos columnas, config a la izquierda y previsualización en vivo a la derecha,
 * armada con el mismo `DataTableNodeBody` que pinta el nodo ya insertado.
 */
export function DataTableConfigSheet({ open, onOpenChange, initial, onConfirm }: DataTableConfigSheetProps) {
  const { t } = useTranslation(['editor', 'assets']);
  const queryClient = useQueryClient();

  const [source, setSource] = React.useState<DataTableSourceId>(initial?.source ?? 'document_versions');
  const [columns, setColumns] = React.useState<string[]>(initial?.columns ?? []);
  const [lifecycleStates, setLifecycleStates] = React.useState<ExecutionLifecycleState[]>(
    initial?.filters?.lifecycleStates ?? [],
  );
  const [relationshipDirections, setRelationshipDirections] = React.useState<('source' | 'target')[]>(
    initial?.filters?.relationshipDirections ?? [],
  );
  const [limit, setLimit] = React.useState<string>(initial?.limit ? String(initial.limit) : '');
  const [title, setTitle] = React.useState<string>(initial?.title ?? '');

  // Reset del formulario a lo que trae el nodo (o los defaults de la fuente) cada vez que se abre.
  React.useEffect(() => {
    if (!open) return;
    const nextSource = initial?.source ?? 'document_versions';
    setSource(nextSource);
    setColumns(initial?.columns ?? getDataTableSource(nextSource)?.defaultColumns ?? []);
    setLifecycleStates(initial?.filters?.lifecycleStates ?? []);
    setRelationshipDirections(initial?.filters?.relationshipDirections ?? []);
    setLimit(initial?.limit ? String(initial.limit) : '');
    setTitle(initial?.title ?? '');
  }, [open, initial]);

  const sourceDef = getDataTableSource(source);
  const filterKinds = sourceDef?.filterKinds ?? [];

  const handleSourceChange = (next: DataTableSourceId) => {
    setSource(next);
    setColumns(getDataTableSource(next)?.defaultColumns ?? []);
    setLifecycleStates([]);
    setRelationshipDirections([]);
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
    setColumns((prev) => prev.filter((c) => c !== id));
  };

  const addColumn = (id: string) => {
    setColumns((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const toggleLifecycleState = (state: ExecutionLifecycleState, checked: boolean) => {
    setLifecycleStates((prev) => (checked ? [...prev, state] : prev.filter((s) => s !== state)));
  };

  const toggleRelationshipDirection = (direction: 'source' | 'target', checked: boolean) => {
    setRelationshipDirections((prev) => (checked ? [...prev, direction] : prev.filter((d) => d !== direction)));
  };

  const draftFilters = React.useMemo(() => {
    const filters: DataTableConfig['filters'] = {};
    if (filterKinds.includes('lifecycleStates') && lifecycleStates.length) filters.lifecycleStates = lifecycleStates;
    if (filterKinds.includes('relationshipDirections') && relationshipDirections.length) {
      filters.relationshipDirections = relationshipDirections;
    }
    return Object.keys(filters).length ? filters : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKinds.join('|'), lifecycleStates, relationshipDirections]);

  const parsedLimit = React.useMemo(() => parseLimit(limit), [limit]);

  const draftElement = React.useMemo<DataTableElement>(
    () => ({
      type: DATA_TABLE_KEY,
      scope: { kind: 'current' },
      source,
      columns,
      filters: draftFilters,
      limit: parsedLimit,
      title: title.trim() || null,
      children: [{ text: '' }],
    }),
    [source, columns, draftFilters, parsedLimit, title],
  );
  const resolved = useResolvedDataTable(draftElement);

  const handleRefreshPreview = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['document-content'] });
    void queryClient.invalidateQueries({ queryKey: ['executions'] });
    void queryClient.invalidateQueries({ queryKey: ['execution-relationships'] });
    void queryClient.invalidateQueries({ queryKey: ['document-types'] });
  }, [queryClient]);

  const handleConfirm = React.useCallback(() => {
    if (!sourceDef || columns.length === 0) return;
    onConfirm({
      source,
      columns,
      filters: draftFilters,
      limit: parsedLimit,
      title: title.trim() || null,
    });
  }, [sourceDef, columns, source, draftFilters, parsedLimit, title, onConfirm]);

  const chosenFields = columns.map((id) => ({ id, field: sourceDef?.fields.find((f) => f.id === id) ?? null }));
  const availableFields = (sourceDef?.fields ?? []).filter((f: DataTableFieldDef) => !columns.includes(f.id));

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
          <Select value={source} onValueChange={(v) => handleSourceChange(v as DataTableSourceId)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_TABLE_SOURCES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {t(s.labelKey)}
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
                {chosenFields.map(({ id, field }, index) => (
                  <div key={id} className="flex items-center gap-1 rounded px-1 py-1 text-sm hover:bg-accent/40">
                    <span className={`flex-1 truncate ${field ? '' : 'italic text-muted-foreground'}`}>
                      {field ? t(field.labelKey) : id}
                    </span>
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
                      onClick={() => removeColumn(id)}
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
                      {t(field.labelKey)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {filterKinds.includes('lifecycleStates') && (
          <div className="flex flex-col gap-1.5">
            <Label>{t('dataTable.sheet.lifecycleFilterLabel')}</Label>
            <div className="flex flex-wrap gap-x-3 gap-y-2 rounded-md border p-2.5">
              {LIFECYCLE_STATES.map((state) => (
                <label key={state} className="flex items-center gap-1.5 text-sm hover:cursor-pointer">
                  <Checkbox
                    checked={lifecycleStates.includes(state)}
                    onCheckedChange={(checked) => toggleLifecycleState(state, checked === true)}
                  />
                  {t(`assets:lifecycle.stateLabels.${state}`, { defaultValue: state })}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t('dataTable.sheet.lifecycleFilterHint')}</p>
          </div>
        )}

        {filterKinds.includes('relationshipDirections') && (
          <div className="flex flex-col gap-1.5">
            <Label>{t('dataTable.sheet.directionFilterLabel')}</Label>
            <div className="flex flex-wrap gap-x-3 gap-y-2 rounded-md border p-2.5">
              {RELATIONSHIP_DIRECTIONS.map((direction) => (
                <label key={direction} className="flex items-center gap-1.5 text-sm hover:cursor-pointer">
                  <Checkbox
                    checked={relationshipDirections.includes(direction)}
                    onCheckedChange={(checked) => toggleRelationshipDirection(direction, checked === true)}
                  />
                  {t(direction === 'source' ? 'dataTable.values.directionOutgoing' : 'dataTable.values.directionIncoming')}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t('dataTable.sheet.directionFilterHint')}</p>
          </div>
        )}

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
        {resolved.isLoading && resolved.rows.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('dataTable.preview.noContext')}</p>
        )}
      </section>
    </HuemulSheet>
  );
}
