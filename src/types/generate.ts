import type { EventSourceMessage } from '@microsoft/fetch-event-source';

export type SSEErrorEvent = { event: 'error'; data: string };
export type SSEEvent = EventSourceMessage | SSEErrorEvent;

export interface GenerateStreamParams {
  documentId: string;
  executionId: string;
  userInstructions?: string;
  organizationId: string;
  signal?: AbortSignal;
  onData: (text: string) => void;
  onInfo: (sectionId: string) => void;
  onError: (error: Event) => void;
  onClose: () => void;
}

export interface GenerateWorkerParams {
  documentId: string;
  executionId: string;
  instructions?: string;
  startSectionId?: string;
  singleSectionMode?: boolean;
  organizationId: string;
}

export interface ExecuteGenerationParams {
  documentId: string;
  executionId: string;
  sectionId?: string;
  mode: 'single' | 'from';
  instructions?: string;
  llmModel: string;
  organizationId: string;
}

export interface FixSectionParams {
  instructions: string;
  content: string;
  organizationId: string;
  onData: (text: string) => void;
  onError: (error: Event) => void;
  onClose: () => void;
}

export interface RedactPromptParams {
  name: string;
  content?: string;
  organizationId: string;
  onData: (text: string) => void;
  onError: (error: Event) => void;
  onClose: () => void;
}

export interface ChatbotParams {
  executionId: string;
  user_message: string;
  threadId?: string;
  organizationId: string;
  onData: (text: string) => void;
  onThreadId: (threadId: string) => void;
  onError: (error: Event) => void;
  onClose: () => void;
}

export interface EditWithAiParams {
  text: string;
  prompt: string;
  templateId?: string;
  sectionId?: string;
  executionId?: string;
  llmId?: string;
  organizationId: string;
}

export interface EditWithAiResponse {
  data: { text: string };
  transaction_id: string;
  timestamp: string;
}
