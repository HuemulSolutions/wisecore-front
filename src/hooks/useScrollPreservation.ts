import { useRef, useEffect, useCallback } from "react";
import type { UseScrollPreservationReturn } from "@/types/huemul"
import { resolveScrollAreaViewport } from "@/lib/scroll-area-utils";

/**
 * Hook to manage scroll position preservation during content updates
 * Useful when content reloads but you want to maintain user's scroll position
 *
 * `scrollContainerRef` is typically attached to a plain wrapper div around a
 * Radix ScrollArea (see pages/assets.tsx), not to the scrollable node itself —
 * reading/writing `scrollTop` on it directly was always a no-op (no `overflow`
 * of its own). `resolveScrollAreaViewport` finds the real
 * `[data-radix-scroll-area-viewport]` node, whether it's an ancestor or a
 * descendant of the ref'd element, so save/restore actually do something.
 */
export function useScrollPreservation(): UseScrollPreservationReturn {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const preserveScrollRef = useRef<boolean>(false);

  /**
   * Save the current scroll position
   */
  const saveScrollPosition = useCallback(() => {
    const viewport = resolveScrollAreaViewport(scrollContainerRef.current);
    if (viewport) {
      scrollPositionRef.current = viewport.scrollTop;
    }
  }, []);

  /**
   * Restore the previously saved scroll position
   */
  const restoreScrollPosition = useCallback(() => {
    if (preserveScrollRef.current) {
      const savedPosition = scrollPositionRef.current;
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        const viewport = resolveScrollAreaViewport(scrollContainerRef.current);
        if (viewport) {
          viewport.scrollTop = savedPosition;
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
    const viewport = resolveScrollAreaViewport(scrollContainerRef.current);
    if (!viewport) return;

    let scrollTimer: number;
    const handleScroll = () => {
      // Debounce scroll saving to avoid too many updates
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        saveScrollPosition();
      }, 100);
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
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
