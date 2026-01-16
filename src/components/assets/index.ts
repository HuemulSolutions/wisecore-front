// Main exports for assets components
export * from './dialogs';  
export * from './content';

// Re-export types from centralized location
export type {
  LibraryItem,
  BreadcrumbItem,
  LibraryNavigationState,
  DocumentType,
  FileNode,
  BasicFileNode,
  FileTreeProps,
  FolderContentResponse,
  CreateAssetRequest,
  CreateFolderRequest,
  ContentSection,
  LibraryContentProps,
  CreateAssetDialogProps,
  CreateFolderDialogProps,
  DeleteDocumentDialogProps,
  DeleteFolderDialogProps,
  EditDocumentDialogProps,
  EditFolderDialogProps,
  EditCustomFieldDocumentDialogProps
} from '@/types/assets';
