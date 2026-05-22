export interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void
  activeConversationId: string | null
  /** Called after deleting the active conversation so the parent can reset the view. */
  onDeletedActiveConversation?: () => void
}
