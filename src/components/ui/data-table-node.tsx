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
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { NodeFloatingToolbarContent } from '@/components/ui/node-floating-toolbar';
import { Popover, PopoverAnchor } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { DataTableConfigSheet } from '@/components/ui/data-table-config-sheet';
import { DataTableNodeBody } from '@/components/ui/data-table-node-grid';
import { useResolvedDataTable } from '@/contexts/document-data-context';
import { dataTableQueryKeys } from '@/hooks/useDataTables';
import type { DataTableConfig, DataTableElement } from '@/types/data-table-node';

export function DataTableElementNode(props: PlateElementProps<DataTableElement>) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const selected = useSelected();
  const isFocusedLast = useFocusedLast();
  const element = useElement<DataTableElement>();
  const { t } = useTranslation('editor');
  const queryClient = useQueryClient();
  const [configOpen, setConfigOpen] = React.useState(false);

  const resolved = useResolvedDataTable(element);

  const selectionCollapsed = useEditorSelector((ed) => !ed.api.isExpanded(), []);
  const open = isFocusedLast && !readOnly && selected && selectionCollapsed;

  const removeNode = React.useCallback(() => {
    const path = editor.api.findPath(element);
    if (path) editor.tf.removeNodes({ at: path });
  }, [editor, element]);

  const handleRefresh = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: dataTableQueryKeys.resolveBase() });
  }, [queryClient]);

  const handleConfirmConfig = React.useCallback(
    (config: DataTableConfig) => {
      const path = editor.api.findPath(element);
      if (path) editor.tf.setNodes(config, { at: path });
    },
    [editor, element],
  );

  const content = (
    <PlateElement {...props} className="py-2.5">
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
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs hover:cursor-pointer"
                onClick={handleRefresh}
              >
                <RefreshCw className="size-3.5" />
                {t('dataTable.actions.refresh')}
              </Button>

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
      />
    </>
  );
}
