import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { Value } from 'platejs';

import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import { useUsers } from '@/hooks/useUsers';
import {
  listDiscussions,
  createDiscussion,
  deleteDiscussion,
  resolveDiscussion,
} from '@/services/discussions';
import {
  listDiscussionComments,
  createDiscussionComment,
  updateDiscussionComment,
  deleteDiscussionComment,
} from '@/services/discussion-comments';
import type { Discussion, DiscussionComment } from '@/types/discussions';
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

function parseRichContent(raw: string): Value {
  try {
    return JSON.parse(raw) as Value;
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
    userId: c.created_by ?? '',
    isEdited: c.created_at !== c.updated_at,
  };
}

function mapApiDiscussionToPlate(
  d: Discussion,
  comments: TComment[],
): TDiscussion {
  return {
    id: d.id,
    comments,
    createdAt: new Date(d.created_at),
    isResolved: d.resolved,
    userId: d.created_by ?? '',
    documentContent: d.document_content,
  };
}

// ── Main Hook ───────────────────────────────────────────────────────────

export function useDiscussions(documentId: string | undefined) {
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

  // ── Fetch discussions for the document ──────────────────────────────
  const {
    data: discussionsResponse,
    isLoading: isLoadingDiscussions,
  } = useQuery({
    queryKey: discussionQueryKeys.byDocument(documentId!),
    queryFn: () =>
      listDiscussions(
        { document_id: documentId!, page_size: 500 },
        selectedOrganizationId ?? undefined,
      ),
    enabled: !!documentId && !!selectedOrganizationId,
    staleTime: 30_000,
  });

  // ── Fetch comments for every discussion ─────────────────────────────
  const discussionIds = useMemo(
    () => (discussionsResponse?.data ?? []).map((d) => d.id),
    [discussionsResponse?.data],
  );

  const { data: allComments, isLoading: isLoadingComments } = useQuery({
    queryKey: [...discussionQueryKeys.byDocument(documentId!), 'all-comments', discussionIds],
    queryFn: async () => {
      const results: Record<string, TComment[]> = {};
      await Promise.all(
        discussionIds.map(async (dId) => {
          const res = await listDiscussionComments(
            { discussion_id: dId, page_size: 500 },
            selectedOrganizationId ?? undefined,
          );
          results[dId] = res.data.map(mapApiCommentToPlate);
        }),
      );
      return results;
    },
    enabled: discussionIds.length > 0 && !!selectedOrganizationId,
    staleTime: 30_000,
  });

  // ── Assemble TDiscussion[] for Plate ────────────────────────────────
  const discussions: TDiscussion[] = useMemo(() => {
    if (!discussionsResponse?.data) return [];
    return discussionsResponse.data.map((d) =>
      mapApiDiscussionToPlate(d, allComments?.[d.id] ?? []),
    );
  }, [discussionsResponse?.data, allComments]);

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
      // 1. Create the discussion
      const discussion = await createDiscussion(
        {
          document_id: documentId!,
          document_content: params.documentContent,
        },
        selectedOrganizationId!,
      );
      // 2. Create the first comment
      await createDiscussionComment(
        {
          discussion_id: discussion.id,
          content_rich: serializeRichContent(params.firstCommentRich),
        },
        selectedOrganizationId ?? undefined,
      );
      return discussion.id;
    },
    onSuccess: () => invalidate(),
  });

  const resolveDiscussionMutation = useMutation({
    mutationFn: (discussionId: string) =>
      resolveDiscussion(discussionId, selectedOrganizationId ?? undefined),
    onSuccess: () => invalidate(),
  });

  const deleteDiscussionMutation = useMutation({
    mutationFn: (discussionId: string) =>
      deleteDiscussion(discussionId, selectedOrganizationId ?? undefined),
    onSuccess: () => invalidate(),
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
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (params: { commentId: string; discussionId: string }) => {
      await deleteDiscussionComment(
        params.commentId,
        selectedOrganizationId ?? undefined,
      );
    },
    onSuccess: () => invalidate(),
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
    [selectedOrganizationId, documentId],
  );

  return {
    discussions,
    usersMap,
    currentUserId: user?.id ?? '',
    callbacks,
    isLoading: isLoadingDiscussions || isLoadingComments,
    invalidate,
  };
}
