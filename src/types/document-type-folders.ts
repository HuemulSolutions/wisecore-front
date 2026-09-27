// Document Type Folders - agrupamiento plano (sin subcarpetas) de tipos de documento

export interface DocumentTypeFolder {
  id: string;
  name: string;
  /** Solo presente en la respuesta de listado (GET /document_type_folders/); ausente en el detalle. */
  document_type_count?: number;
}

export interface DocumentTypeFoldersResponse {
  data: DocumentTypeFolder[];
  page: number;
  page_size: number;
  has_next: boolean;
  transaction_id: string;
  timestamp: string;
}

export interface DocumentTypeFolderResponse {
  data: DocumentTypeFolder;
  transaction_id: string;
  timestamp: string;
}

export interface CreateDocumentTypeFolderData {
  name: string;
}

export interface UpdateDocumentTypeFolderData {
  name?: string;
}

export interface AssignDocumentTypesToFolderData {
  document_type_ids: string[];
}
