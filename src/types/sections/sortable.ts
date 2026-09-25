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
  documentId?: string;
  templateId?: string;
  /**
   * true si esta sección tiene su propio permiso de edición resuelto por el
   * ciclo de vida y ese permiso es `false` para el usuario actual (ver
   * ContentSection.can_edit en src/types/assets/core.ts). Pinta un badge que
   * explica por qué está deshabilitada aunque `canUpdate`/`canDelete` del resto
   * de la lista sea `true`.
   */
  hasOwnLifecycleRule?: boolean;
}

export type DeleteMode = "structure" | "structure_and_current_version";
