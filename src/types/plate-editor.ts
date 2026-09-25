import type { Value } from 'platejs'
import type { ReactNode } from 'react'
import type { EditorMediaUploadTarget } from '@/contexts/media-reference-context'

export interface PlateRichEditorRef {
  /** Serialize the current editor content to Markdown */
  getMarkdown: () => string;
  /** Return the current editor content as Plate Value (JSON nodes) */
  getValue: () => Value;
  /** Reset the editor content from a markdown string */
  resetContent: (markdown: string) => void;
  /** Reset the editor content directly from a Plate Value (preserves comment marks) */
  resetValue: (value: Value) => void;
}

export interface PlateRichEditorProps {
  /** Additional CSS class names */
  className?: string;
  /** Initial editor value as Plate nodes */
  value?: Value;
  /** Initial editor content as a Markdown string (used instead of value) */
  initialMarkdown?: string;
  /** Callback when editor value changes */
  onChange?: (value: Value) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Whether to show the toolbar (default: true) */
  showToolbar?: boolean;
  /** Editor variant: 'default' for standalone, 'section' for embedded in asset sections */
  variant?: 'default' | 'section';
  /** Extra action buttons rendered at the end of the section toolbar */
  toolbarActions?: ReactNode;
  /** Document ID – enables discussion/comment sync with backend when provided */
  documentId?: string;
  /** Section execution ID – required for creating discussions via with-comment endpoint */
  sectionExecutionId?: string;
  /**
   * Organization ID – required to enable the media reference picker (insert media).
   * When provided alongside documentId, a media picker button and slash command
   * become available in the editor.
   */
  organizationId?: string;
  /**
   * Where files uploaded from this editor should be attached (level + parent id).
   * When omitted, uploads fall back to the organization level.
   */
  mediaUploadTarget?: EditorMediaUploadTarget | null;
  /**
   * Called immediately after a discussion is created or a comment is added.
   * Use this to auto-save plate_content so comment marks survive a page refresh.
   */
  onAfterDiscussionMutation?: () => void;
  /** Callback to create a new section from selected text (floating toolbar) */
  onCreateSectionFromSelection?: (selectedMarkdown: string) => void;
  /** Whether the floating toolbar comment button is enabled (default: true) */
  enableComments?: boolean;
  /** Whether the floating toolbar create-section button is enabled (default: true) */
  enableCreateSection?: boolean;
  /**
   * CSS top offset for the sticky section toolbar (e.g. '36px' when there is a
   * fixed header above the editor). Defaults to 0 (toolbar sticks to the top of the
   * nearest scroll container). Only applies to variant='section'.
   */
  toolbarTopOffset?: string;
}
