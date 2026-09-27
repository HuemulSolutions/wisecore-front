import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';
import type { RoleReferenceElement as RoleReferenceElementType } from '@/types/reference';

function tintFromColor(color?: string | null): string | undefined {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return `${color}1A`;
}

/** Render estático/read-only del snapshot guardado en el nodo — sin fetch, sin ficha hover. */
export function RoleReferenceElementStatic(props: SlateElementProps<RoleReferenceElementType>) {
  const element = props.element;

  return (
    <SlateElement
      {...props}
      as="span"
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 align-baseline font-medium text-sm')}
      style={{ backgroundColor: tintFromColor(element.color), color: element.color || undefined }}
    >
      {props.children}
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: element.color || 'currentColor' }} />
      {element.name}
    </SlateElement>
  );
}
