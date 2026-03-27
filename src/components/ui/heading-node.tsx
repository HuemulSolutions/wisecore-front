'use client';

import { useContext } from 'react';

import type { PlateElementProps } from 'platejs/react';

import { type VariantProps, cva } from 'class-variance-authority';
import { NodeApi } from 'platejs';
import { PlateElement } from 'platejs/react';
import { SectionIndexContext } from '@/contexts/section-index-context';

const headingVariants = cva('relative', {
  variants: {
    variant: {
      h1: 'text-2xl font-bold my-4',
      h2: 'text-xl font-bold my-3',
      h3: 'text-lg font-bold my-2',
      h4: 'text-base font-bold my-2',
      h5: 'text-sm font-bold my-2',
      h6: 'text-xs font-bold my-2',
    },
  },
});

function generateHeadingId(text: string, sectionIndex?: number): string | undefined {
  if (!text) return undefined;
  const baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return sectionIndex !== undefined ? `section-${sectionIndex}-${baseId}` : baseId;
}

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  const sectionIndex = useContext(SectionIndexContext);
  const text = NodeApi.string(props.element);
  const headingId = generateHeadingId(text, sectionIndex);

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
