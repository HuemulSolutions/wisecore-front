// Discussions & Discussion Comments types
// API: /discussions, /discussion-comments

// ========================================
// Core models
// ========================================

export interface Discussion {
  id: string;
  document_id: string;
  document_content: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DiscussionComment {
  id: string;
  discussion_id: string;
  content_rich: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ========================================
// Request types
// ========================================

export interface CreateDiscussionRequest {
  document_id: string;
  document_content: string;
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
  document_id: string;
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

export interface PaginatedDiscussionsResponse {
  data: Discussion[];
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
