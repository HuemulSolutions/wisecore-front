export interface DiscussionSyncProps {
  documentId: string;
  /** Section execution ID – required to create discussions via with-comment endpoint */
  sectionExecutionId?: string;
  /**
   * Called after any discussion mutation (create discussion, add comment).
   * Use this to auto-save plate_content so comment marks are persisted.
   */
  onAfterDiscussionMutation?: () => void;
}
