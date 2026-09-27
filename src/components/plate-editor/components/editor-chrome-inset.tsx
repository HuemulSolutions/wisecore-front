'use client';

import * as React from 'react';

/**
 * Inset superior (en px, relativo al viewport) ocupado por el "chrome" fijo que
 * hay sobre el área editable: header global, header de detalle, barra sticky de
 * sección y el toolbar fijo del editor.
 *
 * Los toolbars flotantes (mermaid, media, tabla, link, selección, menú `/`) lo
 * usan como `collisionPadding` / `padding` de floating-ui para no dibujarse
 * encima de esa franja: cuando no cabe arriba, hacen flip debajo del nodo.
 *
 * Se mide una sola cosa —el borde inferior del `FixedToolbar`— porque al ser
 * `sticky` ya queda pegado bajo todo lo anterior, así que su `bottom` resume
 * el apilado superior completo.
 */
const EditorChromeInsetContext = React.createContext<number>(0);

export function useEditorChromeInset(): number {
  return React.useContext(EditorChromeInsetContext);
}

/** Selectores de fallback cuando el editor no muestra toolbar (lector / readOnly). */
const FALLBACK_SELECTORS = [
  '[data-desktop-header]',
  '[data-mobile-header]',
  '[data-app-header]',
];

function measureFallback(): number {
  if (typeof document === 'undefined') return 0;

  let bottom = 0;
  for (const selector of FALLBACK_SELECTORS) {
    for (const el of Array.from(document.querySelectorAll(selector))) {
      const rect = el.getBoundingClientRect();
      // Ignorar los ocultos por breakpoint (mobile vs desktop).
      if (rect.height === 0) continue;
      bottom = Math.max(bottom, rect.bottom);
    }
  }

  return bottom;
}

export function EditorChromeInsetProvider({
  children,
  toolbarRef,
}: {
  children: React.ReactNode;
  toolbarRef: React.RefObject<HTMLElement | null>;
}) {
  const [inset, setInset] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const toolbar = toolbarRef.current;
      const next = toolbar
        ? toolbar.getBoundingClientRect().bottom
        : measureFallback();

      setInset((prev) => {
        const clamped = Math.max(0, Math.round(next));
        // Evitar renders por sub-píxel durante el scroll.
        return Math.abs(prev - clamped) < 1 ? prev : clamped;
      });
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();

    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    const observer = new ResizeObserver(schedule);
    if (toolbarRef.current) observer.observe(toolbarRef.current);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [toolbarRef]);

  return (
    <EditorChromeInsetContext.Provider value={inset}>
      {children}
    </EditorChromeInsetContext.Provider>
  );
}
