import { useState, useMemo, type FC } from "react";

/**
 * MarkdownDiffViewer — componente reutilizable que muestra diferencias entre dos strings markdown.
 *
 * Props:
 *   oldContent      — contenido markdown original
 *   newContent      — contenido markdown nuevo
 *   oldLabel        — etiqueta para el panel antiguo     (default: "Versión anterior")
 *   newLabel        — etiqueta para el panel nuevo       (default: "Versión nueva")
 *   defaultMode     — vista inicial                      (default: "split")
 *   showModeToggle  — muestra/oculta el selector de modo (default: true)
 *   className       — clase adicional para el contenedor raíz
 */

/* ─── Types ─────────────────────────────────────────────────────── */

type DiffType = "eq" | "ins" | "del";
type ViewMode = "split" | "unified" | "rendered";
type RenderedSubMode = "split" | "unified";

interface DiffEntry {
  type: DiffType;
  val: string;
}

interface DiffEntryWithLine extends DiffEntry {
  n?: number;
}

interface EmptyEntry {
  type: "empty";
}

type SplitEntry = DiffEntryWithLine | EmptyEntry;

interface UnifiedEntry extends DiffEntry {
  lo?: number;
  ln?: number;
  i: number;
}

interface ModeOption {
  id: ViewMode;
  label: string;
}

/* ─── LCS diff engine ───────────────────────────────────────────── */

function computeDiff(oldText: string, newText: string): DiffEntry[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: DiffEntry[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: "eq", val: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "ins", val: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: "del", val: a[i - 1] });
      i--;
    }
  }

  return result;
}

/* ─── Markdown → HTML ───────────────────────────────────────────── */

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong class='font-medium'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`(.+?)`/g,
      "<code class='bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs font-mono'>$1</code>"
    );
}

function lineToHtml(line: string): string {
  if (/^### /.test(line))
    return `<h3 class='text-base font-medium mt-4 mb-1'>${inlineMarkdown(line.slice(4))}</h3>`;
  if (/^## /.test(line))
    return `<h2 class='text-lg font-medium mt-4 mb-1'>${inlineMarkdown(line.slice(3))}</h2>`;
  if (/^# /.test(line))
    return `<h1 class='text-xl font-medium mt-4 mb-2'>${inlineMarkdown(line.slice(2))}</h1>`;
  if (/^> /.test(line))
    return `<blockquote class='border-l-2 border-gray-300 pl-3 text-gray-500 dark:text-gray-400 my-1 text-sm'>${inlineMarkdown(line.slice(2))}</blockquote>`;
  if (/^\d+\. /.test(line))
    return `<li class='list-decimal ml-5 text-sm'>${inlineMarkdown(line.replace(/^\d+\. /, ""))}</li>`;
  if (/^- /.test(line))
    return `<li class='list-disc ml-5 text-sm'>${inlineMarkdown(line.slice(2))}</li>`;
  if (/^\|[-| ]+\|$/.test(line)) return "";
  if (/^\|/.test(line)) {
    const cells = line.split("|").slice(1, -1);
    const tds = cells
      .map(
        (c) =>
          `<td class='border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs'>${inlineMarkdown(c.trim())}</td>`
      )
      .join("");
    return `<tr>${tds}</tr>`;
  }
  if (line.trim() === "") return "";
  return `<p class='text-sm my-1'>${inlineMarkdown(line)}</p>`;
}

function buildRenderedDiffHtml(diff: DiffEntry[]): string {
  const parts: string[] = [];
  let tableBuffer: { type: DiffType; line: string }[] = [];

  function flushTable() {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .filter((r) => !/^\|[-| ]+\|$/.test(r.line))
      .map((r) => {
        const cells = r.line.split("|").slice(1, -1);
        const tds = cells
          .map(
            (c) =>
              `<td class='border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs'>${inlineMarkdown(c.trim())}</td>`
          )
          .join("");
        const rowStyle =
          r.type === "del"
            ? "style='background:rgba(220,38,38,0.08);text-decoration:line-through;color:#991b1b;'"
            : r.type === "ins"
            ? "style='background:rgba(34,197,94,0.1);color:#166534;'"
            : "";
        return `<tr ${rowStyle}>${tds}</tr>`;
      });
    parts.push(
      `<table class='w-full border-collapse my-2 text-xs'><tbody>${rows.join("")}</tbody></table>`
    );
    tableBuffer = [];
  }

  for (const entry of diff) {
    const { type, val } = entry;
    const isTableRow = /^\|/.test(val);

    if (isTableRow) {
      tableBuffer.push({ type, line: val });
      continue;
    }

    flushTable();

    if (val.trim() === "") {
      parts.push("<br/>");
      continue;
    }

    const inner = lineToHtml(val);
    if (!inner) continue;

    if (type === "eq") {
      parts.push(inner);
    } else if (type === "del") {
      parts.push(
        `<div style='background:rgba(220,38,38,0.08);border-left:3px solid #ef4444;padding-left:6px;margin:2px 0;'>` +
          `<span style='text-decoration:line-through;color:#991b1b;opacity:0.85;'>${inner}</span>` +
          `</div>`
      );
    } else {
      parts.push(
        `<div style='background:rgba(34,197,94,0.1);border-left:3px solid #22c55e;padding-left:6px;margin:2px 0;'>` +
          `<span style='color:#166534;'>${inner}</span>` +
          `</div>`
      );
    }
  }

  flushTable();
  return parts.join("\n");
}
/**
 * Construye HTML de diff para un solo lado (panel dividido de la vista renderizada).
 * side="old" → muestra líneas sin cambio + eliminadas (tachadas en rojo).
 * side="new" → muestra líneas sin cambio + añadidas (resaltadas en verde).
 */
function buildSideDiffHtml(diff: DiffEntry[], side: "old" | "new"): string {
  const keep: DiffType[] = side === "old" ? ["eq", "del"] : ["eq", "ins"];
  const parts: string[] = [];
  let tableBuffer: { type: DiffType; line: string }[] = [];

  function flushTable() {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .filter((r) => !/^\|[-| ]+\|$/.test(r.line) && keep.includes(r.type))
      .map((r) => {
        const cells = r.line.split("|").slice(1, -1);
        const tds = cells
          .map(
            (c) =>
              `<td class='border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs'>${inlineMarkdown(c.trim())}</td>`
          )
          .join("");
        const rowStyle =
          r.type === "del"
            ? "style='background:rgba(220,38,38,0.08);text-decoration:line-through;color:#991b1b;'"
            : r.type === "ins"
            ? "style='background:rgba(34,197,94,0.1);color:#166534;'"
            : "";
        return `<tr ${rowStyle}>${tds}</tr>`;
      });
    if (rows.length > 0)
      parts.push(
        `<table class='w-full border-collapse my-2 text-xs'><tbody>${rows.join("")}</tbody></table>`
      );
    tableBuffer = [];
  }

  for (const entry of diff) {
    const { type, val } = entry;

    if (/^\|/.test(val)) {
      tableBuffer.push({ type, line: val });
      continue;
    }

    flushTable();

    if (!keep.includes(type)) continue;

    if (val.trim() === "") {
      parts.push("<br/>");
      continue;
    }

    const inner = lineToHtml(val);
    if (!inner) continue;

    if (type === "eq") {
      parts.push(inner);
    } else if (type === "del") {
      parts.push(
        `<div style='background:rgba(220,38,38,0.08);border-left:3px solid #ef4444;padding-left:6px;margin:2px 0;'>` +
          `<span style='text-decoration:line-through;color:#991b1b;opacity:0.85;'>${inner}</span>` +
          `</div>`
      );
    } else {
      parts.push(
        `<div style='background:rgba(34,197,94,0.1);border-left:3px solid #22c55e;padding-left:6px;margin:2px 0;'>` +
          `<span style='color:#166534;'>${inner}</span>` +
          `</div>`
      );
    }
  }

  flushTable();
  return parts.join("\n");
}

/* ─── Sub-componentes base ──────────────────────────────────────── */

interface LineNumberProps {
  n?: number;
}

const LineNumber: FC<LineNumberProps> = ({ n }) => (
  <span className="select-none w-8 flex-shrink-0 text-right pr-2 text-xs text-gray-400 tabular-nums">
    {n ?? ""}
  </span>
);

interface DiffLineProps {
  type: DiffType;
  val: string;
  lineOld?: number;
  lineNew?: number;
  unified?: boolean;
}

const DiffLine: FC<DiffLineProps> = ({
  type,
  val,
  lineOld,
  lineNew,
  unified = false,
}) => {
  const base = "flex font-mono text-xs leading-6";

  const colors: Record<DiffType, string> = {
    ins: "bg-green-50 dark:bg-green-950",
    del: "bg-red-50 dark:bg-red-950",
    eq: "",
  };

  const textColors: Record<DiffType, string> = {
    ins: "text-green-800 dark:text-green-200",
    del: "text-red-800 dark:text-red-200",
    eq: "text-gray-800 dark:text-gray-200",
  };

  const prefix = type === "ins" ? "+" : type === "del" ? "−" : " ";

  return (
    <div className={`${base} ${colors[type]}`}>
      {unified ? (
        <>
          <span className="select-none w-5 flex-shrink-0 text-center text-xs text-gray-400">
            {prefix}
          </span>
          <LineNumber n={type !== "ins" ? lineOld : undefined} />
          <LineNumber n={type !== "del" ? lineNew : undefined} />
        </>
      ) : (
        <LineNumber n={lineOld ?? lineNew} />
      )}
      <span className={`flex-1 whitespace-pre-wrap break-all px-1 ${textColors[type]}`}>
        {val}
      </span>
    </div>
  );
};

/* ─── Sub-toggle reutilizable ───────────────────────────────────── */

interface SubToggleProps {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}

const SubToggle: FC<SubToggleProps> = ({ value, options, onChange }) => (
  <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-xs">
    {options.map(({ id, label }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`px-3 py-1 transition-colors ${
          value === id
            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

/* ─── Vistas de código ──────────────────────────────────────────── */

interface SharedViewProps {
  oldLabel: string;
  newLabel: string;
}

interface PanelProps {
  lines: SplitEntry[];
  label: string;
  dot: string;
}

const Panel: FC<PanelProps> = ({ lines, label, dot }) => (
  <div className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
    </div>
    <div className="p-2 overflow-x-auto">
      {lines.map((l, i) =>
        l.type === "empty" ? (
          <div key={i} className="h-6" />
        ) : (
          <DiffLine
            key={i}
            type={(l as DiffEntryWithLine).type}
            val={(l as DiffEntryWithLine).val!}
            lineOld={(l as DiffEntryWithLine).n}
          />
        )
      )}
    </div>
  </div>
);

interface SplitViewProps extends SharedViewProps {
  diff: DiffEntry[];
}

const SplitView: FC<SplitViewProps> = ({ diff, oldLabel, newLabel }) => {
  const oldLines: SplitEntry[] = [];
  const newLines: SplitEntry[] = [];
  let oN = 1;
  let nN = 1;

  diff.forEach((d) => {
    if (d.type === "eq") {
      oldLines.push({ ...d, n: oN++ });
      newLines.push({ ...d, n: nN++ });
    } else if (d.type === "del") {
      oldLines.push({ ...d, n: oN++ });
      newLines.push({ type: "empty" });
    } else {
      oldLines.push({ type: "empty" });
      newLines.push({ ...d, n: nN++ });
    }
  });

  return (
    <div className="flex gap-3">
      <Panel lines={oldLines} label={oldLabel} dot="bg-red-400" />
      <Panel lines={newLines} label={newLabel} dot="bg-green-500" />
    </div>
  );
};

interface UnifiedViewProps extends SharedViewProps {
  diff: DiffEntry[];
}

const UnifiedView: FC<UnifiedViewProps> = ({ diff, oldLabel, newLabel }) => {
  let oN = 1;
  let nN = 1;

  const lines: UnifiedEntry[] = diff.map((d, i) => {
    if (d.type === "eq") return { ...d, lo: oN++, ln: nN++, i };
    if (d.type === "del") return { ...d, lo: oN++, i };
    return { ...d, ln: nN++, i };
  });

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{oldLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{newLabel}</span>
        </div>
      </div>
      <div className="p-2 overflow-x-auto">
        {lines.map((l) => (
          <DiffLine
            key={l.i}
            type={l.type}
            val={l.val}
            lineOld={l.lo}
            lineNew={l.ln}
            unified
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Vista renderizada ─────────────────────────────────────────── */

interface RenderedViewProps extends SharedViewProps {
  diff: DiffEntry[];
  oldContent: string;
  newContent: string;
  showRenderedDiffPanel: boolean;
  showRenderedSubToggle: boolean;
}
const RENDERED_SUB_OPTIONS = [
  { id: "split", label: "Dividido" },
  { id: "unified", label: "Unificado" },
];

/** Leyenda de colores reutilizable para la cabecera del panel renderizado */
const DiffLegend: FC<{ oldLabel: string; newLabel: string }> = ({ oldLabel, newLabel }) => (
  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block w-4 h-3"
        style={{ background: "rgba(220,38,38,0.1)", borderLeft: "3px solid #ef4444" }}
      />
      {oldLabel}
    </span>
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block w-4 h-3"
        style={{ background: "rgba(34,197,94,0.12)", borderLeft: "3px solid #22c55e" }}
      />
      {newLabel}
    </span>
  </div>
);

/** Panel de diff renderizado (usado tanto en el panel principal como en el sub-modo unificado) */
const RenderedDiffPanel: FC<{
  diffHtml: string;
  title: string;
  oldLabel: string;
  newLabel: string;
}> = ({ diffHtml, title, oldLabel, newLabel }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</span>
      <DiffLegend oldLabel={oldLabel} newLabel={newLabel} />
    </div>
    <div
      className="p-4 text-gray-800 dark:text-gray-200"
      dangerouslySetInnerHTML={{ __html: diffHtml }}
    />
  </div>
);

const RenderedView: FC<RenderedViewProps> = ({
  diff,
  oldLabel,
  newLabel,
  showRenderedDiffPanel,
  showRenderedSubToggle,
}) => {
  const [subMode, setSubMode] = useState<RenderedSubMode>("split");
  const diffHtml = useMemo(() => buildRenderedDiffHtml(diff), [diff]);


  return (
    <div className="flex flex-col gap-3">
      {/* Panel de cambios renderizados: ocultable con showRenderedDiffPanel={false} */}
      {showRenderedDiffPanel && (
        <RenderedDiffPanel
          diffHtml={diffHtml}
          title="Cambios renderizados"
          oldLabel={oldLabel}
          newLabel={newLabel}
        />
      )}

      {/* Sección inferior: solo se muestra si showRenderedSubToggle={true} */}
      {showRenderedSubToggle && (
        <>
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Versiones individuales
            </span>
            <SubToggle
              value={subMode}
              options={RENDERED_SUB_OPTIONS}
              onChange={(id) => setSubMode(id as RenderedSubMode)}
            />
          </div>

          {/* Sub-modo dividido: cada panel muestra su lado del diff con marcas de color */}
          {subMode === "split" && (
            <div className="flex gap-3">
              {(["old", "new"] as const).map((side) => {
                const label = side === "old" ? oldLabel : newLabel;
                const dot   = side === "old" ? "bg-red-400" : "bg-green-500";
                const html  = buildSideDiffHtml(diff, side);
                return (
                  <div
                    key={side}
                    className="flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {label}
                      </span>
                    </div>
                    <div
                      className="p-4 text-gray-800 dark:text-gray-200"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Sub-modo unificado: diff renderizado (igual al panel principal) */}
          {subMode === "unified" && (
            <RenderedDiffPanel
              diffHtml={diffHtml}
              title="Cambios unificados"
              oldLabel={oldLabel}
              newLabel={newLabel}
            />
          )}
        </>
      )}
    </div>
  );
};

/* ─── Componente principal ──────────────────────────────────────── */

const MODES: ModeOption[] = [
  { id: "split", label: "Dividido" },
  { id: "unified", label: "Unificado" },
  { id: "rendered", label: "Renderizado" },
];

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

const MarkdownDiffViewer: FC<MarkdownDiffViewerProps> = ({
  oldContent = "",
  newContent = "",
  oldLabel = "Versión anterior",
  newLabel = "Versión nueva",
  defaultMode = "split",
  showModeToggle = true,
  showRenderedDiffPanel = true,
  showRenderedSubToggle = true,
  className = "",
}) => {
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  const diff = useMemo(
    () => computeDiff(oldContent, newContent),
    [oldContent, newContent]
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    diff.forEach((d) => {
      if (d.type === "ins") added++;
      else if (d.type === "del") removed++;
      else unchanged++;
    });
    return { added, removed, unchanged };
  }, [diff]);

  return (
    <div className={`font-sans ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Diferencias de versiones
        </span>

        {/* Stats */}
        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-green-500" />
            +{stats.added} añadidas
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-red-400" />
            -{stats.removed} eliminadas
          </span>
          <span>{stats.unchanged} sin cambios</span>
        </div>

        {/* Toggle principal — se oculta con showModeToggle={false} */}
        {showModeToggle && (
          <div className="ml-auto flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-xs">
            {MODES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`px-3 py-1.5 transition-colors ${
                  mode === id
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                    : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {mode === "split" && (
        <SplitView diff={diff} oldLabel={oldLabel} newLabel={newLabel} />
      )}
      {mode === "unified" && (
        <UnifiedView diff={diff} oldLabel={oldLabel} newLabel={newLabel} />
      )}
      {mode === "rendered" && (
        <RenderedView
          diff={diff}
          oldContent={oldContent}
          newContent={newContent}
          oldLabel={oldLabel}
          newLabel={newLabel}
          showRenderedDiffPanel={showRenderedDiffPanel}
          showRenderedSubToggle={showRenderedSubToggle}
        />
      )}
    </div>
  );
};

export default MarkdownDiffViewer;
