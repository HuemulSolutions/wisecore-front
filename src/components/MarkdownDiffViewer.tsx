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

/* ─── Word-level inline diff helpers ────────────────────────────── */

/**
 * Splits text into tokens preserving whitespace as separate tokens so that
 * word-level diff is accurate even with varied spacing.
 */
function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [];
}

/**
 * LCS-based word diff between two plain-text strings.
 * Returns an array of { type, val } for each word token.
 */
function computeWordDiff(
  oldText: string,
  newText: string
): DiffEntry[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
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

/**
 * Extracts the markdown "prefix" from a line (e.g. "## ", "- ", "> ")
 * and the remaining body text.
 */
function splitLinePrefix(line: string): [string, string] {
  const match = line.match(/^(#{1,6}\s|>\s|- |\d+\.\s)/);
  if (match) return [match[0], line.slice(match[0].length)];
  return ["", line];
}

/**
 * Check whether two lines have the same markdown prefix type
 * (both paragraphs, both same-level headings, etc.)
 */
function isSameLineType(oldLine: string, newLine: string): boolean {
  const [pOld] = splitLinePrefix(oldLine);
  const [pNew] = splitLinePrefix(newLine);
  return pOld === pNew;
}

/**
 * Groups consecutive word-diff tokens of the same type so that
 * inlineMarkdown is applied to complete text segments rather than
 * individual tokens — this prevents splitting markdown syntax
 * (e.g. **bold**) across tokens and rendering raw markers.
 */
function groupWordDiff(wdiff: DiffEntry[]): { type: DiffType; text: string }[] {
  const groups: { type: DiffType; text: string }[] = [];
  for (const w of wdiff) {
    const last = groups[groups.length - 1];
    if (last && last.type === w.type) {
      last.text += w.val;
    } else {
      groups.push({ type: w.type, text: w.val });
    }
  }
  return groups;
}

/**
 * Renders a word-level inline diff as HTML for the unified rendered view.
 * Unchanged words render normally; deleted words are struck-through red,
 * inserted words are highlighted green.
 */
function renderWordDiffUnified(oldLine: string, newLine: string): string {
  const [, oldBody] = splitLinePrefix(oldLine);
  const [, newBody] = splitLinePrefix(newLine);
  const wdiff = computeWordDiff(oldBody, newBody);
  const groups = groupWordDiff(wdiff);

  const html = groups
    .map((g) => {
      if (g.type === "eq") return inlineMarkdown(g.text);
      if (g.type === "del")
        return `<span style='text-decoration:line-through;color:#991b1b;background:rgba(220,38,38,0.08);border-radius:2px;padding:0 1px;'>${inlineMarkdown(g.text)}</span>`;
      return `<span style='color:#166534;background:rgba(34,197,94,0.1);border-radius:2px;padding:0 1px;font-weight:500;'>${inlineMarkdown(g.text)}</span>`;
    })
    .join("");

  if (/^### /.test(oldLine)) return `<h3 class='text-base font-medium mt-4 mb-1'>${html}</h3>`;
  if (/^## /.test(oldLine)) return `<h2 class='text-lg font-medium mt-4 mb-1'>${html}</h2>`;
  if (/^# /.test(oldLine)) return `<h1 class='text-xl font-medium mt-4 mb-2'>${html}</h1>`;
  if (/^> /.test(oldLine))
    return `<blockquote class='border-l-2 border-gray-300 pl-3 text-gray-500 dark:text-gray-400 my-1 text-sm'>${html}</blockquote>`;
  if (/^\d+\. /.test(oldLine)) return `<li class='list-decimal ml-5 text-sm'>${html}</li>`;
  if (/^- /.test(oldLine)) return `<li class='list-disc ml-5 text-sm'>${html}</li>`;
  return `<p class='text-sm my-1'>${html}</p>`;
}

/**
 * Renders a word-level diff showing only one side (old or new) with its changes highlighted.
 */
function renderWordDiffSide(oldLine: string, newLine: string, side: "old" | "new"): string {
  const [, oldBody] = splitLinePrefix(oldLine);
  const [, newBody] = splitLinePrefix(newLine);
  const wdiff = computeWordDiff(oldBody, newBody);
  const ref = side === "old" ? oldLine : newLine;

  // Filter to keep only the relevant side's tokens, then group
  const filtered = wdiff.filter((w) => {
    if (w.type === "eq") return true;
    if (side === "old") return w.type === "del";
    return w.type === "ins";
  });
  const groups = groupWordDiff(filtered);

  const html = groups
    .map((g) => {
      if (g.type === "eq") return inlineMarkdown(g.text);
      if (g.type === "del")
        return `<span style='text-decoration:line-through;color:#991b1b;background:rgba(220,38,38,0.08);border-radius:2px;padding:0 1px;'>${inlineMarkdown(g.text)}</span>`;
      return `<span style='color:#166534;background:rgba(34,197,94,0.1);border-radius:2px;padding:0 1px;font-weight:500;'>${inlineMarkdown(g.text)}</span>`;
    })
    .join("");

  if (/^### /.test(ref)) return `<h3 class='text-base font-medium mt-4 mb-1'>${html}</h3>`;
  if (/^## /.test(ref)) return `<h2 class='text-lg font-medium mt-4 mb-1'>${html}</h2>`;
  if (/^# /.test(ref)) return `<h1 class='text-xl font-medium mt-4 mb-2'>${html}</h1>`;
  if (/^> /.test(ref))
    return `<blockquote class='border-l-2 border-gray-300 pl-3 text-gray-500 dark:text-gray-400 my-1 text-sm'>${html}</blockquote>`;
  if (/^\d+\. /.test(ref)) return `<li class='list-decimal ml-5 text-sm'>${html}</li>`;
  if (/^- /.test(ref)) return `<li class='list-disc ml-5 text-sm'>${html}</li>`;
  return `<p class='text-sm my-1'>${html}</p>`;
}

/* ─── Cell-level table diff helpers ─────────────────────────────── */

function parseCells(row: string): string[] {
  return row.split("|").slice(1, -1).map((c) => c.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|[-| ]+\|$/.test(line);
}

interface PairedRow {
  kind: "paired";
  oldLine: string;
  newLine: string;
}
interface SingleRow {
  kind: "eq" | "del" | "ins";
  line: string;
}
type GroupedTableRow = PairedRow | SingleRow;

/**
 * Groups consecutive del/ins table rows into paired entries for cell-level comparison.
 * Matches rows by their first cell (key column) so that only the cells that actually
 * changed get highlighted. Unmatched dels/ins remain as single entries.
 */
function groupTableBuffer(
  buffer: { type: DiffType; line: string }[]
): GroupedTableRow[] {
  const filtered = buffer.filter((r) => !isTableSeparator(r.line));
  const result: GroupedTableRow[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (filtered[i].type === "eq") {
      result.push({ kind: "eq", line: filtered[i].line });
      i++;
    } else {
      const dels: string[] = [];
      const inss: string[] = [];
      while (i < filtered.length && filtered[i].type !== "eq") {
        if (filtered[i].type === "del") dels.push(filtered[i].line);
        else inss.push(filtered[i].line);
        i++;
      }

      // Match del/ins rows by first cell (key column) for accurate pairing
      const usedDel = new Set<number>();
      const usedIns = new Set<number>();
      const pairs: [number, number][] = [];
      for (let d = 0; d < dels.length; d++) {
        const delKey = parseCells(dels[d])[0];
        if (!delKey) continue;
        for (let n = 0; n < inss.length; n++) {
          if (usedIns.has(n)) continue;
          if (parseCells(inss[n])[0] === delKey) {
            pairs.push([d, n]);
            usedDel.add(d);
            usedIns.add(n);
            break;
          }
        }
      }

      // Emit unmatched dels first (pure deletions), then new-side rows in order
      for (let d = 0; d < dels.length; d++) {
        if (!usedDel.has(d)) {
          result.push({ kind: "del", line: dels[d] });
        }
      }
      const insToDel = new Map<number, number>();
      for (const [d, n] of pairs) insToDel.set(n, d);
      for (let n = 0; n < inss.length; n++) {
        const dIdx = insToDel.get(n);
        if (dIdx !== undefined) {
          result.push({ kind: "paired", oldLine: dels[dIdx], newLine: inss[n] });
        } else {
          result.push({ kind: "ins", line: inss[n] });
        }
      }
    }
  }
  return result;
}

const CELL_CLASS =
  "border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs";

/**
 * Renders a paired table row with cell-level diff highlighting.
 * Only the cells that actually changed get coloured; unchanged cells render normally.
 * Returns "" when cells can't be compared (different column count) — caller falls back.
 */
function renderCellDiffRow(
  oldLine: string,
  newLine: string,
  mode: "unified" | "old" | "new"
): string {
  const oldCells = parseCells(oldLine);
  const newCells = parseCells(newLine);
  if (oldCells.length !== newCells.length) return "";

  const tds = oldCells.map((oc, i) => {
    const nc = newCells[i];
    if (oc === nc) {
      return `<td class='${CELL_CLASS}'>${inlineMarkdown(mode === "new" ? nc : oc)}</td>`;
    }
    if (mode === "unified") {
      return (
        `<td class='${CELL_CLASS}' style='background:rgba(250,204,21,0.10);'>` +
        `<span style='text-decoration:line-through;color:#991b1b;opacity:0.7;'>${inlineMarkdown(oc)}</span> ` +
        `<span style='color:#166534;font-weight:500;'>${inlineMarkdown(nc)}</span></td>`
      );
    }
    if (mode === "old") {
      return (
        `<td class='${CELL_CLASS}' style='background:rgba(220,38,38,0.08);'>` +
        `<span style='text-decoration:line-through;color:#991b1b;'>${inlineMarkdown(oc)}</span></td>`
      );
    }
    return (
      `<td class='${CELL_CLASS}' style='background:rgba(34,197,94,0.1);'>` +
      `<span style='color:#166534;'>${inlineMarkdown(nc)}</span></td>`
    );
  });
  return `<tr>${tds.join("")}</tr>`;
}

function renderFullChangeRow(line: string, type: "del" | "ins"): string {
  const cells = parseCells(line);
  const style =
    type === "del"
      ? "style='background:rgba(220,38,38,0.08);text-decoration:line-through;color:#991b1b;'"
      : "style='background:rgba(34,197,94,0.1);color:#166534;'";
  const tds = cells
    .map((c) => `<td class='${CELL_CLASS}'>${inlineMarkdown(c)}</td>`)
    .join("");
  return `<tr ${style}>${tds}</tr>`;
}

function renderEqRow(line: string): string {
  const cells = parseCells(line);
  const tds = cells
    .map((c) => `<td class='${CELL_CLASS}'>${inlineMarkdown(c)}</td>`)
    .join("");
  return `<tr>${tds}</tr>`;
}

function buildRenderedDiffHtml(diff: DiffEntry[]): string {
  const parts: string[] = [];
  let tableBuffer: { type: DiffType; line: string }[] = [];

  function flushTable() {
    if (tableBuffer.length === 0) return;
    const grouped = groupTableBuffer(tableBuffer);
    const rows = grouped
      .map((g) => {
        if (g.kind === "eq") return renderEqRow(g.line);
        if (g.kind === "paired") {
          const cellDiff = renderCellDiffRow(g.oldLine, g.newLine, "unified");
          if (cellDiff) return cellDiff;
          return renderFullChangeRow(g.oldLine, "del") + renderFullChangeRow(g.newLine, "ins");
        }
        if (g.kind === "del") return renderFullChangeRow(g.line, "del");
        return renderFullChangeRow(g.line, "ins");
      })
      .filter(Boolean);
    if (rows.length > 0) {
      parts.push(
        `<table class='w-full border-collapse my-2 text-xs'><tbody>${rows.join("")}</tbody></table>`
      );
    }
    tableBuffer = [];
  }

  /** Flush buffered consecutive text del/ins entries with word-level pairing.
   *  The buffer may also contain eq-empty entries that acted as "bridges"
   *  between related del/ins groups (e.g. an empty line between a deleted
   *  paragraph and its replacement). */
  let textBuffer: DiffEntry[] = [];

  function flushTextBuffer() {
    if (textBuffer.length === 0) return;

    // Collect dels and ins with their buffer positions (skip empty lines)
    const dels: { bi: number; val: string }[] = [];
    const inss: { bi: number; val: string }[] = [];
    for (let i = 0; i < textBuffer.length; i++) {
      if (textBuffer[i].val.trim() === "") continue;
      if (textBuffer[i].type === "del") dels.push({ bi: i, val: textBuffer[i].val });
      else if (textBuffer[i].type === "ins") inss.push({ bi: i, val: textBuffer[i].val });
    }

    // Pair del/ins lines that share the same markdown prefix type
    const usedDel = new Set<number>();
    const usedIns = new Set<number>();
    const insToDelBi = new Map<number, number>(); // ins buffer-idx → del buffer-idx

    for (let d = 0; d < dels.length; d++) {
      for (let n = 0; n < inss.length; n++) {
        if (usedIns.has(n)) continue;
        if (isSameLineType(dels[d].val, inss[n].val)) {
          insToDelBi.set(inss[n].bi, dels[d].bi);
          usedDel.add(d);
          usedIns.add(n);
          break;
        }
      }
    }

    const pairedDelIndices = new Set(insToDelBi.values());

    // Walk the buffer in order, rendering each entry
    for (let i = 0; i < textBuffer.length; i++) {
      const entry = textBuffer[i];

      if (entry.val.trim() === "") {
        parts.push("<br/>");
        continue;
      }

      if (entry.type === "del") {
        if (pairedDelIndices.has(i)) continue; // rendered with its paired ins
        const inner = lineToHtml(entry.val);
        if (!inner) continue;
        parts.push(
          `<div style='background:rgba(220,38,38,0.08);border-left:3px solid #ef4444;padding-left:6px;margin:2px 0;'>` +
            `<span style='text-decoration:line-through;color:#991b1b;opacity:0.85;'>${inner}</span></div>`
        );
        continue;
      }

      // ins
      const pairedDelBi = insToDelBi.get(i);
      if (pairedDelBi !== undefined) {
        const wordHtml = renderWordDiffUnified(textBuffer[pairedDelBi].val, entry.val);
        parts.push(
          `<div style='background:rgba(250,204,21,0.06);border-left:3px solid #eab308;padding-left:6px;margin:2px 0;'>${wordHtml}</div>`
        );
      } else {
        const inner = lineToHtml(entry.val);
        if (!inner) continue;
        parts.push(
          `<div style='background:rgba(34,197,94,0.1);border-left:3px solid #22c55e;padding-left:6px;margin:2px 0;'>` +
            `<span style='color:#166534;'>${inner}</span></div>`
        );
      }
    }

    textBuffer = [];
  }

  for (const entry of diff) {
    const { type, val } = entry;
    const isTableRow = /^\|/.test(val);

    if (isTableRow) {
      flushTextBuffer();
      tableBuffer.push({ type, line: val });
      continue;
    }

    flushTable();

    if (val.trim() === "") {
      if (textBuffer.length > 0) {
        // Don't flush — bridge eq-empty lines between related del/ins groups
        textBuffer.push(entry);
      } else {
        parts.push("<br/>");
      }
      continue;
    }

    if (type === "eq") {
      flushTextBuffer();
      const inner = lineToHtml(val);
      if (inner) parts.push(inner);
    } else {
      // Buffer consecutive del/ins text lines
      textBuffer.push(entry);
    }
  }

  flushTextBuffer();
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
    const grouped = groupTableBuffer(tableBuffer);
    const sideMode: "old" | "new" = side === "old" ? "old" : "new";
    const rows = grouped
      .flatMap((g) => {
        if (g.kind === "eq") return [renderEqRow(g.line)];
        if (g.kind === "paired") {
          const cellDiff = renderCellDiffRow(g.oldLine, g.newLine, sideMode);
          if (cellDiff) return [cellDiff];
          return side === "old"
            ? [renderFullChangeRow(g.oldLine, "del")]
            : [renderFullChangeRow(g.newLine, "ins")];
        }
        if (g.kind === "del") return side === "old" ? [renderFullChangeRow(g.line, "del")] : [];
        return side === "new" ? [renderFullChangeRow(g.line, "ins")] : [];
      })
      .filter(Boolean);
    if (rows.length > 0)
      parts.push(
        `<table class='w-full border-collapse my-2 text-xs'><tbody>${rows.join("")}</tbody></table>`
      );
    tableBuffer = [];
  }

  /** Flush buffered consecutive text del/ins entries with word-level pairing.
   *  The buffer may also contain eq-empty bridge entries. */
  let textBuffer: DiffEntry[] = [];

  function flushTextBuffer() {
    if (textBuffer.length === 0) return;

    const dels: { bi: number; val: string }[] = [];
    const inss: { bi: number; val: string }[] = [];
    for (let i = 0; i < textBuffer.length; i++) {
      if (textBuffer[i].val.trim() === "") continue;
      if (textBuffer[i].type === "del") dels.push({ bi: i, val: textBuffer[i].val });
      else if (textBuffer[i].type === "ins") inss.push({ bi: i, val: textBuffer[i].val });
    }

    const usedDel = new Set<number>();
    const usedIns = new Set<number>();
    const insToDelBi = new Map<number, number>();

    for (let d = 0; d < dels.length; d++) {
      for (let n = 0; n < inss.length; n++) {
        if (usedIns.has(n)) continue;
        if (isSameLineType(dels[d].val, inss[n].val)) {
          insToDelBi.set(inss[n].bi, dels[d].bi);
          usedDel.add(d);
          usedIns.add(n);
          break;
        }
      }
    }

    const pairedDelIndices = new Set(insToDelBi.values());

    for (let i = 0; i < textBuffer.length; i++) {
      const entry = textBuffer[i];

      if (entry.val.trim() === "") {
        parts.push("<br/>");
        continue;
      }

      if (entry.type === "del") {
        if (pairedDelIndices.has(i)) continue;
        if (side !== "old") continue;
        const inner = lineToHtml(entry.val);
        if (!inner) continue;
        parts.push(
          `<div style='background:rgba(220,38,38,0.08);border-left:3px solid #ef4444;padding-left:6px;margin:2px 0;'>` +
            `<span style='text-decoration:line-through;color:#991b1b;opacity:0.85;'>${inner}</span></div>`
        );
        continue;
      }

      // ins
      const pairedDelBi = insToDelBi.get(i);
      if (pairedDelBi !== undefined) {
        const wordHtml = renderWordDiffSide(textBuffer[pairedDelBi].val, entry.val, side);
        const borderColor = side === "old" ? "#ef4444" : "#22c55e";
        const bgColor = side === "old" ? "rgba(220,38,38,0.04)" : "rgba(34,197,94,0.04)";
        parts.push(
          `<div style='background:${bgColor};border-left:3px solid ${borderColor};padding-left:6px;margin:2px 0;'>${wordHtml}</div>`
        );
      } else {
        if (side !== "new") continue;
        const inner = lineToHtml(entry.val);
        if (!inner) continue;
        parts.push(
          `<div style='background:rgba(34,197,94,0.1);border-left:3px solid #22c55e;padding-left:6px;margin:2px 0;'>` +
            `<span style='color:#166534;'>${inner}</span></div>`
        );
      }
    }

    textBuffer = [];
  }

  for (const entry of diff) {
    const { type, val } = entry;

    if (/^\|/.test(val)) {
      flushTextBuffer();
      tableBuffer.push({ type, line: val });
      continue;
    }

    flushTable();

    if (val.trim() === "") {
      if (textBuffer.length > 0) {
        textBuffer.push(entry);
      } else {
        if (keep.includes(type)) parts.push("<br/>");
      }
      continue;
    }

    if (type === "eq") {
      flushTextBuffer();
      const inner = lineToHtml(val);
      if (inner) parts.push(inner);
    } else {
      textBuffer.push(entry);
    }
  }

  flushTextBuffer();
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
