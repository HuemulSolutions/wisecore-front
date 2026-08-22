'use client';

import type { TCommentText } from 'platejs';
import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf, useEditorPlugin, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';
import { commentPlugin } from '@/components/plate-editor/components/comment-kit';

export function CommentLeaf(props: PlateLeafProps<TCommentText>) {
  const { children, leaf } = props;

  const { api, setOption } = useEditorPlugin(commentPlugin);
  const activeId = usePluginOption(commentPlugin, 'activeId');
  const hoverId = usePluginOption(commentPlugin, 'hoverId');

  const currentId = api.comment.nodeId(leaf);
  const isHot = currentId != null && (currentId === activeId || currentId === hoverId);

  return (
    <PlateLeaf
      {...props}
      className={cn(
        'bg-[#e2ecfe] border-b-2 border-b-blue-600/30 transition-colors duration-200',
        isHot && 'bg-[#c9dcfd] border-b-blue-600'
      )}
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
