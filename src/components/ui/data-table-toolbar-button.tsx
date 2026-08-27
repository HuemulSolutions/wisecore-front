'use client';

import * as React from 'react';

import { Table2 } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { useTranslation } from 'react-i18next';

import { DataTableConfigDialog, type DataTableConfig } from '@/components/ui/data-table-config-dialog';
import { DATA_TABLE_KEY } from '@/lib/plate-data-table-utils';

import { ToolbarButton } from './toolbar';

/**
 * Inserta un nodo `data_table` — a diferencia de mermaid/media, la configuración (fuente +
 * columnas) se elige ANTES de insertar, en el mismo diálogo que reconfigura el nodo ya
 * insertado (`data-table-node.tsx`).
 */
export function DataTableToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const editor = useEditorRef();
  const { t } = useTranslation('editor');
  const [open, setOpen] = React.useState(false);

  const handleConfirm = React.useCallback(
    (config: DataTableConfig) => {
      editor.tf.insertNodes(
        { type: DATA_TABLE_KEY, scope: { kind: 'current' }, ...config, children: [{ text: '' }] },
        { select: true },
      );
      editor.tf.focus();
    },
    [editor],
  );

  return (
    <>
      <ToolbarButton {...props} tooltip={t('toolbar.insertDataTable')} onClick={() => setOpen(true)}>
        <Table2 />
      </ToolbarButton>

      <DataTableConfigDialog open={open} onOpenChange={setOpen} onConfirm={handleConfirm} />
    </>
  );
}
