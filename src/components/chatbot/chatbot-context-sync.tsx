import { useEffect, useMemo } from 'react';
import { useChatbotScreenContext, useOptionalChatbotContext } from '@/contexts/chatbot-context';
import type { ConversationReference, WorkingContextItem } from '@/types/chatbot';

interface ChatbotContextSyncProps {
  sourceKey: string;
  executionId?: string;
  documentId?: string;
  /** Display name of the current asset (shown in the "add to context" badge). */
  assetName?: string;
  enabled?: boolean;
  priority?: number;
}

export function ChatbotContextSync({
  sourceKey,
  executionId,
  documentId,
  assetName,
  enabled = true,
  priority = 0,
}: ChatbotContextSyncProps) {
  const chatbot = useOptionalChatbotContext();

  const references = useMemo<ConversationReference[] | undefined>(() => {
    if (!enabled) {
      return undefined;
    }

    if (executionId) {
      return [{ type: 'execution', id: executionId }];
    }

    if (documentId) {
      return [{ type: 'document', id: documentId }];
    }

    return undefined;
  }, [documentId, enabled, executionId]);

  useChatbotScreenContext({
    sourceKey,
    references,
    enabled,
    priority,
  });

  // Set the current page context for the "add to context" badge
  useEffect(() => {
    if (!chatbot?.setCurrentPageContext) return;

    if (!enabled || !assetName) {
      chatbot.setCurrentPageContext(null);
      return;
    }

    let item: WorkingContextItem | null = null;

    if (executionId) {
      item = { type: 'execution', id: executionId, name: assetName };
    } else if (documentId) {
      item = { type: 'document', id: documentId, name: assetName };
    }

    chatbot.setCurrentPageContext(item);

    return () => {
      chatbot.setCurrentPageContext(null);
    };
  }, [enabled, executionId, documentId, assetName, chatbot?.setCurrentPageContext]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
