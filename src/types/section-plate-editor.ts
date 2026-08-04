import type { Value } from 'platejs'
import type { EditorMediaUploadTarget } from '@/contexts/media-reference-context'

export interface SectionPlateEditorRef {
  getMarkdown: () => string;
  getValue: () => Value;
  resetContent: (markdown: string) => void;
  resetValue: (value: Value) => void;
  /**
   * Renders + uploads a fresh snapshot for every Mermaid diagram whose code changed
   * since its last snapshot, writes the resulting media reference back into the live
   * editor value, and returns it. Call this before getMarkdown()/getValue() when
   * persisting, so the serialized markdown/plate_content reference the freshest
   * snapshot instead of a stale or missing one. No-op (current value unchanged) when
   * the editor wasn't given an organizationId to upload with.
   */
  ensureMermaidSnapshots: () => Promise<{ value: Value; failed: number }>;
}

export interface SectionPlateEditorProps {
  /** Section ID for save callbacks. Optional when used as a plain form field. */
  sectionId?: string;
  /** Markdown content to display / edit. Defaults to empty string. */
  content?: string;
  /**
   * Plate JSON nodes (stringified array) previously saved alongside the markdown.
   * When provided, the editor is initialized from this rich JSON instead of the
   * plain markdown, preserving comment marks and other metadata that markdown
   * serialisation cannot carry.
   */
  plateContent?: string[];
  /**
   * Direct Plate Value for initialization. Takes priority over plateContent and
   * content. Useful when used as a form field that already holds a Plate Value.
   */
  initialValue?: Value;
  /** Whether the editor is in edit mode. Defaults to false. */
  isEditing?: boolean;
  /** Called when the user saves – receives (sectionId, markdownString, plateContent) */
  onSave?: (sectionId: string, newContent: string, plateContent?: string[]) => void | Promise<void>;
  /** Called when the user cancels editing */
  onCancel?: () => void;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
  /** Optional className for the outer wrapper */
  className?: string;
  /** Document ID – enables discussion/comment sync when provided */
  documentId?: string;
  /** Section execution ID – required for creating discussions */
  sectionExecutionId?: string;
  /**
   * Organization ID – when provided alongside documentId, enables the media
   * reference picker so users can insert existing media into the section.
   */
  organizationId?: string;
  /**
   * Where files uploaded from this editor should be attached (level + parent id).
   * When omitted, uploads fall back to the organization level.
   */
  mediaUploadTarget?: EditorMediaUploadTarget | null;
  /** Callback to create a new section from selected text */
  onCreateSectionFromSelection?: (selectedMarkdown: string) => void;
  /**
   * Called after any discussion mutation (create discussion, add comment reply).
   * Receives (sectionId, markdown, plateContent) so the caller can silently
   * persist the updated plate_content – which now contains the comment marks –
   * without requiring the user to explicitly save the section.
   */
  onAutoSavePlateContent?: (sectionId: string, markdown: string, plateContent: string[]) => void;
  /** Whether the floating toolbar comment button is enabled (default: true) */
  enableComments?: boolean;
  /** Whether the floating toolbar create-section button is enabled (default: true) */
  enableCreateSection?: boolean;
  /**
   * When true the Save/Cancel action buttons are hidden from the toolbar.
   * Useful when the editor is embedded inside a form that handles submission.
   */
  hideActions?: boolean;
  /**
   * CSS top offset for the sticky toolbar (e.g. '36px' when there is a fixed header
   * above the editor in an asset section panel). Defaults to 0.
   */
  toolbarTopOffset?: string;
  /**
   * Fired on every editor change with the current raw Plate Value.
   * Useful for form fields that store the Plate Value directly.
   */
  onValueChange?: (value: Value) => void;
}
