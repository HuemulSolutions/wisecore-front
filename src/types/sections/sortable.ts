import type { SortableSectionItem, SortableSectionSheetItem } from './core'

export interface SortableSectionProps {
  item: SortableSectionItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string) => void;
}

export interface SortableSectionSheetProps {
  item: SortableSectionSheetItem;
  existingSections: object[];
  onSave: (sectionId: string, sectionData: object) => void;
  onDelete: (sectionId: string, options?: { executionId?: string; propagate_to_documents?: boolean }) => Promise<void>;
  isOverlay?: boolean;
  hasTemplate?: boolean;
  isTemplateSection?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  isDisabledSection?: boolean;
  onAddToCurrentVersion?: (sectionId: string) => void;
  isAddToCurrentVersionPending?: boolean;
  currentExecutionId?: string | null;
  useExecutionDeleteDialog?: boolean;
}

export type DeleteMode = "structure" | "structure_and_current_version";
