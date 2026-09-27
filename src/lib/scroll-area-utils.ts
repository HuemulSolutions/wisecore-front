/**
 * Resolve the actual scrollable node for a ref that may point at:
 *  - a descendant of the Radix ScrollArea viewport (use `closest`), or
 *  - an ancestor that wraps the ScrollArea (use `querySelector`).
 *
 * Both `useScrollRestoration` and `useScrollPreservation` historically read/wrote
 * `scrollTop` directly on a ref'd div that has no `overflow` of its own — the real
 * scrolling happens on Radix's internal `[data-radix-scroll-area-viewport]` node,
 * a few levels away in either direction depending on where the ref was placed. That
 * made every `scrollTop` read return 0 and every write a no-op — scroll position was
 * silently never preserved. This resolves the real node so those hooks work.
 *
 * Falls back to the ref'd node itself when there's no ScrollArea involved (e.g. a
 * plain scrollable div), so both hooks keep working outside assets/content too.
 */
export function resolveScrollAreaViewport(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  const ancestor = node.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
  if (ancestor) return ancestor;
  const descendant = node.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
  if (descendant) return descendant;
  return node;
}
