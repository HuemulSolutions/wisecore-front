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

export interface AiSuggestionStatus {
  status: 'pending' | 'completed' | 'failed' | null;
  content: string | null;
  instruction: string | null;
  error: string | null;
}

export type ReviewStatus = 'editing' | 'reviewing' | 'finished';

export type SectionHistoryChangeType = 'manual' | 'modify_ai' | 'run_ai' | 'modify_form';

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
