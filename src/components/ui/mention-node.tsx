'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { IS_APPLE, KEYS } from 'platejs';
import { PlateElement, useFocused, useReadOnly, useSelected } from 'platejs/react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';
import { useEffectiveOrgId, useOrgPath } from '@/hooks/useOrgRouter';
import { useResolvedMention } from '@/contexts/mention-refs-context';
import type { WisecoreMentionElement } from '@/types/mention';

/**
 * Render LEGACY del nodo `mention` (asset/rol en un solo shape, sin ficha hover).
 * Nunca más se inserta — el combobox `@` actual (`reference-combobox-input.tsx`)
 * inserta `asset_reference`/`role_reference`. Este componente solo existe para
 * que los documentos guardados antes de ese cambio sigan renderizando igual.
 */
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
  const { t } = useTranslation('editor');
  const resolved = useResolvedMention(element);

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

  const title = !isRole && resolved.isMissing
    ? t('mention.missingAsset')
    : !isRole && resolved.isStale
      ? t('mention.staleVersion')
      : undefined;

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm',
        !readOnly && !isRole && !resolved.isMissing && 'cursor-pointer',
        !isRole && resolved.isMissing && 'opacity-50 line-through decoration-1',
        selected && focused && 'ring-2 ring-ring',
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline'
      )}
      style={resolved.color ? { color: resolved.color } : undefined}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
        draggable: true,
        title,
        onMouseDown: handleOpenAsset,
      }}
    >
      {mounted && IS_APPLE ? (
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        <>
          {props.children}
          {props.prefix}
          {isRole && <Shield className="mr-1 inline-block h-3 w-3 align-text-bottom" />}
          {resolved.name}
          {resolved.versionLabel && <span className="ml-1 text-muted-foreground">· {resolved.versionLabel}</span>}
        </>
      ) : (
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        <>
          {props.prefix}
          {isRole && <Shield className="mr-1 inline-block h-3 w-3 align-text-bottom" />}
          {resolved.name}
          {resolved.versionLabel && <span className="ml-1 text-muted-foreground">· {resolved.versionLabel}</span>}
          {props.children}
        </>
      )}
    </PlateElement>
  );
}
