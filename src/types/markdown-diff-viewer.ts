export type DiffType = "eq" | "ins" | "del";
export type ViewMode = "split" | "unified" | "rendered";
export type RenderedSubMode = "split" | "unified";

export interface DiffEntry {
  type: DiffType;
  val: string;
}

export interface DiffEntryWithLine extends DiffEntry {
  n?: number;
}

export interface EmptyEntry {
  type: "empty";
}

export type SplitEntry = DiffEntryWithLine | EmptyEntry;

export interface UnifiedEntry extends DiffEntry {
  lo?: number;
  ln?: number;
  i: number;
}

export interface ModeOption {
  id: ViewMode;
  label: string;
}

export interface DiffLineProps {
  type: DiffType;
  val: string;
  lineOld?: number;
  lineNew?: number;
  unified?: boolean;
}

export interface SubToggleProps {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}

export interface SharedViewProps {
  oldLabel: string;
  newLabel: string;
}

export interface PanelProps {
  lines: SplitEntry[];
  label: string;
  dot: string;
  rawContent?: string;
}

export interface SplitViewProps extends SharedViewProps {
  diff: DiffEntry[];
  oldContent: string;
  newContent: string;
}

export interface UnifiedViewProps extends SharedViewProps {
  diff: DiffEntry[];
  oldContent: string;
  newContent: string;
}

export interface RenderedViewProps extends SharedViewProps {
  diff: DiffEntry[];
  oldContent: string;
  newContent: string;
  showRenderedDiffPanel: boolean;
  showRenderedSubToggle: boolean;
  /** Post-processes the rendered HTML right before it's injected. See MarkdownDiffViewerProps. */
  transformHtml?: (html: string) => string;
  copyOldContent?: string;
  copyNewContent?: string;
}

export interface RenderedDiffPanelProps {
  diffHtml: string;
  title: string;
  oldLabel: string;
  newLabel: string;
}

export interface PairedRow {
  kind: "paired";
  oldLine: string;
  newLine: string;
}

export interface SingleRow {
  kind: "eq" | "del" | "ins";
  line: string;
}

export type GroupedTableRow = PairedRow | SingleRow;

/** Textos del header y el toggle. Todos opcionales; sin overrides quedan los strings en español actuales. */
export interface MarkdownDiffViewerLabels {
  /** "Diferencias de versiones" */
  title?: string;
  /** Sufijo tras el conteo: "{count} " + unchanged, ej. "sin cambios". */
  unchanged?: string;
  split?: string;
  unified?: string;
  rendered?: string;
}

export interface MarkdownDiffViewerProps {
  oldContent?: string;
  newContent?: string;
  oldLabel?: string;
  newLabel?: string;
  /** Vista inicial. Default: "split" */
  defaultMode?: ViewMode;
  /** Muestra u oculta el selector de modo principal. Default: true */
  showModeToggle?: boolean;
  /** Modos ofrecidos por el toggle principal. Default: los tres (split/unified/rendered). */
  modes?: ViewMode[];
  /** Overrides de texto del header y el toggle. Default: los strings en español actuales. */
  labels?: MarkdownDiffViewerLabels;
  /**
   * En la vista Renderizada, muestra u oculta el panel superior de "Cambios renderizados".
   * - true  → se muestra el panel con el diff marcado.
   * - false → solo se muestran las versiones individuales.
   * Default: true
   */
  showRenderedDiffPanel?: boolean;
  /**
   * En la vista Renderizada, muestra u oculta la sección de versiones
   * individuales con su sub-toggle (Dividido / Unificado).
   * - true  → se muestran el switch y los paneles de versiones individuales.
   * - false → solo se muestra el panel de "Cambios renderizados".
   * Default: true
   */
  showRenderedSubToggle?: boolean;
  /**
   * Post-processes the HTML of the "rendered" mode right before it's injected
   * (both the top diff panel and the split/unified sub-modes). Used to swap
   * sentinels left in oldContent/newContent for real markup — e.g. media
   * references resolved by `useMediaRefDiff` — without the diff engine itself
   * knowing about them. Must be stable (useMemo/useCallback): its identity is a
   * dependency of the internal HTML memos. Only affects "rendered"; the plain
   * "split"/"unified" text modes render oldContent/newContent as-is.
   */
  transformHtml?: (html: string) => string;
  /**
   * Text the copy buttons copy, when it must differ from oldContent/newContent
   * (e.g. those were normalized with sentinels for transformHtml). Defaults to
   * oldContent/newContent.
   */
  copyOldContent?: string;
  copyNewContent?: string;
  className?: string;
}
