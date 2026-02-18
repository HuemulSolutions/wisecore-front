// Main exports for assets components
export * from './dialogs';  
export * from './content';
export { EmptyState } from './empty-state';
export { LoadingOverlay } from './loading-overlay';

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
