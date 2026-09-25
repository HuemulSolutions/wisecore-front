import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';
import type { AssetReferenceElement as AssetReferenceElementType } from '@/types/reference';

/** Fondo tenue derivado del color (mismo cálculo que asset-reference-node.tsx). */
function tintFromColor(color?: string | null): string | undefined {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return `${color}1A`;
}

/** Render estático/read-only del snapshot guardado en el nodo — sin fetch, sin ficha hover. */
export function AssetReferenceElementStatic(props: SlateElementProps<AssetReferenceElementType>) {
  const element = props.element;

  return (
    <SlateElement
      {...props}
      as="span"
      className={cn('inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 align-baseline font-medium text-sm')}
      style={{ backgroundColor: tintFromColor(element.color), color: element.color || undefined }}
    >
      {props.children}
      {element.name}
      {element.pinnedVersionLabel && <span className="ml-1 font-mono text-xs opacity-80">{element.pinnedVersionLabel}</span>}
    </SlateElement>
  );
}
