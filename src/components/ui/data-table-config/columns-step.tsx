import { GripVertical, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { labelForField } from '@/lib/data-table-catalog-labels';
import type { DataTableColumnSpec, DataTableFieldDef, DataTableSourceDef } from '@/types/data-table-resolve';

import { useReorderDnd } from './use-reorder-dnd';

interface ColumnsStepProps {
  sourceDef: DataTableSourceDef;
  columns: DataTableColumnSpec[];
  /** Ids que el backend omitió o que ya no existen en el catálogo. */
  orphanIds: Set<string>;
  onReorder: (from: number, to: number) => void;
  onRename: (id: string, label: string | undefined) => void;
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
}

/** Paso 2 — columnas elegidas (drag & drop, rename inline) + chips para agregar las restantes. */
export function ColumnsStep({ sourceDef, columns, orphanIds, onReorder, onRename, onRemove, onAdd }: ColumnsStepProps) {
  const { t } = useTranslation(['editor']);
  const dnd = useReorderDnd(onReorder);
  const isKeyValue = sourceDef.layout === 'keyValue';

  const availableFields = sourceDef.fields.filter((f: DataTableFieldDef) => !columns.some((c) => c.id === f.id));

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-[#64748b]">
        {isKeyValue ? t('editor:dataTable.sheet.columnsHelpKeyValue') : t('editor:dataTable.sheet.columnsHelp')}
      </p>

      {columns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#f5b5b5] bg-[#fffafa] px-3.5 py-3 text-xs text-[#b91c1c]">
          {t('editor:dataTable.sheet.columnsRequired')}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {columns.map((col, index) => {
            const field = sourceDef.fields.find((f) => f.id === col.id) ?? null;
            const defaultName = field ? labelForField(t, field) : col.id;
            const isOrphan = !field;
            const renamed = col.label !== undefined && col.label !== '' && col.label !== defaultName;
            return (
              <div
                key={col.id}
                {...dnd.getItemProps(index)}
                className={cn(
                  'group flex items-center gap-2 rounded-[9px] border bg-white py-1 pr-1.5 pl-2',
                  dnd.isDropTarget(index) ? 'border-[#2563eb]' : 'border-[#e2e8f0]',
                  dnd.isDragging(index) && 'opacity-50',
                )}
              >
                <span
                  className="cursor-grab text-[#94a3b8] active:cursor-grabbing"
                  title={t('editor:dataTable.sheet.dragHandle')}
                >
                  <GripVertical className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <input
                    value={col.label ?? defaultName}
                    onChange={(e) => onRename(col.id, e.target.value === defaultName ? undefined : e.target.value)}
                    onBlur={(e) => {
                      if (!e.target.value.trim()) onRename(col.id, undefined);
                    }}
                    disabled={isOrphan || orphanIds.has(col.id)}
                    title={isOrphan ? t('editor:dataTable.sheet.orphanColumn') : t('editor:dataTable.sheet.renamePlaceholder')}
                    className={cn(
                      'h-[30px] w-full rounded-md border border-transparent bg-transparent px-1.5 text-[13px] text-[#0f172a] outline-none',
                      'hover:border-[#e2e8f0] focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.14)]',
                      (isOrphan || orphanIds.has(col.id)) && 'italic text-[#94a3b8]',
                    )}
                  />
                  {renamed && (
                    <span className="px-1.5 text-[11.5px] text-[#94a3b8]">
                      {t('editor:dataTable.sheet.originalName', { name: defaultName })}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(col.id)}
                  title={isKeyValue ? t('editor:dataTable.sheet.removeItem') : t('editor:dataTable.sheet.removeColumn')}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-[#94a3b8] hover:cursor-pointer hover:bg-[#fef2f2] hover:text-[#b91c1c]"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {availableFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableFields.map((field) => (
            <button
              key={field.id}
              type="button"
              onClick={() => onAdd(field.id)}
              className="h-7 rounded-full border border-dashed border-[#cbd5e1] px-2.5 text-xs text-[#334155] transition-colors hover:cursor-pointer hover:border-solid hover:border-[#2563eb] hover:text-[#2563eb]"
            >
              + {labelForField(t, field)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
