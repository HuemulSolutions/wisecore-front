'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATA_TABLE_SOURCES, getDataTableSource } from '@/lib/data-table-sources';
import type { DataTableElement, DataTableSourceId } from '@/types/data-table-node';
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

export type DataTableConfig = Pick<DataTableElement, 'source' | 'columns' | 'filters' | 'limit' | 'title'>;

export interface DataTableConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Config de partida — presente al reconfigurar un nodo existente, ausente al insertar uno nuevo. */
  initial?: DataTableConfig | null;
  onConfirm: (config: DataTableConfig) => void;
}

/**
 * Diálogo único para insertar o reconfigurar un nodo `data_table` — mismo componente en
 * ambos casos (ver `data-table-toolbar-button.tsx` y `data-table-node.tsx`).
 */
export function DataTableConfigDialog({ open, onOpenChange, initial, onConfirm }: DataTableConfigDialogProps) {
  const { t } = useTranslation(['editor', 'assets']);

  const [source, setSource] = React.useState<DataTableSourceId>(initial?.source ?? 'document_versions');
  const [columns, setColumns] = React.useState<string[]>(initial?.columns ?? []);
  const [lifecycleStates, setLifecycleStates] = React.useState<ExecutionLifecycleState[]>(
    initial?.filters?.lifecycleStates ?? [],
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
    setLimit(initial?.limit ? String(initial.limit) : '');
    setTitle(initial?.title ?? '');
  }, [open, initial]);

  const sourceDef = getDataTableSource(source);

  const handleSourceChange = (next: DataTableSourceId) => {
    setSource(next);
    setColumns(getDataTableSource(next)?.defaultColumns ?? []);
    setLifecycleStates([]);
  };

  const toggleColumn = (id: string, checked: boolean) => {
    setColumns((prev) => (checked ? [...prev, id] : prev.filter((c) => c !== id)));
  };

  const toggleLifecycleState = (state: ExecutionLifecycleState, checked: boolean) => {
    setLifecycleStates((prev) => (checked ? [...prev, state] : prev.filter((s) => s !== state)));
  };

  const handleConfirm = () => {
    if (!sourceDef || columns.length === 0) return;
    const parsedLimit = limit.trim() ? Math.max(1, Number.parseInt(limit, 10)) : null;
    onConfirm({
      source,
      columns,
      filters: source === 'document_versions' && lifecycleStates.length ? { lifecycleStates } : null,
      limit: Number.isNaN(parsedLimit) ? null : parsedLimit,
      title: title.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('dataTable.dialog.title')}</DialogTitle>
          <DialogDescription>{t('dataTable.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data-table-title">{t('dataTable.dialog.titleLabel')}</Label>
            <Input
              id="data-table-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('dataTable.dialog.titlePlaceholder')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('dataTable.dialog.sourceLabel')}</Label>
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
            <div className="flex flex-col gap-1.5">
              <Label>{t('dataTable.dialog.columnsLabel')}</Label>
              <div className="grid max-h-48 grid-cols-2 gap-x-3 gap-y-2 overflow-y-auto rounded-md border p-2.5">
                {sourceDef.fields.map((field) => (
                  <label key={field.id} className="flex items-center gap-2 text-sm hover:cursor-pointer">
                    <Checkbox
                      checked={columns.includes(field.id)}
                      onCheckedChange={(checked) => toggleColumn(field.id, checked === true)}
                    />
                    {t(field.labelKey)}
                  </label>
                ))}
              </div>
              {columns.length === 0 && (
                <p className="text-xs text-destructive">{t('dataTable.dialog.columnsRequired')}</p>
              )}
            </div>
          )}

          {source === 'document_versions' && (
            <div className="flex flex-col gap-1.5">
              <Label>{t('dataTable.dialog.lifecycleFilterLabel')}</Label>
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
              <p className="text-xs text-muted-foreground">{t('dataTable.dialog.lifecycleFilterHint')}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data-table-limit">{t('dataTable.dialog.limitLabel')}</Label>
            <Input
              id="data-table-limit"
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder={t('dataTable.dialog.limitPlaceholder')}
              className="max-w-32"
            />
          </div>
        </div>

        <DialogFooter>
          <HuemulButton variant="outline" onClick={() => onOpenChange(false)}>
            {t('dataTable.dialog.cancel')}
          </HuemulButton>
          <HuemulButton onClick={handleConfirm} disabled={columns.length === 0}>
            {initial ? t('dataTable.dialog.apply') : t('dataTable.dialog.insert')}
          </HuemulButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
