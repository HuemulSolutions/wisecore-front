import * as React from 'react';
import { GripVertical, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { labelForField } from '@/lib/data-table-catalog-labels';
import type { DataTableFieldDef, DataTableSourceLayout } from '@/types/data-table-resolve';

import { useReorderDnd } from './use-reorder-dnd';

interface AddMenuProps {
  fields: DataTableFieldDef[];
  title: string;
  onAdd: (id: string) => void;
  children: React.ReactNode;
}

/** Menú de campos no elegidos — abre desde el «+» de los encabezados o «+ Agregar dato». */
function AddMenu({ fields, title, onAdd, children }: AddMenuProps) {
  const { t } = useTranslation(['editor']);
  const [open, setOpen] = React.useState(false);
  const disabled = fields.length === 0;

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[220px] rounded-xl border-[#e2e8f0] p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
      >
        <p className="px-2 pt-1 pb-1.5 text-[11px] font-bold tracking-wide text-[#64748b] uppercase">{title}</p>
        <div className="flex max-h-64 flex-col overflow-y-auto">
          {fields.map((field) => (
            <button
              key={field.id}
              type="button"
              onClick={() => {
                onAdd(field.id);
                setOpen(false);
              }}
              className="rounded-md px-2 py-1.5 text-left text-[13px] text-[#0f172a] hover:cursor-pointer hover:bg-[#f1f4f7]"
            >
              {labelForField(t, field)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface PreviewTableProps {
  layout: DataTableSourceLayout;
  headers: string[];
  aligns: ('left' | 'right')[];
  rows: string[][];
  /** Campos aún no elegidos, para el menú «+». */
  availableFields: DataTableFieldDef[];
  /** `false` cuando headers/columnas no se pueden emparejar — solo lectura. */
  editable: boolean;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onAdd: (id: string) => void;
}

/** Tabla de la vista previa con edición directa: reordenar y quitar columnas (`rows`) o filas
 * (`keyValue`) y agregar más. Los índices que emite son posiciones visibles (0..n-1). */
export function PreviewTable({
  layout,
  headers,
  aligns,
  rows,
  availableFields,
  editable,
  onReorder,
  onRemove,
  onAdd,
}: PreviewTableProps) {
  const { t } = useTranslation(['editor']);
  const dnd = useReorderDnd(onReorder);

  if (layout === 'keyValue') {
    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] [font-variant-numeric:tabular-nums]">
            <thead>
              <tr>
                <th className="border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-left font-semibold text-[#334155]">
                  {t('editor:dataTable.preview.keyHeader')}
                </th>
                <th className="border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-left font-semibold text-[#334155]">
                  {t('editor:dataTable.preview.valueHeader')}
                </th>
                {editable && <th className="w-9 border border-[#e2e8f0] bg-[#f8fafc]" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  {...(editable ? dnd.getItemProps(ri) : {})}
                  className={cn(
                    editable && 'cursor-grab',
                    dnd.isDragging(ri) && 'bg-[#f5f8ff]',
                    dnd.isDropTarget(ri) && 'shadow-[inset_0_2px_0_0_#2563eb]',
                  )}
                >
                  <td className="border border-[#e2e8f0] px-2.5 py-1.5 font-medium text-[#334155]">{row[0]}</td>
                  <td className="border border-[#e2e8f0] px-2.5 py-1.5 text-[#0f172a]">{row[1] || '—'}</td>
                  {editable && (
                    <td className="border border-[#e2e8f0] text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(ri)}
                        title={t('editor:dataTable.sheet.removeItem')}
                        className="inline-flex size-5 items-center justify-center rounded text-[#94a3b8] hover:cursor-pointer hover:bg-[#fef2f2] hover:text-[#b91c1c]"
                      >
                        <X className="size-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <AddMenu fields={availableFields} title={t('editor:dataTable.preview.addDataMenu')} onAdd={onAdd}>
            <button
              type="button"
              disabled={availableFields.length === 0}
              title={availableFields.length === 0 ? t('editor:dataTable.preview.noMoreFields') : undefined}
              className="flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-[#2563eb] hover:cursor-pointer hover:bg-[#eff4ff] disabled:opacity-40 disabled:hover:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Plus className="size-3.5" />
              {t('editor:dataTable.preview.addDataButton')}
            </button>
          </AddMenu>
        </div>
      </>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] [font-variant-numeric:tabular-nums]">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                {...(editable ? dnd.getItemProps(i) : {})}
                className={cn(
                  'group relative border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 font-semibold text-[#334155]',
                  aligns[i] === 'right' ? 'text-right' : 'text-left',
                  editable && 'cursor-grab',
                  dnd.isDragging(i) && 'bg-[#f5f8ff]',
                  dnd.isDropTarget(i) && 'shadow-[inset_2px_0_0_#2563eb]',
                )}
              >
                {editable && (
                  <GripVertical className="absolute top-1/2 left-0.5 hidden size-3.5 -translate-y-1/2 text-[#94a3b8] group-hover:block" />
                )}
                <span className="block flex-1 break-words">{header}</span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    title={t('editor:dataTable.sheet.removeColumn')}
                    className="absolute top-1/2 right-0.5 hidden size-5 -translate-y-1/2 items-center justify-center rounded bg-white/80 text-[#94a3b8] group-hover:flex hover:cursor-pointer hover:bg-[#fef2f2] hover:text-[#b91c1c]"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </th>
            ))}
            {editable && (
              <th className="w-9 border border-[#e2e8f0] bg-[#f8fafc] p-0 text-center">
                <AddMenu fields={availableFields} title={t('editor:dataTable.preview.addColumnMenu')} onAdd={onAdd}>
                  <button
                    type="button"
                    disabled={availableFields.length === 0}
                    title={
                      availableFields.length === 0
                        ? t('editor:dataTable.preview.noMoreFields')
                        : t('editor:dataTable.preview.addColumnMenu')
                    }
                    className="inline-flex size-7 items-center justify-center rounded-md text-[#2563eb] hover:cursor-pointer hover:bg-[#eff4ff] disabled:opacity-40 disabled:hover:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Plus className="size-4" />
                  </button>
                </AddMenu>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'border border-[#e2e8f0] px-2.5 py-1.5 align-top text-[#0f172a]',
                    aligns[ci] === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {cell || '—'}
                </td>
              ))}
              {editable && <td className="border border-[#e2e8f0]" />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
