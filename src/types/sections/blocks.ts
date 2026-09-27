import type { RefObject } from "react";
import type { SectionPlateEditorRef } from "@/types/section-plate-editor";
import type { EditorMediaUploadTarget } from "@/contexts/media-reference-context";
import type { SectionType } from "./core";

/** Fila candidata a contexto de una sección IA (secciones anteriores, o posteriores ya elegidas). */
export interface SectionContextOption {
  id: string;
  name: string;
  type: SectionType;
  /** Posición 1-based en la lista completa de secciones — mismo criterio que dependencyContextLabel. */
  position: number;
  /** true si esta fila es posterior a la sección actual (compatibilidad con una dependencia vieja). */
  isLaterSection?: boolean;
}

export interface SectionContextPickerProps {
  options: SectionContextOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export interface SectionAiBlockProps {
  editorType: "simple" | "rich";
  editorKey: number;
  promptEditorRef: RefObject<SectionPlateEditorRef | null>;
  prompt: string;
  onPromptChange: (value: string) => void;
  isPending?: boolean;
  isGenerating: boolean;
  canGeneratePrompt: boolean;
  onGeneratePrompt: () => void;
  canEditWithAi: boolean;
  isEditingWithAi: boolean;
  onOpenAiEdit: () => void;
  isAiEditOpen: boolean;
  onAiEditOpenChange: (open: boolean) => void;
  onSendAiEdit: (instruction: string) => void;
  promptBeforeAiEdit: string | null;
  onUndoAiEdit: () => void;
  organizationId?: string;
  documentId?: string;
  mediaUploadTarget: EditorMediaUploadTarget | null;
  contextOptions: SectionContextOption[];
  selectedContextIds: string[];
  onContextChange: (ids: string[]) => void;
}

export interface SectionManualBlockProps {
  editorKey: number;
  manualEditorRef: RefObject<SectionPlateEditorRef | null>;
  manualInput: string;
  sectionId: string;
  organizationId?: string;
  documentId?: string;
  mediaUploadTarget: EditorMediaUploadTarget | null;
  onChange: () => void;
}

export interface SectionReferenceOption {
  id: string;
  name: string;
}

export interface SectionReferenceBlockProps {
  isPending?: boolean;
  organizationId: string;
  selectedAsset: SectionReferenceOption | null;
  onAssetPick: (id: string, label: string) => void;
  onClearAsset: () => void;
  assetSections: SectionReferenceOption[];
  isLoadingSections: boolean;
  referenceSectionId: string;
  onReferenceSectionChange: (sectionId: string, sectionName: string) => void;
  referenceMode: "latest" | "specific";
  onReferenceModeChange: (mode: "latest" | "specific") => void;
  availableExecutions: SectionReferenceOption[];
  isLoadingExecutions: boolean;
  referenceExecutionId: string;
  onReferenceExecutionChange: (id: string) => void;
  previewContent: string | null | undefined;
  isLoadingPreview: boolean;
  onRefreshPreview: () => void;
}

export interface SectionPropagationFieldsProps {
  showToDocuments: boolean;
  propagateToDocuments: boolean;
  onPropagateToDocumentsChange: (checked: boolean) => void;
  showToSections: boolean;
  propagateToSections: boolean;
  onPropagateToSectionsChange: (checked: boolean) => void;
  showToTemplate: boolean;
  propagateToTemplate: boolean;
  onPropagateToTemplateChange: (checked: boolean) => void;
  disabled?: boolean;
}
