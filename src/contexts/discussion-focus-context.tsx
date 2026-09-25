import * as React from 'react';

import type {
  DiscussionFocusContextValue,
  DiscussionFocusOutcome,
  DiscussionFocusRequest,
} from '@/types/discussion-focus-context';

export const DiscussionFocusContext = React.createContext<DiscussionFocusContextValue>({
  request: null,
  requestFocus: () => {},
  clearRequest: () => {},
});

export function useDiscussionFocus(): DiscussionFocusContextValue {
  return React.useContext(DiscussionFocusContext);
}

export interface DiscussionFocusProviderProps {
  /** Called when a request resolves: the mark was found and activated, or
   * it no longer exists in the target section's editor. */
  onResolve?: (outcome: DiscussionFocusOutcome) => void;
  children: React.ReactNode;
}

/**
 * Document-scoped bridge between a discussions panel (outside any single
 * section's Plate editor) and the N per-section editors mounted under it.
 * Requesting a focus bumps `nonce` so the same discussion can be
 * re-requested even though the consuming effect keeps primitive deps.
 */
export function DiscussionFocusProvider({ onResolve, children }: DiscussionFocusProviderProps) {
  const [request, setRequest] = React.useState<DiscussionFocusRequest | null>(null);
  const nonceRef = React.useRef(0);

  const requestFocus = React.useCallback((discussionId: string, sectionExecutionId: string) => {
    nonceRef.current += 1;
    setRequest({ discussionId, sectionExecutionId, nonce: nonceRef.current });
  }, []);

  const clearRequest = React.useCallback(
    (outcome?: DiscussionFocusOutcome) => {
      setRequest(null);
      if (outcome) onResolve?.(outcome);
    },
    [onResolve]
  );

  const value = React.useMemo(
    () => ({ request, requestFocus, clearRequest }),
    [request, requestFocus, clearRequest]
  );

  return (
    <DiscussionFocusContext.Provider value={value}>
      {children}
    </DiscussionFocusContext.Provider>
  );
}
