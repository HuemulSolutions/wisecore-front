import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  Discussion,
  CreateDiscussionRequest,
  DiscussionListParams,
  PaginatedDiscussionsResponse,
} from "@/types/discussions";

const DISCUSSIONS_BASE = `${backendUrl}/discussions`;

/**
 * Create a new discussion.
 */
export async function createDiscussion(
  data: CreateDiscussionRequest,
  organizationId: string
): Promise<Discussion> {
  const response = await httpClient.post(`${DISCUSSIONS_BASE}/`, data, {
    headers: { "X-Org-Id": organizationId },
  });
  const json = await response.json();
  return json.data;
}

/**
 * List discussions for a document (paginated).
 */
export async function listDiscussions(
  params: DiscussionListParams,
  organizationId?: string
): Promise<PaginatedDiscussionsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("document_id", params.document_id);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));

  const response = await httpClient.get(
    `${DISCUSSIONS_BASE}/?${searchParams.toString()}`,
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
 * Get a single discussion by ID.
 */
export async function getDiscussion(
  discussionId: string,
  organizationId?: string
): Promise<Discussion> {
  const response = await httpClient.get(
    `${DISCUSSIONS_BASE}/${discussionId}`,
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
  const json = await response.json();
  return json.data;
}

/**
 * Delete a discussion.
 */
export async function deleteDiscussion(
  discussionId: string,
  organizationId?: string
): Promise<void> {
  await httpClient.delete(
    `${DISCUSSIONS_BASE}/${discussionId}`,
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
}

/**
 * Resolve a discussion.
 */
export async function resolveDiscussion(
  discussionId: string,
  organizationId?: string
): Promise<Discussion> {
  const response = await httpClient.patch(
    `${DISCUSSIONS_BASE}/${discussionId}/resolve`,
    {},
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
  const json = await response.json();
  return json.data;
}

/**
 * Unresolve a discussion.
 */
export async function unresolveDiscussion(
  discussionId: string,
  organizationId?: string
): Promise<Discussion> {
  const response = await httpClient.patch(
    `${DISCUSSIONS_BASE}/${discussionId}/unresolve`,
    {},
    organizationId ? { headers: { "X-Org-Id": organizationId } } : undefined
  );
  const json = await response.json();
  return json.data;
}
