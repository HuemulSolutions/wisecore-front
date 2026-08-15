import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TableOfContentsProps } from "@/types/table-of-contents";
import { useTranslation } from "react-i18next";

export function TableOfContents({ items }: TableOfContentsProps) {
    const { t } = useTranslation('assets');
    const [activeId, setActiveId] = useState<string | null>(null);
    const isProgrammaticScroll = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const scrollContainerRef = useRef<HTMLElement | null>(null);
    const rafId = useRef<number | null>(null);

    const updateActiveSection = useCallback(() => {
        if (isProgrammaticScroll.current) return;
        const container = scrollContainerRef.current;
        if (!container) return;

        const containerTop = container.getBoundingClientRect().top;
        // Threshold: a section is "active" once its top crosses into the top 25% of the container
        const threshold = containerTop + container.clientHeight * 0.25;

        let currentActiveId: string | null = null;
        for (const item of items) {
            const el = document.getElementById(item.id);
            if (!el) continue;
            if (el.getBoundingClientRect().top <= threshold) {
                currentActiveId = item.id;
            }
        }

        if (currentActiveId) {
            setActiveId(currentActiveId);
        }
    }, [items]);

    useEffect(() => {
        const handleScroll = () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(updateActiveSection);
        };

        const timeoutId = setTimeout(() => {
            // Find the Radix ScrollArea viewport from one of the section elements
            const firstEl = items.length > 0 ? document.getElementById(items[0].id) : null;
            const container = firstEl?.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;

            if (container) {
                scrollContainerRef.current = container;
                container.addEventListener('scroll', handleScroll, { passive: true });
                // Initial check
                updateActiveSection();
            }
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.removeEventListener('scroll', handleScroll);
            }
            if (rafId.current) cancelAnimationFrame(rafId.current);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
    }, [items, updateActiveSection]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            setActiveId(id);
            isProgrammaticScroll.current = true;

            const SCROLL_OFFSET = 40;
            const viewport = scrollContainerRef.current || element.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
            if (viewport) {
                const elementTop = element.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
                viewport.scrollTo({ top: elementTop - SCROLL_OFFSET, behavior: 'smooth' });
            } else {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }
            scrollTimeout.current = setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 1000);
        }
    };

    // Con 0 o 1 sección el índice no aporta navegación: en vez de dejar el panel
    // vacío se explica cómo se llena.
    const showEmptyHint = items.length <= 1;

    return (
        <div className="sticky top-1 space-y-2">
            <ul className="space-y-0.5">
                {items.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                        <li key={item.id} className="relative">
                            {isActive && (
                                <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                            )}
                            <a
                                href={`#${item.id}`}
                                onClick={(e) => handleLinkClick(e, item.id)}
                                aria-current={isActive ? "location" : undefined}
                                style={{ paddingLeft: (item.level - 1) * 12 + 8 }}
                                className={cn(
                                    "flex items-center gap-2 text-sm h-7 w-full rounded-md pr-2 transition-colors hover:cursor-pointer",
                                    isActive
                                        ? "bg-accent text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <span className="flex-1 truncate">{item.title}</span>
                                {item.hasPendingSuggestion && (
                                    <span
                                        className="shrink-0 h-2 w-2 rounded-full bg-amber-400 animate-pulse"
                                        title={t('tableOfContents.pendingSuggestion')}
                                    />
                                )}
                            </a>
                        </li>
                    );
                })}
            </ul>
            {showEmptyHint && (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-foreground">{t('tableOfContents.emptyTitle')}</p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t('tableOfContents.emptyHint')}</p>
                </div>
            )}
        </div>
    );
}
