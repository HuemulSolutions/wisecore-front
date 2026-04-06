'use client';

import { type PlateElementProps, PlateElement } from 'platejs/react';

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="blockquote"
      className="border-l-4 border-gray-600 pl-4 italic my-4"
      {...props}
    />
  );
}
