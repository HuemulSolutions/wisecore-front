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
import { File, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';
import { useEffectiveOrgId, useOrgPath } from '@/hooks/useOrgRouter';
import { usePageAccess } from '@/hooks/usePageAccess';
import {
  HuemulAssetTreePickerDialog,
  type AssetPickerSelectMeta,
} from '@/huemul/components/huemul-asset-tree-picker';
import { HuemulRolePickerDialog } from '@/huemul/components/huemul-role-picker';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { Button } from '@/components/ui/button';

/** `refType` ausente ⇒ 'asset' (menciones creadas antes de soportar roles). */
type MentionRefType = 'asset' | 'role';

/** Mention element referencing an asset or a role: `value`/`key` hold the
 * name/id of the referenced entity, `color` snapshots its color at
 * insertion time (asset type color, or role color).
 * `executionId` is set only for asset mentions pinned to a specific version. */
type WisecoreMentionElement = TMentionElement & {
  color?: string | null;
  executionId?: string | null;
  refType?: MentionRefType;
};

export function MentionElement(
  props: PlateElementProps<WisecoreMentionElement> & {
    prefix?: string;
  }
) {
  const element = props.element;
  const isRole = element.refType === 'role';

  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();
  const readOnly = useReadOnly();
  const buildPath = useOrgPath();
  const effectiveOrgId = useEffectiveOrgId();

  const handleOpenAsset = (event: React.MouseEvent) => {
    if (isRole) return;
    if (!element.key) return;
    // Solo botón izquierdo — este es onMouseDown (dispara con cualquier
    // botón, incluido el derecho) porque el nodo también es draggable y
    // onClick no llega a tiempo para prevenir el drag.
    if (event.button !== 0) return;
    // Sin org resuelta (SectionPlateEditor montado fuera de la página de
    // assets, o contexto todavía sin hidratar) buildPath cae al centinela
    // '_', lo que termina rebotando a /home sin volver. Mejor no abrir nada.
    if (effectiveOrgId === '_') return;
    event.preventDefault();
    const query = element.executionId ? `?execution=${encodeURIComponent(element.executionId)}` : '';
    window.open(buildPath(`/asset/${element.key}${query}`), '_blank', 'noopener,noreferrer');
  };

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm',
        !readOnly && !isRole && 'cursor-pointer',
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
          {isRole && <Shield className="mr-1 inline-block h-3 w-3 align-text-bottom" />}
          {element.value}
        </>
      ) : (
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        <>
          {props.prefix}
          {isRole && <Shield className="mr-1 inline-block h-3 w-3 align-text-bottom" />}
          {element.value}
          {props.children}
        </>
      )}
    </PlateElement>
  );
}

type MentionInputStep = 'type' | 'asset' | 'role';

export function MentionInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const { t } = useTranslation('editor');
  const organizationId = useEffectiveOrgId();
  // Sin permiso de listar roles, la elección de tipo se salta directo al
  // picker de assets — mismo comportamiento que antes de soportar roles.
  const { can: canAccessRoles } = usePageAccess('roles');
  const canPickRole = canAccessRoles('listRoles');
  const [step, setStep] = React.useState<MentionInputStep>(canPickRole ? 'type' : 'asset');
  const [open, setOpen] = React.useState(true);
  // Marca si ya se insertó un mention, para que el onOpenChange(false) que el
  // dialog dispara justo después de onSelect no borre el nodo recién insertado
  // (ver handleOpenChange).
  const selectedRef = React.useRef(false);

  // Al cerrar sin seleccionar (Escape, click afuera) en cualquiera de los
  // pasos, limpia el nodo mention_input huérfano. Si ya hubo selección, el
  // dialog llama onSelect() y luego onOpenChange(false) de forma síncrona;
  // en ese caso findPath(element) ya resuelve al mention recién insertado
  // (mismo path), así que hay que saltar la limpieza con este guard.
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

  const insertMention = React.useCallback(
    (refType: MentionRefType, key: string, value: string, executionId: string | null, color?: string | null) => {
      selectedRef.current = true;
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.removeNodes({ at: path });
        editor.tf.insertNodes<WisecoreMentionElement>(
          { type: KEYS.mention, children: [{ text: '' }], refType, key, value, executionId, color: color ?? null },
          { at: path }
        );
        editor.tf.move({ unit: 'offset' });
      }
      setOpen(false);
    },
    [editor, element]
  );

  const handleSelectAsset = React.useCallback(
    (id: string, label: string, meta?: AssetPickerSelectMeta) => {
      // meta.documentId is only set when a specific version (execution) was
      // picked; in that case `id` is the execution id, not the document id.
      const isVersioned = !!meta?.documentId;
      insertMention('asset', isVersioned ? meta!.documentId! : id, label, isVersioned ? id : null, meta?.color);
    },
    [insertMention]
  );

  const handleSelectRole = React.useCallback(
    // Roles have no assignable color (no such field exists on the role form), unlike
    // asset mentions which do carry a real document-type color — so this path never
    // passes one through to insertMention.
    (id: string, label: string) => {
      insertMention('role', id, label, null);
    },
    [insertMention]
  );

  return (
    <PlateElement {...props} as="span">
      <span contentEditable={false}>
        {step === 'type' && (
          <HuemulDialog
            open={open}
            onOpenChange={handleOpenChange}
            title={t('mention.chooseType.title')}
            showFooter={false}
            maxWidth="sm:max-w-sm"
          >
            <div className="flex gap-2">
              <Button variant="outline" className="h-16 flex-1 flex-col gap-1" onClick={() => setStep('asset')}>
                <File className="h-4 w-4" />
                {t('mention.chooseType.asset')}
              </Button>
              <Button variant="outline" className="h-16 flex-1 flex-col gap-1" onClick={() => setStep('role')}>
                <Shield className="h-4 w-4" />
                {t('mention.chooseType.role')}
              </Button>
            </div>
          </HuemulDialog>
        )}

        {step === 'asset' && organizationId && (
          <HuemulAssetTreePickerDialog
            open={open}
            onOpenChange={handleOpenChange}
            organizationId={organizationId}
            mode="document-with-version"
            onSelect={handleSelectAsset}
          />
        )}

        {step === 'role' && (
          <HuemulRolePickerDialog open={open} onOpenChange={handleOpenChange} onSelect={handleSelectRole} />
        )}
      </span>

      {props.children}
    </PlateElement>
  );
}
