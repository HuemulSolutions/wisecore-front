'use client';

import { useContext, useMemo } from 'react';

import type { PlateElementProps } from 'platejs/react';

import { type VariantProps, cva } from 'class-variance-authority';
import { type TElement, NodeApi } from 'platejs';
import { PlateElement, useEditorRef } from 'platejs/react';
import { SectionIndexContext } from '@/contexts/section-index-context';

const headingVariants = cva('relative font-["IBM_Plex_Sans",sans-serif]', {
  variants: {
    variant: {
      h1: 'text-[1.875rem] leading-tight font-semibold tracking-tight mt-8 mb-4',
      h2: 'text-[1.5rem] leading-snug font-semibold tracking-tight mt-7 mb-3',
      h3: 'text-[1.25rem] leading-snug font-semibold mt-6 mb-3',
      h4: 'text-[1.125rem] leading-snug font-semibold mt-5 mb-2',
      h5: 'text-base font-semibold mt-4 mb-2',
      h6: 'text-sm font-semibold mt-3 mb-1',
    },
  },
});

const HEADING_TYPES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  const sectionIndex = useContext(SectionIndexContext);
  const editor = useEditorRef();
  const text = NodeApi.string(props.element);

  const headingId = useMemo(() => {
    if (!text) return undefined;
    const baseSlug = slugify(text);
    const fullBaseId = sectionIndex !== undefined ? `section-${sectionIndex}-${baseSlug}` : baseSlug;

    // Count how many headings with the same slug appear before this one
    const allHeadings = Array.from(
      editor.api.nodes<TElement>({
        at: [],
        match: (n) => HEADING_TYPES.has((n as TElement).type),
      })
    );

    let count = 0;
    for (const [node] of allHeadings) {
      if (node === props.element) break;
      const nodeText = NodeApi.string(node);
      if (slugify(nodeText) === baseSlug) count++;
    }

    return count === 0 ? fullBaseId : `${fullBaseId}-${count + 1}`;
  }, [text, sectionIndex, editor, props.element]);

  return (
    <PlateElement
      as={variant!}
      className={headingVariants({ variant })}
      {...props}
    >
      {headingId && <span id={headingId} className="absolute" style={{ top: '-1px' }} />}
      {props.children}
    </PlateElement>
  );
}

export function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />;
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />;
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />;
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />;
}
