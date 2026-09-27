import { readSvgIntrinsicSize } from './mermaid-snapshot';

/**
 * Mermaid renders every diagram with `width="100%"` **and** an inline
 * `style="max-width: {intrinsic width}px"` (see `calculateSvgSizeAttrs` in
 * mermaid's `setupGraphViewbox.js`). That inline `max-width` caps the diagram at its
 * own natural size no matter how wide its container is – so a tall, narrow flowchart
 * stays tiny even at 100% block width, and resizing the node visually does nothing.
 *
 * This strips that cap and lets the CSS on the preview container (`width: 100%;
 * height: auto`) drive the actual rendered size, the same way an `<img>` scales.
 * Also guarantees a `viewBox` is present (mermaid always emits one, but this keeps
 * the function safe if that ever changes) so the aspect ratio is preserved when the
 * browser computes height from width.
 */
export function normalizeMermaidSvgForDisplay(svg: string): {
  svg: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.documentElement;

  const { width, height } = readSvgIntrinsicSize(svgEl);

  if (!svgEl.getAttribute('viewBox')) {
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');
  svgEl.removeAttribute('style');

  return {
    svg: new XMLSerializer().serializeToString(doc),
    intrinsicWidth: width,
    intrinsicHeight: height,
  };
}
