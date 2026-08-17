import type { ChatMessage } from './core'

export interface MessageBubbleProps {
  message: ChatMessage
}

export interface ChatbotContextSyncProps {
  sourceKey: string
  executionId?: string
  documentId?: string
  /** Display name of the current asset (shown in the "add to context" badge). */
  assetName?: string
  enabled?: boolean
  priority?: number
}

export interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void
  activeConversationId: string | null
  /** Called after deleting the active conversation so the parent can reset the view. */
  onDeletedActiveConversation?: () => void
  /**
   * Eje RBAC del panel Wisy (`asset:l|r`, ver useWisyAccess). Obligatoria y sin
   * default: un default permisivo es indistinguible de "todavía no lo gatearon".
   */
  canManage: boolean
}
