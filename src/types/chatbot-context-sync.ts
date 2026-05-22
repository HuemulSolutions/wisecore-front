export interface ChatbotContextSyncProps {
  sourceKey: string
  executionId?: string
  documentId?: string
  /** Display name of the current asset (shown in the "add to context" badge). */
  assetName?: string
  enabled?: boolean
  priority?: number
}
