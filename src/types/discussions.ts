// Discussions & Discussion Comments types
// API: /discussions, /discussion-comments

// ========================================
// Core models
// ========================================

export interface Discussion {
  id: string;
  document_id: string;
  document_content: string;
  is_resolved: boolean;
  section_execution_id: string | null;
  organization_id: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface DiscussionComment {
  id: string;
  discussion_id: string;
  content_rich: string;
  user_id?: string;
  is_edited?: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Discussion with embedded comments, returned when include_comments=true
 */
export interface DiscussionWithComments extends Discussion {
  comments: DiscussionComment[];
}

// ========================================
// Request types
// ========================================

export interface CreateDiscussionRequest {
  document_id: string;
  document_content: string;
}

export interface CreateDiscussionWithCommentRequest {
  document_id: string;
  section_execution_id: string;
  document_content: string;
  content_rich: string;
}

export interface CreateDiscussionCommentRequest {
  discussion_id: string;
  content_rich: string;
}

export interface UpdateDiscussionCommentRequest {
  content_rich: string;
}

// ========================================
// Query params
// ========================================

export interface DiscussionListParams {
  document_id?: string;
  section_execution_id?: string;
  include_comments?: boolean;
  page?: number;
  page_size?: number;
}

export interface DiscussionCommentListParams {
  discussion_id: string;
  page?: number;
  page_size?: number;
}

// ========================================
// Response types
// ========================================

export interface PaginatedDiscussionsResponse<T = Discussion> {
  data: T[];
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface PaginatedDiscussionCommentsResponse {
  data: DiscussionComment[];
  page: number;
  page_size: number;
  has_next: boolean;
}
