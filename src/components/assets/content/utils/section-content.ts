/** Forma mínima de una sección con texto: `content` (de /content) u `output` (section execution). */
export interface SectionTextSource {
  plate_content?: string[];
  content?: string;
  output?: string;
}

/** Recursively extract all text from a Plate JSON node. */
export function extractPlateText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  if ('text' in node) return (node as { text: string }).text || '';
  const el = node as { children?: unknown[] };
  if (Array.isArray(el.children)) return el.children.map(extractPlateText).join('');
  return '';
}

/**
 * Check whether a section has no visible content.
 * Checks plate_content (primary render source) when available, then falls back to markdown.
 */
export function isSectionContentEmpty(section: SectionTextSource): boolean {
  // If plate_content exists, it's used as the primary render source
  if (section.plate_content && section.plate_content.length > 0) {
    const allText = section.plate_content
      .map((s) => { try { return extractPlateText(JSON.parse(s)); } catch { return ''; } })
      .join('');
    return allText.trim() === '';
  }
  // Fallback: check markdown content
  const markdown = section.content ?? section.output;
  return !markdown || markdown.trim() === '';
}
