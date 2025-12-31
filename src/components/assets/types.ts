// Shared types for Assets page

/**
 * Represents an item in the library (folder or document)
 */
export interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
  document_type?: {
    id: string;
    name: string;
    color: string;
  };
  access_levels?: string[];
}

/**
 * Represents an item in the breadcrumb navigation
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
}

/**
 * Navigation state passed between pages
 */
export type LibraryNavigationState = {
  selectedDocumentId?: string;
  selectedDocumentName?: string;
  selectedDocumentType?: "document" | "folder";
  restoreBreadcrumb?: boolean;
  breadcrumb?: BreadcrumbItem[];
  fromLibrary?: boolean;
};
