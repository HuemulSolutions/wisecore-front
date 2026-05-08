'use client';

import * as React from 'react';

import type {
  CodeDrawingType,
  TCodeDrawingElement,
  ViewMode,
} from '@platejs/code-drawing';
import {
  VIEW_MODE,
  DEFAULT_MIN_HEIGHT,
  CODE_DRAWING_TYPE_ARRAY,
  VIEW_MODE_ARRAY,
  renderCodeDrawing,
  RENDER_DEBOUNCE_DELAY,
  downloadImage,
  DOWNLOAD_FILENAME,
} from '@platejs/code-drawing';
import type { PlateElementProps } from 'platejs/react';
import {
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  useReadOnly,
  useSelected,
} from 'platejs/react';
import debounce from 'lodash/debounce.js';
import { Trash2, DownloadIcon, GripHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function useCodeDrawingElement({ element }: { element: TCodeDrawingElement }) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [image, setImage] = React.useState<string>('');

  const lastRequestRef = React.useRef(0);

  // Debounced render when code or type changes
  const debouncedRender = React.useMemo(
    () =>
      debounce(
        async (code: string | undefined, drawingType: string | undefined) => {
          lastRequestRef.current += 1;
          const requestId = lastRequestRef.current;

          if (!code?.trim() || !drawingType) {
            setImage('');
            setLoading(false);
            setError(null);
            return;
          }

          setLoading(true);
          setError(null);

          try {
            const imageData = await renderCodeDrawing(
              drawingType as CodeDrawingType,
              code
            );

            // Only update if this is still the latest request
            if (lastRequestRef.current === requestId) {
              setImage(imageData);
              setError(null);
            }
          } catch (err) {
            if (lastRequestRef.current === requestId) {
              setError(err instanceof Error ? err.message : 'Rendering failed');
              setImage('');
            }
          } finally {
            if (lastRequestRef.current === requestId) {
              setLoading(false);
            }
          }
        },
        RENDER_DEBOUNCE_DELAY
      ),
    []
  );

  React.useEffect(() => {
    debouncedRender(element.data?.code, element.data?.drawingType);

    return () => {
      debouncedRender.cancel();
    };
  }, [element.data?.code, element.data?.drawingType, debouncedRender]);

  const removeNode = () => {
    if (readOnly) return;

    const path = editor.api.findPath(element);
    if (path) {
      editor.tf.removeNodes({ at: path });
    }
  };

  return {
    loading,
    error,
    image,
    removeNode,
  };
}

export function CodeDrawingElement(
  props: PlateElementProps<TCodeDrawingElement>
) {
  const isMobile = useIsMobile();
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const selected = useSelected();
  const isFocusedLast = useFocusedLast();
  const element = useElement<TCodeDrawingElement>();
  const { removeNode, image, loading } = useCodeDrawingElement({ element });

  const handleDownload = React.useCallback(() => {
    if (!image) return;
    downloadImage(image, DOWNLOAD_FILENAME);
  }, [image]);

  const handleCodeChange = React.useCallback(
    (code: string) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(
          {
            data: {
              ...element.data,
              code,
            },
          },
          { at: path }
        );
      }
    },
    [editor, element]
  );

  const handleDrawingTypeChange = React.useCallback(
    (drawingType: CodeDrawingType) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(
          {
            data: {
              ...element.data,
              drawingType,
            },
          },
          { at: path }
        );
      }
    },
    [editor, element]
  );

  const handleDrawingModeChange = React.useCallback(
    (drawingMode: ViewMode) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(
          {
            data: {
              ...element.data,
              drawingMode,
            },
          },
          { at: path }
        );
      }
    },
    [editor, element]
  );

  const handleHeightChange = React.useCallback(
    (height: number) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(
          {
            data: {
              ...element.data,
              height,
            },
          },
          { at: path }
        );
      }
    },
    [editor, element]
  );

  const code = element.data?.code ?? '';
  const drawingType = element.data?.drawingType ?? 'Mermaid';
  const drawingMode = element.data?.drawingMode ?? 'Both';
  const height = (element.data as any)?.height as number | undefined;

  const selectionCollapsed = useEditorSelector(
    (editor) => !editor.api.isExpanded(),
    []
  );

  const open = isFocusedLast && !readOnly && selected && selectionCollapsed;

  const content = (
    <PlateElement {...props}>
      <div contentEditable={false}>
        <CodeDrawingPreview
          code={code}
          drawingType={drawingType}
          drawingMode={drawingMode}
          image={image}
          loading={loading}
          height={height}
          onCodeChange={handleCodeChange}
          onDrawingTypeChange={handleDrawingTypeChange}
          onDrawingModeChange={handleDrawingModeChange}
          onHeightChange={handleHeightChange}
          readOnly={readOnly}
          isMobile={isMobile}
        />
      </div>
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
          {image && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 hover:cursor-pointer"
              onClick={handleDownload}
              title="Export"
            >
              <DownloadIcon className="size-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="size-8 hover:cursor-pointer"
            onClick={removeNode}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CodeDrawingPreview({
  code,
  drawingType,
  drawingMode,
  image,
  loading,
  height,
  onCodeChange,
  onDrawingTypeChange,
  onDrawingModeChange,
  onHeightChange,
  readOnly = false,
  isMobile = false,
}: {
  code: string;
  drawingType: CodeDrawingType;
  drawingMode: ViewMode;
  image: string;
  loading: boolean;
  height?: number;
  onCodeChange: (code: string) => void;
  onDrawingTypeChange: (type: CodeDrawingType) => void;
  onDrawingModeChange: (mode: ViewMode) => void;
  onHeightChange: (height: number) => void;
  readOnly?: boolean;
  isMobile?: boolean;
}) {
  const viewMode = drawingMode;
  const showCode = viewMode === VIEW_MODE.Both || viewMode === VIEW_MODE.Code;
  const showBorder = viewMode === VIEW_MODE.Both;

  const handleCodeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onCodeChange(e.target.value);
    },
    [onCodeChange]
  );

  const toolbar = readOnly ? null : (
    <CodeDrawingToolbar
      drawingType={drawingType}
      viewMode={viewMode}
      readOnly={readOnly}
      isMobile={isMobile}
      onDrawingTypeChange={onDrawingTypeChange}
      onDrawingModeChange={onDrawingModeChange}
    />
  );

  // --- Resize handle state ---
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const startYRef = React.useRef(0);
  const startHeightRef = React.useRef(0);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (readOnly) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startYRef.current = e.clientY;
      startHeightRef.current =
        containerRef.current?.getBoundingClientRect().height ?? DEFAULT_MIN_HEIGHT;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [readOnly]
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return;
      const delta = e.clientY - startYRef.current;
      const newHeight = Math.max(DEFAULT_MIN_HEIGHT, startHeightRef.current + delta);
      if (containerRef.current) {
        containerRef.current.style.height = `${newHeight}px`;
      }
    },
    [isResizing]
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return;
      setIsResizing(false);
      const delta = e.clientY - startYRef.current;
      const newHeight = Math.max(DEFAULT_MIN_HEIGHT, startHeightRef.current + delta);
      onHeightChange(newHeight);
    },
    [isResizing, onHeightChange]
  );

  const resolvedHeight = height ?? undefined;

  return (
    <div className="relative my-4 w-full">
      <div
        ref={containerRef}
        className={`flex ${isMobile ? 'flex-col-reverse' : 'flex-col'} group w-full items-stretch border bg-muted/50 md:flex-row overflow-hidden`}
        style={{
          minHeight: `${DEFAULT_MIN_HEIGHT}px`,
          height: resolvedHeight ? `${resolvedHeight}px` : undefined,
        }}
      >
      {showCode && (
        <CodeDrawingTextarea
          code={code}
          viewMode={viewMode}
          readOnly={readOnly}
          isMobile={isMobile}
          showBorder={showBorder}
          onCodeChange={handleCodeChange}
          toolbar={viewMode === VIEW_MODE.Code ? toolbar : null}
        />
      )}

      {viewMode !== VIEW_MODE.Code && (
        <CodeDrawingPreviewArea
          image={image}
          loading={loading}
          code={code}
          viewMode={viewMode}
          readOnly={readOnly}
          isMobile={isMobile}
          showBorder={showBorder}
          toolbar={toolbar}
        />
      )}
      </div>

      {/* Bottom resize handle */}
      {!readOnly && (
        <div
          role="separator"
          aria-orientation="horizontal"
          className="flex h-3 w-full cursor-row-resize items-center justify-center rounded-b border border-t-0 bg-muted/30 hover:bg-muted/60 transition-colors select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <GripHorizontal className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function CodeDrawingToolbar({
  drawingType,
  viewMode,
  readOnly = false,
  isMobile = false,
  onDrawingTypeChange,
  onDrawingModeChange,
}: {
  drawingType: CodeDrawingType;
  viewMode: ViewMode;
  readOnly?: boolean;
  isMobile?: boolean;
  onDrawingTypeChange: (type: CodeDrawingType) => void;
  onDrawingModeChange: (mode: ViewMode) => void;
}) {
  const [toolbarVisible, setToolbarVisible] = React.useState(false);
  const [languageSelectOpen, setLanguageSelectOpen] = React.useState(false);
  const [viewModeSelectOpen, setViewModeSelectOpen] = React.useState(false);

  const opacityClass =
    isMobile || toolbarVisible || languageSelectOpen || viewModeSelectOpen
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100';

  const positionClass = isMobile
    ? 'flex items-center gap-2'
    : 'absolute right-2 z-10 flex items-center gap-2';

  return (
    <div
      role="toolbar"
      className={`${positionClass} transition-opacity ${opacityClass}`}
      onMouseEnter={() => setToolbarVisible(true)}
      onMouseLeave={() => {
        if (!languageSelectOpen && !viewModeSelectOpen) {
          setToolbarVisible(false);
        }
      }}
    >
      {!readOnly && (
        <Select
          value={drawingType}
          onValueChange={onDrawingTypeChange}
          open={languageSelectOpen}
          onOpenChange={setLanguageSelectOpen}
        >
          <SelectTrigger
            className={`h-8 w-[120px] border-0 bg-muted/50 text-xs shadow-none ${
              isMobile ? '' : 'transition-colors hover:bg-zinc-200'
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {CODE_DRAWING_TYPE_ARRAY.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!readOnly && (
        <Select
          value={viewMode}
          onValueChange={onDrawingModeChange}
          open={viewModeSelectOpen}
          onOpenChange={setViewModeSelectOpen}
        >
          <SelectTrigger
            className={`h-8 w-[80px] border-0 bg-muted/50 text-xs shadow-none ${
              isMobile ? '' : 'transition-colors hover:bg-zinc-200'
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {VIEW_MODE_ARRAY.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function CodeDrawingTextarea({
  code,
  viewMode,
  readOnly = false,
  isMobile = false,
  showBorder = false,
  onCodeChange,
  toolbar,
}: {
  code: string;
  viewMode: ViewMode;
  readOnly?: boolean;
  isMobile?: boolean;
  showBorder?: boolean;
  onCodeChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  toolbar?: React.ReactNode;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isCodeOnlyMode = viewMode === VIEW_MODE.Code;

  const [internalCode, setInternalCode] = React.useState(code);
  const lastExternalCodeRef = React.useRef(code);

  React.useEffect(() => {
    if (code !== lastExternalCodeRef.current) {
      lastExternalCodeRef.current = code;
      setInternalCode(code);
    }
  }, [code]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalCode(newValue);
      onCodeChange(e);
    },
    [onCodeChange]
  );

  return (
    <div
      className={`${
        isCodeOnlyMode ? 'w-full' : 'min-w-0 flex-1'
      } flex flex-col ${isCodeOnlyMode && !isMobile ? 'relative' : ''} ${
        showBorder && !isMobile ? 'border-r' : ''
      }`}
    >
      {toolbar && isCodeOnlyMode && (
        <div
          className={
            isMobile
              ? 'mt-2 mb-2 flex justify-end px-2'
              : 'absolute right-2 z-10 mt-2'
          }
        >
          {toolbar}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-md" style={{ minHeight: 0 }}>
        <pre
          className={
            'm-0 h-full overflow-auto p-8 pr-4 font-mono text-sm leading-[normal] [tab-size:2] print:break-inside-avoid'
          }
        >
          <code className="block h-full w-full">
            <textarea
              ref={textareaRef}
              value={internalCode}
              onChange={handleChange}
              readOnly={readOnly}
              className="m-0 h-full w-full resize-none overflow-auto border-0 bg-transparent p-0 font-mono text-sm outline-none"
              placeholder="Enter your code here..."
              spellCheck={false}
            />
          </code>
        </pre>
      </div>
    </div>
  );
}

function CodeDrawingPreviewArea({
  image,
  loading,
  code,
  viewMode,
  readOnly: _readOnly = false,
  isMobile = false,
  showBorder = false,
  toolbar,
}: {
  image: string;
  loading: boolean;
  code: string;
  viewMode: ViewMode;
  readOnly?: boolean;
  isMobile?: boolean;
  showBorder?: boolean;
  toolbar?: React.ReactNode;
}) {
  const showImage = viewMode === VIEW_MODE.Both || viewMode === VIEW_MODE.Image;

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col overflow-hidden ${isMobile ? '' : 'relative'} ${
        showBorder && isMobile ? 'border-b' : ''
      }`}
    >
      {toolbar && (
        <div
          className={
            isMobile
              ? 'mt-2 mb-2 flex justify-end px-2'
              : 'absolute right-2 z-10 mt-2'
          }
        >
          {toolbar}
        </div>
      )}

      {showImage ? (
        <div
          className={
            'flex flex-1 items-center justify-center rounded-md bg-muted/30 p-4 overflow-hidden'
          }
          style={{ minHeight: 0 }}
        >
          {loading && <div className="text-muted-foreground">Loading...</div>}
          {!loading && image && (
            <img
              src={image}
              alt="Code drawing"
              className="object-contain"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          )}
          {!loading && !image && (
            <div className="text-muted-foreground">
              {code.trim() ? 'Rendering...' : 'Preview will appear here'}
            </div>
          )}
        </div>
      ) : (
        <div className="pointer-events-none flex flex-1 items-center justify-center rounded-md border bg-muted/30 p-4 opacity-0">
          {/* Placeholder to maintain height */}
        </div>
      )}
    </div>
  );
}
