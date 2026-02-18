import { useRef, useEffect, useCallback } from "react";

interface UseScrollPreservationReturn {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  saveScrollPosition: () => void;
  restoreScrollPosition: () => void;
  preserveScroll: () => void;
}

/**
 * Hook to manage scroll position preservation during content updates
 * Useful when content reloads but you want to maintain user's scroll position
 */
export function useScrollPreservation(): UseScrollPreservationReturn {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const preserveScrollRef = useRef<boolean>(false);

  /**
   * Save the current scroll position
   */
  const saveScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  }, []);

  /**
   * Restore the previously saved scroll position
   */
  const restoreScrollPosition = useCallback(() => {
    if (scrollContainerRef.current && preserveScrollRef.current) {
      const savedPosition = scrollPositionRef.current;
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedPosition;
        }
        preserveScrollRef.current = false;
      });
    }
  }, []);

  /**
   * Mark that scroll should be preserved on next update
   */
  const preserveScroll = useCallback(() => {
    saveScrollPosition();
    preserveScrollRef.current = true;
  }, [saveScrollPosition]);

  /**
   * Set up scroll listener to periodically save position
   */
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimer: number;
    const handleScroll = () => {
      // Debounce scroll saving to avoid too many updates
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        saveScrollPosition();
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, [saveScrollPosition]);

  return {
    scrollContainerRef,
    saveScrollPosition,
    restoreScrollPosition,
    preserveScroll,
  };
}
