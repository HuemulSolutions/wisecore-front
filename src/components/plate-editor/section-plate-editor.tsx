'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Value } from 'platejs';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { PlateRichEditor, type PlateRichEditorRef } from './plate-editor';

interface SectionPlateEditorProps {
  /** Section ID for save callbacks */
  sectionId: string;
  /** Markdown content to display / edit */
  content: string;
  /**
   * Plate JSON nodes (stringified array) previously saved alongside the markdown.
   * When provided, the editor is initialized from this rich JSON instead of the
   * plain markdown, preserving comment marks and other metadata that markdown
   * serialisation cannot carry.
   */
  plateContent?: string[];
  /** Whether the editor is in edit mode */
  isEditing: boolean;
  /** Called when the user saves – receives (sectionId, markdownString, plateContent) */
  onSave: (sectionId: string, newContent: string, plateContent?: string[]) => void | Promise<void>;
  /** Called when the user cancels editing */
  onCancel: () => void;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
  /** Optional className for the outer wrapper */
  className?: string;
  /** Document ID – enables discussion/comment sync when provided */
  documentId?: string;
  /** Callback to create a new section from selected text */
  onCreateSectionFromSelection?: (selectedMarkdown: string) => void;
  /**
   * Called after any discussion mutation (create discussion, add comment reply).
   * Receives (sectionId, markdown, plateContent) so the caller can silently
   * persist the updated plate_content – which now contains the comment marks –
   * without requiring the user to explicitly save the section.
   */
  onAutoSavePlateContent?: (sectionId: string, markdown: string, plateContent: string[]) => void;
}

/** Parse a plate_content string[] into a Plate Value, returning null on failure. */
function parsePlateContent(raw: string[]): Value | null {
  try {
    const nodes = raw.map((s) => JSON.parse(s));
    if (nodes.length > 0) return nodes as Value;
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
 *   action buttons.
 *
 * Initialization priority:
 *   1. `plateContent` (rich JSON with comment marks) when available
 *   2. `content` (markdown string) as fallback
 */
export default function SectionPlateEditor({
  sectionId,
  content,
  plateContent,
  isEditing,
  onSave,
  onCancel,
  isSaving = false,
  className,
  documentId,
  onCreateSectionFromSelection,
  onAutoSavePlateContent,
}: SectionPlateEditorProps) {
  const editorRef = useRef<PlateRichEditorRef>(null);
  const [dirty, setDirty] = useState(false);
  const prevContentRef = useRef<string>(content);

  // Parse plate_content once per section load.
  // If valid JSON is available it takes priority over markdown for initialization.
  const initialPlateValue = useMemo(
    () => (plateContent ? parsePlateContent(plateContent) : null),
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

  const handleChange = useCallback(() => {
    if (!dirty) setDirty(true);
  }, [dirty]);

  const handleSave = useCallback(() => {
    if (!dirty || isSaving) return;
    const md = editorRef.current?.getMarkdown() ?? content;
    const plateValue = editorRef.current?.getValue();
    const newPlateContent = plateValue?.map((node) => JSON.stringify(node));
    onSave(sectionId, md, newPlateContent);
  }, [dirty, isSaving, sectionId, content, onSave]);

  const handleCancel = useCallback(() => {
    if (isSaving) return;
    // On cancel, restore to the last saved state (prefer plate JSON if available)
    if (plateContent) {
      const parsed = parsePlateContent(plateContent);
      if (parsed) {
        editorRef.current?.resetValue(parsed);
        onCancel();
        return;
      }
    }
    editorRef.current?.resetContent(content);
    onCancel();
  }, [isSaving, content, plateContent, onCancel]);

  const actionButtons = isEditing ? (
    <>
      <Button
        variant="ghost"
        onClick={handleCancel}
        className="hover:cursor-pointer hover:bg-gray-100 h-7 w-7 p-0"
        size="sm"
        disabled={isSaving}
      >
        <X className="h-4 w-4 text-gray-600" />
      </Button>
      <Button
        onClick={handleSave}
        className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer h-7 w-7 p-0"
        size="sm"
        disabled={!dirty || isSaving}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </Button>
    </>
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
        className={isEditing ? 'min-h-[240px]' : undefined}
        toolbarActions={actionButtons}
        documentId={documentId}
        onAfterDiscussionMutation={onAutoSavePlateContent ? () => {
          // Read current editor state and persist plate_content silently
          // so comment marks survive a page refresh.
          const md = editorRef.current?.getMarkdown() ?? content;
          const plateValue = editorRef.current?.getValue();
          if (plateValue) {
            onAutoSavePlateContent(sectionId, md, plateValue.map((n) => JSON.stringify(n)));
          }
        } : undefined}
        onCreateSectionFromSelection={onCreateSectionFromSelection}
      />
    </div>
  );
}

