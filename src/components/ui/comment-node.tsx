'use client';

import type { TCommentText } from 'platejs';
import type { PlateLeafProps } from 'platejs/react';

import { PlateLeaf, useEditorPlugin, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';
import { commentPlugin } from '@/components/plate-editor/components/comment-kit';
import { discussionPlugin } from '@/components/plate-editor/components/discussion-kit';

export function CommentLeaf(props: PlateLeafProps<TCommentText>) {
  const { children, leaf } = props;

  const { api, setOption } = useEditorPlugin(commentPlugin);
  const activeId = usePluginOption(commentPlugin, 'activeId');
  const hoverId = usePluginOption(commentPlugin, 'hoverId');
  const discussions = usePluginOption(discussionPlugin, 'discussions');

  const currentId = api.comment.nodeId(leaf);
  // A resolved (or deleted-and-orphaned) discussion keeps its mark in the
  // document so reopening can restore the highlight, but it must render
  // as plain text in the meantime.
  const discussion = currentId ? discussions.find((d) => d.id === currentId) : undefined;
  const isInert = !discussion || discussion.isResolved;
  const isHot = !isInert && currentId != null && (currentId === activeId || currentId === hoverId);

  if (isInert) {
    return <PlateLeaf {...props}>{children}</PlateLeaf>;
  }

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
