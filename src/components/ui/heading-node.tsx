'use client';

// import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { type VariantProps, cva } from 'class-variance-authority';
import { PlateElement } from 'platejs/react';

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

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <PlateElement
      as={variant!}
      className={headingVariants({ variant })}
      {...props}
    >
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
