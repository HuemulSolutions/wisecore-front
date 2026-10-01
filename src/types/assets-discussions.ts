import type { TComment } from '@/components/ui/comment';
import type { TDiscussion } from '@/components/plate-editor/components/discussion-kit';

/** Fila del sheet de comentarios del asset: un hilo con sus datos derivados. */
export interface AssetsDiscussionRow {
  discussion: TDiscussion;
  sectionName: string;
  isDocumentScope: boolean;
  /** Hilo de sección cuyo `sectionExecutionId` no está en la versión actual. */
  isUnknownSection: boolean;
  isAi: boolean;
  isResolved: boolean;
  createdAt: Date;
  snippet: string;
  firstComment: TComment | undefined;
  firstCommentText: string;
  replies: { comment: TComment; text: string }[];
  replyCount: number;
  hasPrivate: boolean;
  authorIds: string[];
  searchBlob: string;
}
