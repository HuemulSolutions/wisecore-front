'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { PlateRichEditor, type PlateRichEditorRef } from './plate-editor';

interface SectionPlateEditorProps {
  /** Section ID for save callbacks */
  sectionId: string;
  /** Markdown content to display / edit */
  content: string;
  /** Whether the editor is in edit mode */
  isEditing: boolean;
  /** Called when the user saves – receives (sectionId, markdownString) */
  onSave: (sectionId: string, newContent: string) => void | Promise<void>;
  /** Called when the user cancels editing */
  onCancel: () => void;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
  /** Optional className for the outer wrapper */
  className?: string;
}

/**
 * Unified section-level Plate component for both viewing and editing.
 *
 * - When `isEditing` is false the editor renders in read-only mode with no
 *   toolbar and no border, looking like styled content.
 * - When `isEditing` is true the toolbar appears together with Save / Cancel
 *   action buttons.
 *
 * The content round-trips through Markdown: the initial value is deserialized
 * from markdown and on save serialized back to markdown via `getMarkdown()`.
 */
export default function SectionPlateEditor({
  sectionId,
  content,
  isEditing,
  onSave,
  onCancel,
  isSaving = false,
  className,
}: SectionPlateEditorProps) {
  const editorRef = useRef<PlateRichEditorRef>(null);
  const [dirty, setDirty] = useState(false);

  // Reset dirty flag when editing mode changes
  useEffect(() => {
    if (!isEditing) setDirty(false);
  }, [isEditing]);

  const handleChange = useCallback(() => {
    if (!dirty) setDirty(true);
  }, [dirty]);

  const handleSave = useCallback(() => {
    if (!dirty || isSaving) return;
    const md = editorRef.current?.getMarkdown() ?? content;
    onSave(sectionId, md);
  }, [dirty, isSaving, sectionId, content, onSave]);

  const handleCancel = useCallback(() => {
    if (isSaving) return;
    editorRef.current?.resetContent(content);
    onCancel();
  }, [isSaving, content, onCancel]);

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
      {/* Plate Editor – switches between view / edit via readOnly + toolbar */}
      <PlateRichEditor
        ref={editorRef}
        initialMarkdown={content}
        readOnly={!isEditing}
        showToolbar={isEditing}
        onChange={handleChange}
        variant="section"
        className={isEditing ? 'min-h-[240px]' : undefined}
        toolbarActions={actionButtons}
      />
    </div>
  );
}
