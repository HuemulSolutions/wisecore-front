import type { Tag } from '@/types/tags';

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
  /** Carpeta a la que pertenece este tipo de documento, o null si no está en ninguna. */
  document_type_folder_id: string | null;
  /** Solo presente si se pidió el listado con `include_tags=true`. */
  tags?: Tag[];
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
  /** Carpeta a la que pertenece este tipo de documento, o null si no está en ninguna. */
  document_type_folder_id: string | null;
}

export interface DocumentTypeDetailResponse {
  data: DocumentTypeDetail;
  transaction_id: string;
  timestamp: string;
}

export interface DocumentTypesResponse {
  data: DocumentType[];
  page?: number;
  page_size?: number;
  has_next?: boolean;
  transaction_id: string;
  timestamp: string;
}

export interface CreateDocumentTypeData {
  name: string;
  color: string;
  requires_iso_strict_versioning?: boolean;
  final_lifecycle_stage?: FinalLifecycleStage;
  document_type_folder_id?: string | null;
}

export interface UpdateDocumentTypeData {
  name?: string;
  color?: string;
  requires_iso_strict_versioning?: boolean;
  final_lifecycle_stage?: FinalLifecycleStage;
  document_type_folder_id?: string | null;
}
