'use client';

import * as React from 'react';
import type { Value } from 'platejs';

import { normalizeNodeId } from 'platejs';

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
import { Plate, usePlateEditor, usePlateState, usePluginOption, useEditorRef, useEditorSelector } from 'platejs/react';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  Subscript,
  Superscript,
  Undo2,
  Redo2,
  Keyboard,
  FileDown,
  Copy,
  Check,
} from 'lucide-react';

import { BasicNodesKit } from '@/components/plate-editor/components/basic-nodes-kit';
import { AlignKit } from '@/components/plate-editor/components/align-kit';
import { ListKit } from '@/components/plate-editor/components/list-kit';
import { LinkKit } from '@/components/plate-editor/components/link-kit';
import { TableKit } from '@/components/plate-editor/components/table-kit';
import { ToggleKit } from '@/components/plate-editor/components/toggle-kit';
import { MediaKit } from '@/components/plate-editor/components/media-kit';
import { CommentKit } from '@/components/plate-editor/components/comment-kit';
import { DiscussionKit } from '@/components/plate-editor/components/discussion-kit';
import { SuggestionKit } from '@/components/plate-editor/components/suggestion-kit';
import { EmojiKit } from '@/components/plate-editor/components/emoji-kit';
import { MentionKit } from '@/components/plate-editor/components/mention-kit';
import { SlashKit } from '@/components/plate-editor/components/slash-kit';
import { DateKit } from '@/components/plate-editor/components/date-kit';
import { TocKit } from '@/components/plate-editor/components/toc-kit';
import { MarkdownKit } from '@/components/plate-editor/components/markdown-kit';

import { Editor, EditorContainer } from '@/components/ui/editor';
import { FloatingToolbarButtons } from '@/components/ui/floating-toolbar-buttons';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import { AlignToolbarButton } from '@/components/ui/align-toolbar-button';
import { LinkToolbarButton } from '@/components/ui/link-toolbar-button';
import { TableToolbarButton } from '@/components/ui/table-toolbar-button';
import { IndentToolbarButton, OutdentToolbarButton } from '@/components/ui/indent-toolbar-button';
import { ToggleToolbarButton } from '@/components/ui/toggle-toolbar-button';
import { BulletedListToolbarButton, NumberedListToolbarButton, TodoListToolbarButton } from '@/components/ui/list-toolbar-button';
import { FontColorToolbarButton } from '@/components/ui/font-color-toolbar-button';
import { MediaToolbarButton } from '@/components/ui/media-toolbar-button';
import { TurnIntoToolbarButton } from '@/components/ui/turn-into-toolbar-button';
import { CommentToolbarButton } from '@/components/ui/comment-toolbar-button';
import { ModeToolbarButton } from '@/components/ui/mode-toolbar-button';
import { EmojiToolbarButton } from '@/components/ui/emoji-toolbar-button';
import { FontSizeToolbarButton } from '@/components/ui/font-size-toolbar-button';
import { ToolbarButton, ToolbarSeparator } from '@/components/ui/toolbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarkdownPlugin } from '@platejs/markdown';

import { FontSizePlugin, FontColorPlugin, FontBackgroundColorPlugin } from '@platejs/basic-styles/react';
import { cn } from '@/lib/utils';
import { DiscussionSync } from '@/components/plate-editor/components/discussion-sync';
import { EditorErrorBoundary } from '@/components/plate-editor/components/editor-error-boundary';
import { useTranslation } from 'react-i18next';


function EditorToolbar() {
  const editor = useEditorRef();
  const [readOnly] = usePlateState('readOnly');
  const isSuggesting = usePluginOption(SuggestionPlugin, 'isSuggesting');
  const { t } = useTranslation('editor');

  const canUndo = useEditorSelector((editor) => (editor.history?.undos?.length ?? 0) > 0, []);
  const canRedo = useEditorSelector((editor) => (editor.history?.redos?.length ?? 0) > 0, []);

  const isEditing = !readOnly && !isSuggesting;
  const isViewing = readOnly;

  const [markdownDialogOpen, setMarkdownDialogOpen] = React.useState(false);
  const [markdownOutput, setMarkdownOutput] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const handleSaveAsMarkdown = React.useCallback(() => {
    const md = editor.getApi(MarkdownPlugin).markdown.serialize();
    setMarkdownOutput(md);
    setMarkdownDialogOpen(true);
    setCopied(false);
  }, [editor]);

  const handleCopyMarkdown = React.useCallback(async () => {
    await navigator.clipboard.writeText(markdownOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdownOutput]);

  const handleDownloadMarkdown = React.useCallback(() => {
    const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [markdownOutput]);

  return (
    <FixedToolbar className="flex items-center gap-0.5 px-1 py-1">
      {/* Undo / Redo */}
      {isEditing && (
        <>
          <ToolbarButton
            tooltip={t('toolbar.undo')}
            onClick={() => editor.undo()}
            disabled={!canUndo}
          >
            <Undo2 />
          </ToolbarButton>
          <ToolbarButton
            tooltip={t('toolbar.redo')}
            onClick={() => editor.redo()}
            disabled={!canRedo}
          >
            <Redo2 />
          </ToolbarButton>

          <ToolbarSeparator />
        </>
      )}

      {/* Text formatting */}
      {isEditing && (
        <>
          <MarkToolbarButton nodeType="bold" tooltip={t('toolbar.bold')}>
            <Bold />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip={t('toolbar.italic')}>
            <Italic />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip={t('toolbar.underline')}>
            <Underline />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="strikethrough" tooltip={t('toolbar.strikethrough')}>
            <Strikethrough />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="code" tooltip={t('toolbar.code')}>
            <Code />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="highlight" tooltip={t('toolbar.highlight')}>
            <Highlighter />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="superscript" tooltip={t('toolbar.superscript')}>
            <Superscript />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="subscript" tooltip={t('toolbar.subscript')}>
            <Subscript />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="kbd" tooltip={t('toolbar.keyboard')}>
            <Keyboard />
          </MarkToolbarButton>

          <ToolbarSeparator />
        </>
      )}

      {/* Font size & color */}
      {isEditing && (
        <>
          <FontSizeToolbarButton />
          <FontColorToolbarButton nodeType="color" tooltip={t('toolbar.textColor')} />
          <FontColorToolbarButton nodeType="backgroundColor" tooltip={t('toolbar.backgroundColor')} />

          <ToolbarSeparator />
        </>
      )}

      {/* Block type & structure */}
      {isEditing && (
        <>
          <TurnIntoToolbarButton />
          <AlignToolbarButton />
          <OutdentToolbarButton />
          <IndentToolbarButton />

          <ToolbarSeparator />
        </>
      )}

      {/* Lists */}
      {isEditing && (
        <>
          <BulletedListToolbarButton />
          <NumberedListToolbarButton />
          <TodoListToolbarButton />

          <ToolbarSeparator />
        </>
      )}

      {/* Insert elements */}
      {isEditing && (
        <>
          <LinkToolbarButton />
          <TableToolbarButton />
          <ToggleToolbarButton />
          <MediaToolbarButton nodeType="img" />
          <EmojiToolbarButton />

          <ToolbarSeparator />
        </>
      )}

      {/* Highlight - suggestion mode */}
      {isSuggesting && (
        <>
          <MarkToolbarButton nodeType="highlight" tooltip={t('toolbar.highlight')}>
            <Highlighter />
          </MarkToolbarButton>
          <ToolbarSeparator />
        </>
      )}

      {/* Comment */}
      {!isViewing && (
        <>
          <CommentToolbarButton />
          <ToolbarSeparator />
        </>
      )}

      {/* Mode */}
      <ModeToolbarButton />

      {/* Save as Markdown */}
      <ToolbarSeparator />
      <ToolbarButton
        tooltip={t('toolbar.saveAsMarkdown')}
        onClick={handleSaveAsMarkdown}
        className="hover:cursor-pointer"
      >
        <FileDown />
      </ToolbarButton>

      {/* Markdown Preview Dialog */}
      <Dialog open={markdownDialogOpen} onOpenChange={setMarkdownDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('markdownDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('markdownDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:cursor-pointer transition-colors"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t('markdownDialog.copied') : t('markdownDialog.copy')}
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:cursor-pointer transition-colors"
            >
              <FileDown className="size-4" />
              {t('markdownDialog.download')}
            </button>
          </div>
          <pre className="flex-1 overflow-auto rounded-md border bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-words">
            {markdownOutput}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Spacer */}
      <div className="shrink-0" />
    </FixedToolbar>
  );
}

/**
 * Compact toolbar for section-level editing inside resizable panels.
 * Shows only the most essential formatting buttons and wraps on narrow widths.
 */
function SectionEditorToolbar({ actions, topOffset }: { actions?: React.ReactNode; topOffset?: string }) {
  const editor = useEditorRef();
  const { t } = useTranslation('editor');

  const canUndo = useEditorSelector((editor) => (editor.history?.undos?.length ?? 0) > 0, []);
  const canRedo = useEditorSelector((editor) => (editor.history?.redos?.length ?? 0) > 0, []);

  return (
    <FixedToolbar
      className="flex-col items-stretch gap-0 p-0"
      style={topOffset ? { top: topOffset } : { top: 0 }}
    >
      <div className="flex flex-wrap items-center gap-0.5 px-1 py-1">
        <ToolbarButton tooltip={t('toolbar.undo')} onClick={() => editor.undo()} disabled={!canUndo}>
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton tooltip={t('toolbar.redo')} onClick={() => editor.redo()} disabled={!canRedo}>
          <Redo2 />
        </ToolbarButton>

        <ToolbarSeparator />

        <MarkToolbarButton nodeType="bold" tooltip={t('toolbar.bold')}>
          <Bold />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="italic" tooltip={t('toolbar.italic')}>
          <Italic />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="underline" tooltip={t('toolbar.underline')}>
          <Underline />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="strikethrough" tooltip={t('toolbar.strikethrough')}>
          <Strikethrough />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="code" tooltip={t('toolbar.code')}>
          <Code />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="highlight" tooltip={t('toolbar.highlight')}>
          <Highlighter />
        </MarkToolbarButton>

        <ToolbarSeparator />

        <TurnIntoToolbarButton />

        <ToolbarSeparator />

        <BulletedListToolbarButton />
        <NumberedListToolbarButton />
        <TodoListToolbarButton />

        <ToolbarSeparator />

        <LinkToolbarButton />
        <TableToolbarButton />
        <MediaToolbarButton nodeType="img" />

        <ToolbarSeparator />

        <AlignToolbarButton />
        <OutdentToolbarButton />
        <IndentToolbarButton />

      </div>
      {actions && actions}
    </FixedToolbar>
  );
}

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

interface PlateRichEditorProps {
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
  toolbarActions?: React.ReactNode;
  /** Document ID – enables discussion/comment sync with backend when provided */
  documentId?: string;
  /** Section execution ID – required for creating discussions via with-comment endpoint */
  sectionExecutionId?: string;
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

export const PlateRichEditor = React.forwardRef<PlateRichEditorRef, PlateRichEditorProps>(
  function PlateRichEditor({
    className,
    value: externalValue,
    initialMarkdown,
    onChange,
    readOnly = false,
    showToolbar = true,
    variant = 'default',
    toolbarActions,
    documentId,
    sectionExecutionId,
    onAfterDiscussionMutation,
    onCreateSectionFromSelection,
    enableComments = true,
    enableCreateSection = true,
    toolbarTopOffset,
  }, ref) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { t } = useTranslation('editor');

  const editor = usePlateEditor({
    plugins: [
      ...BasicNodesKit,
      ...AlignKit,
      ...ListKit,
      ...LinkKit,
      ...TableKit,
      ...ToggleKit,
      ...MediaKit,
      ...DiscussionKit,
      ...CommentKit,
      ...SuggestionKit,
      ...EmojiKit,
      ...MentionKit,
      ...SlashKit,
      ...DateKit,
      ...TocKit,
      ...MarkdownKit,
      FontSizePlugin,
      FontColorPlugin,
      FontBackgroundColorPlugin,
    ],
    value: externalValue ?? normalizeNodeId([{ children: [{ text: '' }], type: 'p' }]),
  });

  // Expose getMarkdown, getValue, resetContent and resetValue via ref
  React.useImperativeHandle(ref, () => ({
    getMarkdown: () => editor.getApi(MarkdownPlugin).markdown.serialize(),
    getValue: () => editor.children as Value,
    resetContent: (markdown: string) => {
      try {
        const nodes = editor.getApi(MarkdownPlugin).markdown.deserialize(markdown);
        editor.tf.setValue(sanitizeNodes(nodes as unknown[]));
      } catch (e) {
        console.error('Failed to reset editor content:', e);
      }
    },
    resetValue: (value: Value) => {
      try {
        editor.tf.setValue(value);
      } catch (e) {
        console.error('Failed to reset editor value:', e);
      }
    },
  }), [editor]);

  // Initialize from markdown string on mount
  React.useEffect(() => {
    if (initialMarkdown) {
      try {
        const nodes = editor.getApi(MarkdownPlugin).markdown.deserialize(initialMarkdown);
        editor.tf.setValue(sanitizeNodes(nodes as unknown[]));
      } catch (e) {
        console.error('Failed to deserialize initial markdown:', e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className={cn(
          'relative isolate w-full min-w-0',
          variant === 'section'
            ? cn('rounded-md bg-background', !readOnly && 'border border-border')
            : cn('rounded-lg bg-background', !readOnly && 'border border-border shadow-sm'),
          className
        )}
      >

        <EditorErrorBoundary>
          <Plate
            editor={editor}
            readOnly={readOnly}
            onChange={({ value }) => {
              onChange?.(value);
            }}
          >
            {/* Sync discussions from backend when a documentId is provided */}
            {documentId && (
              <DiscussionSync
                documentId={documentId}
                sectionExecutionId={sectionExecutionId}
                onAfterDiscussionMutation={onAfterDiscussionMutation}
              />
            )}

            {/* Toolbar – use compact version for section variant */}
            {showToolbar && (
              variant === 'section' ? <SectionEditorToolbar actions={toolbarActions} topOffset={toolbarTopOffset} /> : <EditorToolbar />
            )}

            {/* Editor Area */}
            <EditorContainer className="overflow-y-auto">
              <Editor
                placeholder={t('placeholder')}
                variant={variant === 'section' ? 'section' : undefined}
              />
            </EditorContainer>

            {/* Floating toolbar – appears on text selection */}
            <FloatingToolbarButtons
              onCreateSectionFromSelection={onCreateSectionFromSelection}
              enableComments={enableComments}
              enableCreateSection={enableCreateSection}
            />
          </Plate>
        </EditorErrorBoundary>
      </div>
    </TooltipProvider>
  );
  }
);
