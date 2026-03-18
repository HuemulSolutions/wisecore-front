import { useMemo } from 'react';
import { useChatbotScreenContext } from '@/contexts/chatbot-context';
import type { ConversationReference } from '@/types/chatbot';

interface ChatbotContextSyncProps {
  sourceKey: string;
  executionId?: string;
  documentId?: string;
  enabled?: boolean;
  priority?: number;
}

export function ChatbotContextSync({
  sourceKey,
  executionId,
  documentId,
  enabled = true,
  priority = 0,
}: ChatbotContextSyncProps) {
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

  return null;
}
