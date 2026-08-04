/**
 * Render a Mermaid diagram to SVG and rasterize it to a PNG File, so it can be
 * uploaded as a regular media snapshot (see `plate-mermaid-utils.ts`). Word/Markdown
 * exports cannot render Mermaid server-side, so the backend only ever sees the
 * rasterized image, referenced via the same `{{MEDIA:<uuid>}}` placeholder used for
 * normal images.
 *
 * `mermaid` is dynamically imported so it doesn't inflate the initial editor bundle –
 * only sections that actually contain a diagram pay for it.
 */

let mermaidInitialized = false;

function randomId(): string {
  return `mermaid-${Math.random().toString(36).slice(2, 10)}`;
}

/** Render Mermaid source to an SVG markup string. Throws on invalid syntax. */
export async function renderMermaidSvg(code: string): Promise<string> {
  const mermaid = (await import('mermaid')).default;

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      // Rendering labels as plain SVG text (instead of <foreignObject> HTML) is what
      // makes the diagram rasterizable to canvas reliably across browsers – with
      // htmlLabels the canvas snapshot can come out blank.
      htmlLabels: false,
      flowchart: { htmlLabels: false },
      theme: 'neutral',
    });
    mermaidInitialized = true;
  }

  const { svg } = await mermaid.render(randomId(), code);
  return svg;
}

/**
 * Give the <svg> explicit pixel width/height derived from its viewBox. Mermaid emits
 * `style="max-width: …"` without intrinsic dimensions, and without them the canvas
 * used for rasterization ends up 0×0.
 */
function withExplicitDimensions(svg: string, scale: number): { svg: string; width: number; height: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.documentElement;

  const viewBox = svgEl.getAttribute('viewBox');
  let width = Number.parseFloat(svgEl.getAttribute('width') ?? '');
  let height = Number.parseFloat(svgEl.getAttribute('height') ?? '');

  if ((!width || !height) && viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    if (parts.length === 4) {
      width = parts[2];
      height = parts[3];
    }
  }

  width = Math.max(1, Math.round((width || 800) * scale));
  height = Math.max(1, Math.round((height || 600) * scale));

  svgEl.setAttribute('width', String(width));
  svgEl.setAttribute('height', String(height));

  return { svg: new XMLSerializer().serializeToString(doc), width, height };
}

/** Rasterize a Mermaid SVG string into a PNG `File` ready to upload as media. */
export async function mermaidSvgToPngFile(
  svg: string,
  opts: { scale?: number; fileName?: string } = {},
): Promise<File> {
  const { scale = 2, fileName = 'mermaid-diagram.png' } = opts;
  const { svg: sizedSvg, width, height } = withExplicitDimensions(svg, scale);

  const svgDataUrl = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(sizedSvg)))}`;

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load Mermaid SVG for rasterization'));
    image.src = svgDataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');

  // White background – Mermaid SVGs are transparent by default and a transparent
  // PNG would render as black in most Word viewers.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to rasterize Mermaid diagram to PNG');

  return new File([blob], fileName, { type: 'image/png' });
}

/** Render Mermaid source directly to a PNG `File`. Throws on invalid syntax or render failure. */
export async function renderMermaidPngFile(code: string, opts?: { scale?: number; fileName?: string }): Promise<File> {
  const svg = await renderMermaidSvg(code);
  return mermaidSvgToPngFile(svg, opts);
}
