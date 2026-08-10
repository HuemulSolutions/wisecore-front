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
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { renderMermaidSvg } from '@/lib/mermaid-snapshot';
import type { TMermaidElement } from '@/types/mermaid-node';

import { Caption, CaptionButton, CaptionTextarea } from './caption';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

const RENDER_DEBOUNCE_DELAY = 500;
const MIN_EDIT_HEIGHT = 220;

/** Debounced Mermaid -> SVG preview, mirroring the code-drawing node's own renderer. */
function useMermaidPreview(code: string) {
  const [svg, setSvg] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const lastRequestRef = React.useRef(0);

  const debouncedRender = React.useMemo(
    () =>
      debounce(async (source: string) => {
        lastRequestRef.current += 1;
        const requestId = lastRequestRef.current;

        if (!source.trim()) {
          setSvg('');
          setError(null);
          return;
        }

        try {
          const rendered = await renderMermaidSvg(source);
          if (lastRequestRef.current === requestId) {
            setSvg(rendered);
            setError(null);
          }
        } catch (err) {
          if (lastRequestRef.current === requestId) {
            setSvg('');
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

  return { svg, error };
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
    const { svg, error } = useMermaidPreview(code);

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

    const content = (
      <PlateElement {...props} className="py-2.5">
        <div contentEditable={false}>
          <Resizable
            align="center"
            options={{ align: 'center', readOnly }}
          >
            <ResizeHandle
              className={mediaResizeHandleVariants({ direction: 'left' })}
              options={{ direction: 'left' }}
            />

            <div
              className="flex w-full flex-col overflow-hidden rounded-sm border bg-muted/50 md:flex-row"
              style={{ minHeight: readOnly ? undefined : MIN_EDIT_HEIGHT }}
            >
              {!readOnly && (
                <textarea
                  value={code}
                  onChange={handleCodeChange}
                  placeholder={t('mermaid.placeholder')}
                  spellCheck={false}
                  className="min-w-0 flex-1 resize-none border-b bg-transparent p-3 font-mono text-sm outline-none focus-visible:outline-none md:border-r md:border-b-0"
                  style={{ minHeight: MIN_EDIT_HEIGHT }}
                />
              )}

              <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto p-3 [&_svg]:max-w-full">
                {error ? (
                  <span className="text-sm text-destructive">
                    {t('mermaid.renderError')}
                  </span>
                ) : svg ? (
                  <div dangerouslySetInnerHTML={{ __html: svg }} />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t('mermaid.emptyPreview')}
                  </span>
                )}
              </div>
            </div>

            <ResizeHandle
              className={mediaResizeHandleVariants({ direction: 'right' })}
              options={{ direction: 'right' }}
            />
          </Resizable>

          <Caption style={{ width }} align="center">
            <CaptionTextarea
              readOnly={readOnly}
              placeholder={t('mermaid.captionPlaceholder')}
            />
          </Caption>
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
