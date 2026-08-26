'use client';

import * as React from 'react';

import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import type { PlateElementProps } from 'platejs/react';
import {
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  useReadOnly,
  useSelected,
  withHOC,
} from 'platejs/react';
import debounce from 'lodash/debounce.js';
import { Code2, Expand, Eye, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { renderMermaidSvg } from '@/lib/mermaid-snapshot';
import { normalizeMermaidSvgForDisplay } from '@/lib/mermaid-svg-utils';
import { resolveResizableAlign } from '@/lib/plate-node-align-utils';
import type { TMermaidElement } from '@/types/mermaid-node';

import { Caption, CaptionButton, CaptionTextarea } from './caption';
import { DiagramFullscreenDialog } from './diagram-fullscreen-dialog';
import { NodeAlignButtons } from './node-align-buttons';
import { NodeSizeMenu } from './node-size-menu';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

const RENDER_DEBOUNCE_DELAY = 500;
const MIN_EDIT_HEIGHT = 220;

type ViewMode = 'code' | 'view';

/**
 * Debounced Mermaid -> SVG preview, normalized so the container width actually
 * controls the rendered size. Mermaid's raw output caps itself at its own natural
 * pixel size via an inline `max-width` (see normalizeMermaidSvgForDisplay) – without
 * stripping that, no amount of resizing the node changes anything visually.
 */
function useMermaidPreview(code: string) {
  const [svg, setSvg] = React.useState('');
  const [intrinsicWidth, setIntrinsicWidth] = React.useState<number>();
  const [error, setError] = React.useState<string | null>(null);
  const lastRequestRef = React.useRef(0);

  const debouncedRender = React.useMemo(
    () =>
      debounce(async (source: string) => {
        lastRequestRef.current += 1;
        const requestId = lastRequestRef.current;

        if (!source.trim()) {
          setSvg('');
          setIntrinsicWidth(undefined);
          setError(null);
          return;
        }

        try {
          const rendered = await renderMermaidSvg(source);
          if (lastRequestRef.current === requestId) {
            const normalized = normalizeMermaidSvgForDisplay(rendered);
            setSvg(normalized.svg);
            setIntrinsicWidth(normalized.intrinsicWidth);
            setError(null);
          }
        } catch (err) {
          if (lastRequestRef.current === requestId) {
            setSvg('');
            setIntrinsicWidth(undefined);
            setError(err instanceof Error ? err.message : 'Rendering failed');
          }
        }
      }, RENDER_DEBOUNCE_DELAY),
    []
  );

  React.useEffect(() => {
    debouncedRender(code);
    return () => debouncedRender.cancel();
  }, [code, debouncedRender]);

  return { svg, intrinsicWidth, error };
}

export const MermaidElement = withHOC(
  ResizableProvider,
  function MermaidElement(props: PlateElementProps<TMermaidElement>) {
    const editor = useEditorRef();
    const readOnly = useReadOnly();
    const selected = useSelected();
    const isFocusedLast = useFocusedLast();
    const element = useElement<TMermaidElement>();
    const { t } = useTranslation('editor');
    const width = useResizableValue('width');

    const code = element.code ?? '';
    const { svg, intrinsicWidth, error } = useMermaidPreview(code);
    const align = resolveResizableAlign(element.align);

    // Local, per-instance – a reader always sees "Vista"; this is only a working
    // preference for whoever is editing, never persisted on the node.
    const [viewMode, setViewMode] = React.useState<ViewMode>(
      code.trim() ? 'view' : 'code'
    );
    const [fullscreenOpen, setFullscreenOpen] = React.useState(false);
    const showCode = !readOnly && viewMode === 'code';

    const handleCodeChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const path = editor.api.findPath(element);
        if (path) {
          editor.tf.setNodes({ code: e.target.value }, { at: path });
        }
      },
      [editor, element]
    );

    const removeNode = React.useCallback(() => {
      if (readOnly) return;
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.removeNodes({ at: path });
      }
    }, [editor, element, readOnly]);

    const selectionCollapsed = useEditorSelector(
      (editor) => !editor.api.isExpanded(),
      []
    );
    const open = isFocusedLast && !readOnly && selected && selectionCollapsed;

    const diagramBody = error ? (
      <span className="text-sm text-destructive">{t('mermaid.renderError')}</span>
    ) : svg ? (
      <div className="w-full" dangerouslySetInnerHTML={{ __html: svg }} />
    ) : (
      <span className="text-sm text-muted-foreground">
        {t('mermaid.emptyPreview')}
      </span>
    );

    // "Vista": the diagram alone, at its real element.width/align – exactly what a
    // reader sees. This is the only place the resize handles live, so what gets
    // dragged here is what gets rendered everywhere else (WYSIWYG).
    const viewBlock = (
      <Resizable align={align} options={{ align, readOnly, minWidth: 160 }}>
        <ResizeHandle
          className={mediaResizeHandleVariants({ direction: 'left' })}
          options={{ direction: 'left' }}
        />
        <div className="group/diagram relative flex min-w-0 items-center justify-center overflow-auto [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none!">
          {diagramBody}
          {!!svg && !error && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-1 right-1 size-7 opacity-0 shadow-sm transition-opacity group-hover/diagram:opacity-100 hover:cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenOpen(true);
              }}
              title={t('fullscreen.open')}
            >
              <Expand className="size-3.5" />
            </Button>
          )}
        </div>
        <ResizeHandle
          className={mediaResizeHandleVariants({ direction: 'right' })}
          options={{ direction: 'right' }}
        />
      </Resizable>
    );

    // "Código": working split view, code | fitted preview. This preview's width
    // just fills its column – it's never element.width, so it can't be mistaken for
    // the size control (that's what dragging in Vista does).
    const codeBlock = (
      <div
        className="flex w-full flex-col overflow-hidden rounded-sm border bg-muted/50 md:flex-row"
        style={{ minHeight: MIN_EDIT_HEIGHT }}
      >
        <textarea
          value={code}
          onChange={handleCodeChange}
          placeholder={t('mermaid.placeholder')}
          spellCheck={false}
          className="min-w-0 flex-1 resize-none border-b bg-transparent p-3 font-mono text-sm outline-none focus-visible:outline-none md:border-r md:border-b-0"
          style={{ minHeight: MIN_EDIT_HEIGHT }}
        />
        <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto p-3 [&_svg]:max-h-full [&_svg]:max-w-full">
          {diagramBody}
        </div>
      </div>
    );

    const content = (
      <PlateElement {...props} className="py-2.5">
        <div contentEditable={false}>
          {showCode ? codeBlock : viewBlock}

          <Caption style={{ width: showCode ? undefined : width }} align={align}>
            <CaptionTextarea
              readOnly={readOnly}
              placeholder={t('mermaid.captionPlaceholder')}
            />
          </Caption>

          <DiagramFullscreenDialog
            open={fullscreenOpen}
            onOpenChange={setFullscreenOpen}
            svg={svg || undefined}
          />
        </div>

        {props.children}
      </PlateElement>
    );

    if (readOnly) {
      return content;
    }

    return (
      <Popover open={open} modal={false}>
        <PopoverAnchor asChild>{content}</PopoverAnchor>
        <PopoverContent
          className="w-auto p-1"
          contentEditable={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
              <Button
                size="sm"
                variant={viewMode === 'code' ? 'secondary' : 'ghost'}
                className="h-7 gap-1 px-2 text-xs hover:cursor-pointer"
                onClick={() => setViewMode('code')}
              >
                <Code2 className="size-3.5" />
                {t('mermaid.viewMode.code')}
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'view' ? 'secondary' : 'ghost'}
                className="h-7 gap-1 px-2 text-xs hover:cursor-pointer"
                onClick={() => setViewMode('view')}
              >
                <Eye className="size-3.5" />
                {t('mermaid.viewMode.view')}
              </Button>
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />
            <NodeAlignButtons element={element} />
            <NodeSizeMenu element={element} intrinsicWidth={intrinsicWidth} />
            <Button
              size="icon"
              variant="ghost"
              className="size-8 hover:cursor-pointer"
              onClick={() => setFullscreenOpen(true)}
              title={t('fullscreen.open')}
              disabled={!svg}
            >
              <Expand className="size-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />
            <CaptionButton size="sm" variant="ghost">
              {t('link.caption')}
            </CaptionButton>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 hover:cursor-pointer"
              onClick={removeNode}
              title={t('mermaid.delete')}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
