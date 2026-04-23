import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { Value } from 'platejs';

import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import { useUsers } from '@/hooks/useUsers';
import {
  listDiscussions,
  createDiscussionWithComment,
  deleteDiscussion,
  resolveDiscussion,
} from '@/services/discussions';
import {
  createDiscussionComment,
  updateDiscussionComment,
  deleteDiscussionComment,
} from '@/services/discussion-comments';
import type { DiscussionComment, DiscussionWithComments } from '@/types/discussions';
import type { TComment } from '@/components/ui/comment';
import type {
  TDiscussion,
  TDiscussionUser,
  DiscussionCallbacks,
} from '@/components/plate-editor/components/discussion-kit';

// ── Query Keys ──────────────────────────────────────────────────────────
export const discussionQueryKeys = {
  all: ['discussions'] as const,
  byDocument: (documentId: string) =>
    [...discussionQueryKeys.all, 'document', documentId] as const,
  comments: (discussionId: string) =>
    [...discussionQueryKeys.all, 'comments', discussionId] as const,
};

// ── Helpers: map API → Plate types ──────────────────────────────────────

/** Ensure every element node has an iterable `children` array so Slate never crashes. */
function sanitizeNodes(nodes: unknown): Value {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [{ type: 'p', children: [{ text: '' }] }];
  }
  return nodes.map((node) => {
    if (typeof node !== 'object' || node === null) {
      return { text: String(node ?? '') };
    }
    // Text-leaf nodes have no children – leave them as-is
    if ('text' in node) return node;
    // Element nodes must have an iterable children array
    const el = node as Record<string, unknown>;
    return {
      ...el,
      children: Array.isArray(el.children)
        ? sanitizeNodes(el.children as unknown[])
        : [{ text: '' }],
    };
  }) as Value;
}

function parseRichContent(raw: string): Value {
  try {
    const parsed = JSON.parse(raw);
    return sanitizeNodes(parsed);
  } catch {
    // Fallback: wrap plain text in a paragraph node
    return [{ type: 'p', children: [{ text: raw }] }];
  }
}

function serializeRichContent(value: Value): string {
  return JSON.stringify(value);
}

function mapApiCommentToPlate(c: DiscussionComment): TComment {
  return {
    id: c.id,
    discussionId: c.discussion_id,
    contentRich: parseRichContent(c.content_rich),
    createdAt: new Date(c.created_at),
    userId: c.user_id ?? c.created_by ?? '',
    isEdited: c.is_edited ?? c.created_at !== c.updated_at,
  };
}

function mapApiDiscussionToPlate(
  d: DiscussionWithComments,
): TDiscussion {
  return {
    id: d.id,
    comments: (d.comments ?? []).map(mapApiCommentToPlate),
    createdAt: new Date(d.created_at),
    isResolved: d.is_resolved,
    userId: d.created_by ?? '',
    documentContent: d.document_content,
  };
}

// ── Main Hook ───────────────────────────────────────────────────────────

export function useDiscussions(documentId: string | undefined, sectionExecutionId?: string) {
  const { user } = useAuth();
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch org users for avatar / name resolution
  const { data: usersResponse } = useUsers(
    !!selectedOrganizationId,
    selectedOrganizationId ?? undefined,
  );

  // ── Users map ───────────────────────────────────────────────────────
  const usersMap: Record<string, TDiscussionUser> = useMemo(() => {
    const map: Record<string, TDiscussionUser> = {};
    if (usersResponse?.data) {
      for (const u of usersResponse.data) {
        map[u.id] = {
          id: u.id,
          name: `${u.name} ${u.last_name}`.trim() || u.email,
          avatarUrl: u.photo_url ?? '',
        };
      }
    }
    // Ensure the current user is always present
    if (user && !map[user.id]) {
      map[user.id] = {
        id: user.id,
        name: `${user.name} ${user.last_name}`.trim() || user.email,
        avatarUrl: user.photo_url ?? '',
      };
    }
    return map;
  }, [usersResponse?.data, user]);

  // ── Fetch discussions with embedded comments ─────────────────────────
  const {
    data: discussionsResponse,
    isLoading: isLoadingDiscussions,
  } = useQuery({
    queryKey: discussionQueryKeys.byDocument(documentId!),
    queryFn: () =>
      listDiscussions(
        { document_id: documentId!, include_comments: true, page_size: 500 },
        selectedOrganizationId ?? undefined,
      ),
    enabled: !!documentId && !!selectedOrganizationId,
    staleTime: 30_000,
    // Swallow permission errors (e.g. 403) silently – the editor should
    // still render without discussions rather than crash.
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // ── Assemble TDiscussion[] for Plate ────────────────────────────────
  const discussions: TDiscussion[] = useMemo(() => {
    if (!discussionsResponse?.data) return [];
    return discussionsResponse.data.map(mapApiDiscussionToPlate);
  }, [discussionsResponse?.data]);

  // ── Invalidation helper ─────────────────────────────────────────────
  const invalidate = useCallback(() => {
    if (documentId) {
      queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.byDocument(documentId),
      });
    }
  }, [queryClient, documentId]);

  // ── Mutations ───────────────────────────────────────────────────────

  const createDiscussionMutation = useMutation({
    mutationFn: async (params: {
      documentContent: string;
      firstCommentRich: Value;
      discussionId: string;
    }) => {
      const discussion = await createDiscussionWithComment(
        {
          document_id: documentId!,
          section_execution_id: sectionExecutionId!,
          document_content: params.documentContent,
          content_rich: serializeRichContent(params.firstCommentRich),
        },
        selectedOrganizationId!,
      );
      return discussion.id;
    },
    onSuccess: () => invalidate(),
    meta: { successMessage: 'Discussion created' },
  });

  const resolveDiscussionMutation = useMutation({
    mutationFn: (discussionId: string) =>
      resolveDiscussion(discussionId, selectedOrganizationId ?? undefined),
    onSuccess: () => invalidate(),
    meta: { successMessage: 'Discussion resolved' },
  });

  const deleteDiscussionMutation = useMutation({
    mutationFn: (discussionId: string) =>
      deleteDiscussion(discussionId, selectedOrganizationId ?? undefined),
    onSuccess: () => invalidate(),
    meta: { successMessage: 'Discussion deleted' },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (params: { discussionId: string; contentRich: Value }) => {
      const comment = await createDiscussionComment(
        {
          discussion_id: params.discussionId,
          content_rich: serializeRichContent(params.contentRich),
        },
        selectedOrganizationId ?? undefined,
      );
      return comment.id;
    },
    onSuccess: () => invalidate(),
    meta: { successMessage: 'Comment added' },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async (params: {
      commentId: string;
      contentRich: Value;
    }) => {
      await updateDiscussionComment(
        params.commentId,
        { content_rich: serializeRichContent(params.contentRich) },
        selectedOrganizationId ?? undefined,
      );
    },
    onSuccess: () => invalidate(),
    meta: { successMessage: 'Comment updated' },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (params: { commentId: string; discussionId: string }) => {
      await deleteDiscussionComment(
        params.commentId,
        selectedOrganizationId ?? undefined,
      );
    },
    onSuccess: () => invalidate(),
    meta: { successMessage: 'Comment deleted' },
  });

  // ── Callbacks for the Plate discussion plugin ───────────────────────
  const callbacks: DiscussionCallbacks = useMemo(
    () => ({
      onCreateDiscussion: async (data) => {
        const id = await createDiscussionMutation.mutateAsync(data);
        return id;
      },
      onResolveDiscussion: async (discussionId) => {
        await resolveDiscussionMutation.mutateAsync(discussionId);
      },
      onDeleteDiscussion: async (discussionId) => {
        await deleteDiscussionMutation.mutateAsync(discussionId);
      },
      onAddComment: async (discussionId, contentRich) => {
        const id = await addCommentMutation.mutateAsync({
          discussionId,
          contentRich,
        });
        return id;
      },
      onUpdateComment: async (commentId, contentRich) => {
        await updateCommentMutation.mutateAsync({ commentId, contentRich });
      },
      onDeleteComment: async (commentId, discussionId) => {
        await deleteCommentMutation.mutateAsync({ commentId, discussionId });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedOrganizationId, documentId, sectionExecutionId],
  );

  return {
    discussions,
    usersMap,
    currentUserId: user?.id ?? '',
    callbacks,
    isLoading: isLoadingDiscussions,
    invalidate,
  };
}
