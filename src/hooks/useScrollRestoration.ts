import { useRef, useEffect, useCallback } from 'react';
import { resolveScrollAreaViewport } from '@/lib/scroll-area-utils';

/**
 * Hook personalizado para preservar y restaurar la posición de scroll
 * usando ScrollArea de shadcn/ui
 *
 * @param key - Identificador único para esta instancia de scroll
 * @returns ref que debe ser asignado al viewport del ScrollArea
 */
export function useScrollRestoration(key: string) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const storageKey = `scroll-position-${key}`;
  // Último scrollTop leído del viewport real, escrito a sessionStorage con
  // throttle (ver el listener de scroll más abajo) en vez de sincrónicamente
  // en cada evento — sessionStorage.setItem es bloqueante y, sin throttle,
  // agrega jank a cada frame de scroll.
  const pendingScrollTopRef = useRef<number | null>(null);
  const flushRafRef = useRef<number | null>(null);

  // Función para guardar la posición actual
  // Memoizadas (useCallback) por identidad estable de storageKey: los ~25
  // call-sites de assets-content.tsx pasan estas funciones como props/deps a
  // componentes memoizados (ver AssetsSectionsList) — sin esto, cada render
  // del padre les daría una referencia nueva y anularía ese memo.
  const saveScrollPosition = useCallback(() => {
    const viewport = resolveScrollAreaViewport(viewportRef.current);
    if (viewport) {
      sessionStorage.setItem(storageKey, viewport.scrollTop.toString());
    }
  }, [storageKey]);

  // Función para restaurar la posición guardada
  const restoreScrollPosition = useCallback(() => {
    const viewport = resolveScrollAreaViewport(viewportRef.current);
    if (viewport) {
      const savedPosition = sessionStorage.getItem(storageKey);
      if (savedPosition) {
        const scrollTop = parseInt(savedPosition, 10);
        viewport.scrollTop = scrollTop;
      }
    }
  }, [storageKey]);

  // Función para limpiar la posición guardada
  const clearScrollPosition = useCallback(() => {
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  // Restaurar posición al montar el componente
  useEffect(() => {
    // Pequeño delay para asegurar que el DOM esté completamente renderizado
    const timeoutId = setTimeout(restoreScrollPosition, 50);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar posición antes de desmontar
  useEffect(() => {
    const viewport = resolveScrollAreaViewport(viewportRef.current);

    const flush = () => {
      flushRafRef.current = null;
      if (pendingScrollTopRef.current !== null) {
        sessionStorage.setItem(storageKey, pendingScrollTopRef.current.toString());
        pendingScrollTopRef.current = null;
      }
    };

    const handleScroll = () => {
      pendingScrollTopRef.current = viewport?.scrollTop ?? 0;
      if (flushRafRef.current === null) {
        flushRafRef.current = requestAnimationFrame(flush);
      }
    };

    // Agregar listener de scroll
    if (viewport) {
      viewport.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Cleanup: guardar posición final (sincrónico, sin esperar el rAF pendiente) y remover listener
    return () => {
      if (viewport) {
        if (flushRafRef.current !== null) {
          cancelAnimationFrame(flushRafRef.current);
          flushRafRef.current = null;
        }
        saveScrollPosition();
        viewport.removeEventListener('scroll', handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    viewportRef,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition
  };
}
