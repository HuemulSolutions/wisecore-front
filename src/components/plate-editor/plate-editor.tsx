'use client';

import * as React from 'react';
import type { Value } from 'platejs';

import { normalizeNodeId } from 'platejs';
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

import { Editor, EditorContainer } from '@/components/ui/editor';
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

import { FontSizePlugin, FontColorPlugin, FontBackgroundColorPlugin } from '@platejs/basic-styles/react';
import { cn } from '@/lib/utils';

const initialValue: Value = normalizeNodeId([
  {
    children: [{ text: 'Welcome to the Plate Editor' }],
    type: 'h1',
  },
  {
    children: [{ text: 'Getting Started' }],
    type: 'h2',
  },
  {
    children: [
      { text: 'This is a ' },
      { bold: true, text: 'rich text editor' },
      { text: ' with full formatting support. Try using the toolbar above or keyboard shortcuts to format your content.' },
    ],
    type: 'p',
  },
  {
    children: [{ text: 'Features include bold, italic, underline, strikethrough, code, highlight, and more.' }],
    type: 'blockquote',
  },
  {
    children: [
      { text: 'Start typing here to create your document...' },
    ],
    type: 'p',
  },
]);

function EditorToolbar() {
  const editor = useEditorRef();
  const [readOnly] = usePlateState('readOnly');
  const isSuggesting = usePluginOption(SuggestionPlugin, 'isSuggesting');

  const canUndo = useEditorSelector((editor) => (editor.history?.undos?.length ?? 0) > 0, []);
  const canRedo = useEditorSelector((editor) => (editor.history?.redos?.length ?? 0) > 0, []);

  const isEditing = !readOnly && !isSuggesting;
  const isViewing = readOnly;

  return (
    <FixedToolbar className="flex items-center gap-0.5 px-1 py-1">
      {/* Undo / Redo */}
      {isEditing && (
        <>
          <ToolbarButton
            tooltip="Undo (Ctrl+Z)"
            onClick={() => editor.undo()}
            disabled={!canUndo}
          >
            <Undo2 />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Redo (Ctrl+Y)"
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
          <MarkToolbarButton nodeType="bold" tooltip="Bold (Ctrl+B)">
            <Bold />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="Italic (Ctrl+I)">
            <Italic />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="Underline (Ctrl+U)">
            <Underline />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="strikethrough" tooltip="Strikethrough (Ctrl+Shift+X)">
            <Strikethrough />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="code" tooltip="Code (Ctrl+E)">
            <Code />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="highlight" tooltip="Highlight (Ctrl+Shift+H)">
            <Highlighter />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="superscript" tooltip="Superscript (Ctrl+.)">
            <Superscript />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="subscript" tooltip="Subscript (Ctrl+,)">
            <Subscript />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="kbd" tooltip="Keyboard">
            <Keyboard />
          </MarkToolbarButton>

          <ToolbarSeparator />
        </>
      )}

      {/* Font size & color */}
      {isEditing && (
        <>
          <FontSizeToolbarButton />
          <FontColorToolbarButton nodeType="color" tooltip="Text Color" />
          <FontColorToolbarButton nodeType="backgroundColor" tooltip="Background Color" />

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
          <MarkToolbarButton nodeType="highlight" tooltip="Highlight (Ctrl+Shift+H)">
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

      {/* Spacer */}
      <div className="shrink-0" />
    </FixedToolbar>
  );
}

interface PlateRichEditorProps {
  /** Additional CSS class names */
  className?: string;
  /** Initial editor value */
  value?: Value;
  /** Callback when editor value changes */
  onChange?: (value: Value) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

export function PlateRichEditor({
  className,
  value: externalValue,
  onChange,
  readOnly = false,
}: PlateRichEditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

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
      FontSizePlugin,
      FontColorPlugin,
      FontBackgroundColorPlugin,
    ],
    value: externalValue ?? initialValue,
  });

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className={cn(
          'rounded-lg border border-border bg-background shadow-sm',
          'relative w-full',
          className
        )}
      >

        <Plate
          editor={editor}
          readOnly={readOnly}
          onChange={({ value }) => {
            onChange?.(value);
          }}
        >
          {/* Toolbar */}
          <EditorToolbar />

          {/* Editor Area */}
          <EditorContainer className="overflow-y-auto">
            <Editor placeholder="Type your content here..." />
          </EditorContainer>
        </Plate>
      </div>
    </TooltipProvider>
  );
}
