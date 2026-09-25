export interface DiscussionFocusRequest {
  /** Id of the discussion = id of the comment mark in the owning editor. */
  discussionId: string;
  /** section_execution_id of the editor that owns the mark. */
  sectionExecutionId: string;
  /** Bumped on every request so the same target can be re-requested while
   * DiscussionFocusSync's effect keeps primitive (non-object) deps. */
  nonce: number;
}

export type DiscussionFocusOutcome = 'activated' | 'mark-missing';

export interface DiscussionFocusContextValue {
  request: DiscussionFocusRequest | null;
  requestFocus: (discussionId: string, sectionExecutionId: string) => void;
  clearRequest: (outcome?: DiscussionFocusOutcome) => void;
}
