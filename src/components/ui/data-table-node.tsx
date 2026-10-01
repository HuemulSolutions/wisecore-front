'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';
import {
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  useReadOnly,
  useSelected,
} from 'platejs/react';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { NodeFloatingToolbarContent } from '@/components/ui/node-floating-toolbar';
import { Popover, PopoverAnchor } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { DataTableConfigSheet } from '@/components/ui/data-table-config-sheet';
import { DataTableNodeBody } from '@/components/ui/data-table-node-grid';
import { useDataTableRefresh, useResolvedDataTable } from '@/contexts/document-data-context';
import { cn } from '@/lib/utils';
import type { DataTableConfig, DataTableElement, DataTableSnapshot } from '@/types/data-table-node';

export function DataTableElementNode(props: PlateElementProps<DataTableElement>) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const selected = useSelected();
  const isFocusedLast = useFocusedLast();
  const element = useElement<DataTableElement>();
  const { t } = useTranslation('editor');
  const { refresh, isFetching } = useDataTableRefresh();
  const [configOpen, setConfigOpen] = React.useState(false);

  const resolved = useResolvedDataTable(element);

  const selectionCollapsed = useEditorSelector((ed) => !ed.api.isExpanded(), []);
  const open = isFocusedLast && !readOnly && selected && selectionCollapsed;

  const removeNode = React.useCallback(() => {
    const path = editor.api.findPath(element);
    if (path) editor.tf.removeNodes({ at: path });
  }, [editor, element]);

  const handleRefresh = React.useCallback(() => {
    void refresh?.();
  }, [refresh]);

  const handleConfirmConfig = React.useCallback(
    (config: DataTableConfig, snapshot: DataTableSnapshot | null) => {
      const path = editor.api.findPath(element);
      if (path) editor.tf.setNodes({ ...config, snapshot }, { at: path });
    },
    [editor, element],
  );

  // Al cerrar el sheet Radix devolvería el foco al botón "Configurar" (que se desmonta junto con el
  // toolbar); se manda al editor con el nodo seleccionado para que el toolbar reaparezca.
  const handleCloseAutoFocus = React.useCallback(
    (event: Event) => {
      event.preventDefault();
      const path = editor.api.findPath(element);
      const start = path ? editor.api.start(path) : undefined;
      if (start) editor.tf.select(start);
      editor.tf.focus();
    },
    [editor, element],
  );

  const content = (
    <PlateElement {...props} className="max-w-full overflow-x-auto py-5">
      <div contentEditable={false}>
        <DataTableNodeBody resolved={resolved} title={element.title} />
      </div>
      {props.children}
    </PlateElement>
  );

  return (
    <>
      {readOnly ? (
        content
      ) : (
        <Popover open={open} modal={false}>
          <PopoverAnchor asChild>{content}</PopoverAnchor>
          <NodeFloatingToolbarContent contentEditable={false} onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs hover:cursor-pointer"
                onClick={() => setConfigOpen(true)}
              >
                <Pencil className="size-3.5" />
                {t('dataTable.actions.configure')}
              </Button>
              {refresh && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs hover:cursor-pointer"
                  onClick={handleRefresh}
                  disabled={isFetching}
                >
                  <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
                  {t('dataTable.actions.refresh')}
                </Button>
              )}

              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button
                size="icon"
                variant="ghost"
                className="size-8 hover:cursor-pointer"
                onClick={removeNode}
                title={t('dataTable.actions.remove')}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </NodeFloatingToolbarContent>
        </Popover>
      )}

      <DataTableConfigSheet
        open={configOpen}
        onOpenChange={setConfigOpen}
        initial={element}
        onConfirm={handleConfirmConfig}
        onCloseAutoFocus={handleCloseAutoFocus}
      />
    </>
  );
}
