'use client';

import * as React from 'react';

import type { TComboboxInputElement, TMentionElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { IS_APPLE, KEYS } from 'platejs';
import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from 'platejs/react';

import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';
import { useEffectiveOrgId, useOrgPath } from '@/hooks/useOrgRouter';
import {
  HuemulAssetTreePickerDialog,
  type AssetPickerSelectMeta,
} from '@/huemul/components/huemul-asset-tree-picker';

/** Mention element referencing an asset: `value`/`key` hold the asset name/id,
 * `color` snapshots the asset type's color at insertion time. */
type AssetMentionElement = TMentionElement & { color?: string | null };

export function MentionElement(
  props: PlateElementProps<AssetMentionElement> & {
    prefix?: string;
  }
) {
  const element = props.element;

  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();
  const readOnly = useReadOnly();
  const buildPath = useOrgPath();

  const handleOpenAsset = (event: React.MouseEvent) => {
    if (!element.key) return;
    event.preventDefault();
    window.open(buildPath(`/asset/${element.key}`), '_blank');
  };

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm',
        !readOnly && 'cursor-pointer',
        selected && focused && 'ring-2 ring-ring',
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline'
      )}
      style={element.color ? { color: element.color } : undefined}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
        draggable: true,
        onMouseDown: handleOpenAsset,
      }}
    >
      {mounted && IS_APPLE ? (
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        <>
          {props.children}
          {props.prefix}
          {element.value}
        </>
      ) : (
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        <>
          {props.prefix}
          {element.value}
          {props.children}
        </>
      )}
    </PlateElement>
  );
}

export function MentionInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const organizationId = useEffectiveOrgId();
  const [open, setOpen] = React.useState(true);
  // Marca si ya se insertó un mention, para que el onOpenChange(false) que el
  // dialog dispara justo después de onSelect no borre el nodo recién insertado
  // (ver handleOpenChange).
  const selectedRef = React.useRef(false);

  // Al cerrar sin seleccionar (Escape, click afuera), limpia el nodo
  // mention_input huérfano. Si ya hubo selección, el dialog llama
  // onSelect() y luego onOpenChange(false) de forma síncrona; en ese caso
  // findPath(element) ya resuelve al mention recién insertado (mismo path),
  // así que hay que saltar la limpieza con este guard.
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        if (selectedRef.current) return;
        const path = editor.api.findPath(element);
        if (path) editor.tf.removeNodes({ at: path });
      }
    },
    [editor, element]
  );

  const handleSelect = React.useCallback(
    (id: string, label: string, meta?: AssetPickerSelectMeta) => {
      selectedRef.current = true;
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.removeNodes({ at: path });
        editor.tf.insertNodes<AssetMentionElement>(
          {
            type: KEYS.mention,
            key: id,
            value: label,
            color: meta?.color ?? null,
            children: [{ text: '' }],
          },
          { at: path }
        );
        editor.tf.move({ unit: 'offset' });
      }
      setOpen(false);
    },
    [editor, element]
  );

  return (
    <PlateElement {...props} as="span">
      <span contentEditable={false}>
        {organizationId && (
          <HuemulAssetTreePickerDialog
            open={open}
            onOpenChange={handleOpenChange}
            organizationId={organizationId}
            mode="document"
            onSelect={handleSelect}
          />
        )}
      </span>

      {props.children}
    </PlateElement>
  );
}
