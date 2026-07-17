'use client';

import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import type { Value } from 'platejs';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { PlateRichEditor, type PlateRichEditorRef } from './plate-editor';
import { useTranslation } from 'react-i18next';
import type { SectionPlateEditorRef, SectionPlateEditorProps } from '@/types/section-plate-editor';
export type { SectionPlateEditorRef, SectionPlateEditorProps } from '@/types/section-plate-editor';
import { normalizePlateMediaForSave } from '@/lib/plate-media-utils';

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
  organizationId,
  mediaUploadTarget,
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
    // Rewrite url/previewUrl back to {{MEDIA:<uuid>}} for every media node before
    // persisting, so the backend always has a placeholder to re-resolve fresh on
    // the next load (a resolved SAS previewUrl left in place would expire and
    // never be refreshed again).
    const normalized = plateValue ? normalizePlateMediaForSave(plateValue) : plateValue;
    const newPlateContent = normalized?.map((node) => JSON.stringify(node));
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
        mediaUploadTarget={mediaUploadTarget}
        enableComments={enableComments}
        enableCreateSection={enableCreateSection}
        toolbarTopOffset={toolbarTopOffset}
        organizationId={organizationId}
        onAfterDiscussionMutation={onAutoSavePlateContent ? () => {
          // Read current editor state and persist plate_content silently
          // so comment marks survive a page refresh.
          const md = editorRef.current?.getMarkdown() ?? content;
          const plateValue = editorRef.current?.getValue();
          if (plateValue) {
            const normalized = normalizePlateMediaForSave(plateValue);
            onAutoSavePlateContent(sectionId, md, normalized.map((n) => JSON.stringify(n)));
          }
        } : undefined}
        onCreateSectionFromSelection={enableCreateSection ? onCreateSectionFromSelection : undefined}
      />
    </div>
  );
});

export default SectionPlateEditor;
