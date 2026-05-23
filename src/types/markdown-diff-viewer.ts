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
}

export interface SplitViewProps extends SharedViewProps {
  diff: DiffEntry[];
}

export interface UnifiedViewProps extends SharedViewProps {
  diff: DiffEntry[];
}

export interface RenderedViewProps extends SharedViewProps {
  diff: DiffEntry[];
  oldContent: string;
  newContent: string;
  showRenderedDiffPanel: boolean;
  showRenderedSubToggle: boolean;
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

export interface MarkdownDiffViewerProps {
  oldContent?: string;
  newContent?: string;
  oldLabel?: string;
  newLabel?: string;
  /** Vista inicial. Default: "split" */
  defaultMode?: ViewMode;
  /** Muestra u oculta el selector de modo principal. Default: true */
  showModeToggle?: boolean;
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
  className?: string;
}
