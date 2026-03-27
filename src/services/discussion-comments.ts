import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  DiscussionComment,
  CreateDiscussionCommentRequest,
  UpdateDiscussionCommentRequest,
  DiscussionCommentListParams,
  PaginatedDiscussionCommentsResponse,
} from "@/types/discussions";

const COMMENTS_BASE = `${backendUrl}/discussion-comments`;

/**
 * Create a new comment on a discussion.
 */
export async function createDiscussionComment(
  data: CreateDiscussionCommentRequest,
  organizationId?: string
): Promise<DiscussionComment> {
  const response = await httpClient.post(`${COMMENTS_BASE}/`, data, 
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
  const json = await response.json();
  return json.data;
}

/**
 * List comments for a discussion (paginated).
 */
export async function listDiscussionComments(
  params: DiscussionCommentListParams,
  organizationId?: string
): Promise<PaginatedDiscussionCommentsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("discussion_id", params.discussion_id);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));

  const response = await httpClient.get(
    `${COMMENTS_BASE}/?${searchParams.toString()}`,
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
  const json = await response.json();
  return {
    data: json.data,
    page: json.page,
    page_size: json.page_size,
    has_next: json.has_next,
  };
}

/**
 * Get a single comment by ID.
 */
export async function getDiscussionComment(
  commentId: string,
  organizationId?: string
): Promise<DiscussionComment> {
  const response = await httpClient.get(
    `${COMMENTS_BASE}/${commentId}`,
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
  const json = await response.json();
  return json.data;
}

/**
 * Update a comment.
 */
export async function updateDiscussionComment(
  commentId: string,
  data: UpdateDiscussionCommentRequest,
  organizationId?: string
): Promise<DiscussionComment> {
  const response = await httpClient.put(
    `${COMMENTS_BASE}/${commentId}`,
    data,
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
  const json = await response.json();
  return json.data;
}

/**
 * Delete a comment.
 */
export async function deleteDiscussionComment(
  commentId: string,
  organizationId?: string
): Promise<void> {
  await httpClient.delete(
    `${COMMENTS_BASE}/${commentId}`,
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
}
