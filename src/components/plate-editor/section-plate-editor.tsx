'use client';

import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import type { Value } from 'platejs';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { PlateRichEditor, type PlateRichEditorRef } from './plate-editor';
import { useTranslation } from 'react-i18next';

/** Public ref API – mirrors PlateRichEditorRef for use in forms */
export interface SectionPlateEditorRef {
  getMarkdown: () => string;
  getValue: () => Value;
  resetContent: (markdown: string) => void;
  resetValue: (value: Value) => void;
}

interface SectionPlateEditorProps {
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

/**
 * Ensure every element node has an iterable `children` array so Slate never crashes.
 * Also validates table hierarchy: table children must be tr rows, and tr children
 * must be td/th cells. Invalid children are filtered out to prevent
 * computeCellIndices from crashing on non-iterable row.children.
 */
function sanitizeNodes(nodes: unknown[]): Value {
  return nodes.map((node) => {
    if (typeof node !== 'object' || node === null) {
      return { text: String(node ?? '') };
    }
    if ('text' in node) return node;
    const el = node as Record<string, unknown>;
    let children = Array.isArray(el.children)
      ? sanitizeNodes(el.children as unknown[])
      : [{ text: '' }];

    const type = el.type as string | undefined;

    // Table children must be row elements (tr)
    if (type === 'table') {
      children = (children as any[]).filter(
        (child) => child && typeof child === 'object' && !('text' in child) && child.type === 'tr'
      ) as Value;
      if (children.length === 0) {
        children = [{ type: 'tr', children: [{ type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] }] }] as Value;
      }
    }
    // Row children must be cell elements (td / th)
    else if (type === 'tr') {
      children = (children as any[]).filter(
        (child) => child && typeof child === 'object' && !('text' in child) && (child.type === 'td' || child.type === 'th')
      ) as Value;
      if (children.length === 0) {
        children = [{ type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] }] as Value;
      }
    }

    return {
      ...el,
      children,
    };
  }) as Value;
}

/** Parse a plate_content string[] into a Plate Value, returning null on failure. */
function parsePlateContent(raw: string[]): Value | null {
  try {
    const nodes = raw.map((s) => JSON.parse(s));
    if (nodes.length > 0) return sanitizeNodes(nodes);
  } catch {
    // malformed JSON – fall back to markdown
  }
  return null;
}

/**
 * Unified section-level Plate component for both viewing and editing.
 *
 * - When `isEditing` is false the editor renders in read-only mode with no
 *   toolbar and no border, looking like styled content.
 * - When `isEditing` is true the toolbar appears together with Save / Cancel
 *   action buttons (unless `hideActions` is true).
 *
 * Initialization priority:
 *   1. `plateContent` (rich JSON with comment marks) when available
 *   2. `content` (markdown string) as fallback
 */
const SectionPlateEditor = forwardRef<SectionPlateEditorRef, SectionPlateEditorProps>(
  function SectionPlateEditor({
  sectionId = '',
  content = '',
  plateContent,
  initialValue,
  isEditing = false,
  onSave,
  onCancel,
  isSaving = false,
  className,
  documentId,
  sectionExecutionId,
  onCreateSectionFromSelection,
  onAutoSavePlateContent,
  enableComments = true,
  enableCreateSection = true,
  hideActions = false,
  toolbarTopOffset,
  onValueChange,
}, ref) {
  const editorRef = useRef<PlateRichEditorRef>(null);
  const [dirty, setDirty] = useState(false);
  const prevContentRef = useRef<string>(content);
  const { t } = useTranslation('common');

  // Expose editor methods via ref for use in parent forms
  useImperativeHandle(ref, () => ({
    getMarkdown: () => editorRef.current?.getMarkdown() ?? content,
    getValue: () => editorRef.current?.getValue() ?? [],
    resetContent: (markdown: string) => editorRef.current?.resetContent(markdown),
    resetValue: (value: Value) => editorRef.current?.resetValue(value),
  }), [content]);

  // Parse plate_content once per section load.
  // Priority: initialValue > plateContent (JSON) > content (markdown)
  const initialPlateValue = useMemo(
    () => {
      if (initialValue) return initialValue;
      return plateContent ? parsePlateContent(plateContent) : null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionId], // re-parse only when the section changes, not on every render
  );

  // Reset dirty flag when editing mode changes
  useEffect(() => {
    if (!isEditing) setDirty(false);
  }, [isEditing]);

  // When content prop changes from outside (e.g. after a section execution refresh),
  // reset the editor so the new content is displayed – but only when not actively editing.
  // Prefer resetValue (JSON) over resetContent (markdown) to preserve comment marks.
  useEffect(() => {
    if (!isEditing && content !== prevContentRef.current) {
      prevContentRef.current = content;
      if (plateContent) {
        const parsed = parsePlateContent(plateContent);
        if (parsed) {
          editorRef.current?.resetValue(parsed);
          return;
        }
      }
      editorRef.current?.resetContent(content);
    }
  }, [content, plateContent, isEditing]);

  const handleChange = useCallback((value: Value) => {
    if (!dirty) setDirty(true);
    onValueChange?.(value);
  }, [dirty, onValueChange]);

  const handleSave = useCallback(() => {
    if (!dirty || isSaving) return;
    const md = editorRef.current?.getMarkdown() ?? content;
    const plateValue = editorRef.current?.getValue();
    const newPlateContent = plateValue?.map((node) => JSON.stringify(node));
    onSave?.(sectionId, md, newPlateContent);
  }, [dirty, isSaving, sectionId, content, onSave]);

  const handleCancel = useCallback(() => {
    if (isSaving) return;
    // On cancel, restore to the last saved state (prefer plate JSON if available)
    if (plateContent) {
      const parsed = parsePlateContent(plateContent);
      if (parsed) {
        editorRef.current?.resetValue(parsed);
        onCancel?.();
        return;
      }
    }
    editorRef.current?.resetContent(content);
    onCancel?.();
  }, [isSaving, content, plateContent, onCancel]);

  const actionButtons = isEditing && !hideActions ? (
    <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-1.5">
      <Button
        variant="outline"
        onClick={handleCancel}
        className="hover:cursor-pointer"
        size="sm"
        disabled={isSaving}
      >
        <X className="h-4 w-4 mr-1" />
        {t('cancel')}
      </Button>
      <Button
        onClick={handleSave}
        className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
        size="sm"
        disabled={!dirty || isSaving}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Check className="h-4 w-4 mr-1" />
        )}
        {isSaving ? t('saving') : t('save')}
      </Button>
    </div>
  ) : undefined;

  return (
    <div className={className}>
      {/* Plate Editor – switches between view / edit via readOnly + toolbar.
          Prefer initializing from plate JSON (preserves comment marks) over markdown. */}
      <PlateRichEditor
        ref={editorRef}
        value={initialPlateValue ?? undefined}
        initialMarkdown={initialPlateValue ? undefined : content}
        readOnly={!isEditing}
        showToolbar={isEditing}
        onChange={handleChange}
        variant="section"
        className={isEditing && !hideActions ? 'min-h-[240px]' : undefined}
        toolbarActions={actionButtons}
        documentId={documentId}
        sectionExecutionId={sectionExecutionId}
        enableComments={enableComments}
        enableCreateSection={enableCreateSection}
        toolbarTopOffset={toolbarTopOffset}
        onAfterDiscussionMutation={onAutoSavePlateContent ? () => {
          // Read current editor state and persist plate_content silently
          // so comment marks survive a page refresh.
          const md = editorRef.current?.getMarkdown() ?? content;
          const plateValue = editorRef.current?.getValue();
          if (plateValue) {
            onAutoSavePlateContent(sectionId, md, plateValue.map((n) => JSON.stringify(n)));
          }
        } : undefined}
        onCreateSectionFromSelection={enableCreateSection ? onCreateSectionFromSelection : undefined}
      />
    </div>
  );
});

export default SectionPlateEditor;
