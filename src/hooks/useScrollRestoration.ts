import { useRef, useEffect } from 'react';

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

  // Función para guardar la posición actual
  const saveScrollPosition = () => {
    if (viewportRef.current) {
      const scrollTop = viewportRef.current.scrollTop;
      sessionStorage.setItem(storageKey, scrollTop.toString());
    }
  };

  // Función para restaurar la posición guardada
  const restoreScrollPosition = () => {
    if (viewportRef.current) {
      const savedPosition = sessionStorage.getItem(storageKey);
      if (savedPosition) {
        const scrollTop = parseInt(savedPosition, 10);
        viewportRef.current.scrollTop = scrollTop;
      }
    }
  };

  // Función para limpiar la posición guardada
  const clearScrollPosition = () => {
    sessionStorage.removeItem(storageKey);
  };

  // Restaurar posición al montar el componente
  useEffect(() => {
    // Pequeño delay para asegurar que el DOM esté completamente renderizado
    const timeoutId = setTimeout(restoreScrollPosition, 50);
    return () => clearTimeout(timeoutId);
  }, []);

  // Guardar posición antes de desmontar
  useEffect(() => {
    const currentViewport = viewportRef.current;
    
    const handleScroll = () => {
      saveScrollPosition();
    };

    // Agregar listener de scroll
    if (currentViewport) {
      currentViewport.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Cleanup: guardar posición final y remover listener
    return () => {
      if (currentViewport) {
        saveScrollPosition();
        currentViewport.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return {
    viewportRef,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition
  };
}