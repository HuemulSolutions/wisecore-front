'use client';

// import * as React from 'react';

import type { TCommentText } from 'platejs';
import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf, useEditorPlugin } from 'platejs/react';

import { commentPlugin } from '@/components/plate-editor/components/comment-kit';

export function CommentLeaf(props: PlateLeafProps<TCommentText>) {
  const { children, leaf } = props;

  const { api, setOption } = useEditorPlugin(commentPlugin);

  const currentId = api.comment.nodeId(leaf);

  return (
    <PlateLeaf
      {...props}
      className="transition-colors duration-200"
      attributes={{
        ...props.attributes,
        onClick: () => setOption('activeId', currentId ?? null),
        onMouseEnter: () => setOption('hoverId', currentId ?? null),
        onMouseLeave: () => setOption('hoverId', null),
      }}
    >
      {children}
    </PlateLeaf>
  );
}
