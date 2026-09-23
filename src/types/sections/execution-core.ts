export interface AddSectionExecutionRequest {
  name: string;
  after_from?: string | null;
  type?: 'manual' | 'ai' | 'reference';
  output?: string;
  prompt?: string;
  dependencies?: string[];
  reference_section_id?: string;
  reference_mode?: 'latest' | 'specific';
  reference_execution_id?: string;
}

/**
 * Comentario anclado propuesto/preservado por la IA. Se vincula por `ref` con el marcador
 * `{{COMMENT:<ref>}}...{{/COMMENT}}` dentro de `content`. `is_new: true` → `body` trae el texto
 * plano y hay que crear la discusión; `is_new: false` → `ref` es el `discussion_id` real y
 * `body` es null (la discusión ya existe).
 */
export interface AiSuggestionComment {
  ref: string;
  body: string | null;
  is_new: boolean;
}

export interface AiSuggestionStatus {
  status: 'pending' | 'completed' | 'failed' | null;
  content: string | null;
  instruction: string | null;
  comments?: AiSuggestionComment[];
  error: string | null;
}

export type ReviewStatus = 'editing' | 'reviewing' | 'finished' | 'rejected';

/** Completitud de obligatorios de una sección form, resuelta por el backend en /content. */
export type SectionAnswersStatus = 'completed' | 'pending';

export type SectionHistoryChangeType = 'manual' | 'modify_ai' | 'run_ai' | 'modify_form' | 'modify_ai_partial';

export interface SectionHistoryEntry {
  id: string;
  section_execution_id: string;
  document_id: string;
  execution_id: string;
  section_id: string;
  change_type: SectionHistoryChangeType;
  user_instruction: string | null;
  lifecycle_step_id: string | null;
  previous_text: string | null;
  new_text: string;
  created_at: string;
  created_by: string | null;
}

export interface SectionHistoryResponse {
  section_execution_id: string;
  total: number;
  items: SectionHistoryEntry[];
}
