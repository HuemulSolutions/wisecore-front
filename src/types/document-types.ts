export type FinalLifecycleStage = 'edit' | 'review' | 'approve' | 'publish';

export interface DocumentType {
  id: string;
  name: string;
  color: string;
  requires_iso_strict_versioning: boolean;
  final_lifecycle_stage: FinalLifecycleStage;
  created_at: string;
  updated_at: string;
  document_count: number;
}

export interface DocumentTypeDetail {
  id: string;
  name: string;
  color: string;
  requires_iso_strict_versioning: boolean;
  final_lifecycle_stage: FinalLifecycleStage;
  created_at: string;
  updated_at: string;
  role_count: number;
  access_level: string[];
}

export interface DocumentTypeDetailResponse {
  data: DocumentTypeDetail;
  transaction_id: string;
  timestamp: string;
}

export interface DocumentTypesResponse {
  data: DocumentType[];
  transaction_id: string;
  timestamp: string;
}

export interface CreateDocumentTypeData {
  name: string;
  color: string;
  requires_iso_strict_versioning?: boolean;
  final_lifecycle_stage?: FinalLifecycleStage;
}

export interface UpdateDocumentTypeData {
  name?: string;
  color?: string;
  requires_iso_strict_versioning?: boolean;
  final_lifecycle_stage?: FinalLifecycleStage;
}
