import { useEffect, useRef, useState, type RefObject } from 'react';
import { getPanelGroupElement, type ImperativePanelHandle } from 'react-resizable-panels';

/** Ancho fijo (px) de los rails de paneles colapsados (`w-13` = 3.25rem). */
export const RAIL_WIDTH_PX = 52;

interface UseCollapsedPanelSizeOptions {
  /** `id` del `ResizablePanelGroup` que contiene al panel. */
  groupId: string;
  panelRef: RefObject<ImperativePanelHandle | null>;
  px?: number;
  /** % usado hasta que el grupo se mide. */
  fallback?: number;
}

/**
 * `react-resizable-panels` solo trabaja en %, así que un rail de ancho fijo en px
 * necesita su `collapsedSize` en % del grupo medido. Devuelve ese % (se recalcula
 * al redimensionar el grupo) y, si el panel está colapsado, lo reajusta para que
 * el rail mantenga los `px` exactos.
 */
export function useCollapsedPanelSize({
  groupId,
  panelRef,
  px = RAIL_WIDTH_PX,
  fallback = 4,
}: UseCollapsedPanelSizeOptions): number {
  const [size, setSize] = useState(fallback);
  const observedRef = useRef<{ el: HTMLElement; observer: ResizeObserver } | null>(null);

  // Sin deps: el grupo puede montarse después del primer render (early returns del
  // consumidor), así que se reintenta la búsqueda del elemento en cada render.
  useEffect(() => {
    const el = getPanelGroupElement(groupId);
    if (!el || observedRef.current?.el === el) return;
    observedRef.current?.observer.disconnect();

    const measure = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) setSize(Number(((px / width) * 100).toFixed(3)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observedRef.current = { el, observer };
    measure();
  });

  useEffect(
    () => () => {
      observedRef.current?.observer.disconnect();
      observedRef.current = null;
    },
    [],
  );

  // Si ya estaba colapsado cuando cambió el %, reajustar el panel al nuevo tamaño.
  useEffect(() => {
    const panel = panelRef.current;
    if (panel?.isCollapsed() && Math.abs(panel.getSize() - size) > 0.01) panel.resize(size);
  }, [size, panelRef]);

  return size;
}
