import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { TableOfContentsProps } from "@/types/table-of-contents";
import { useTranslation } from "react-i18next";

export function TableOfContents({ items }: TableOfContentsProps) {
    const { t } = useTranslation('assets');
    const [activeId, setActiveId] = useState<string | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const isUserScrolling = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (observer.current) {
            observer.current.disconnect();
        }

        const handleScroll = () => {
            if (!isUserScrolling.current) {
                isUserScrolling.current = true;
                if (scrollTimeout.current) {
                    clearTimeout(scrollTimeout.current);
                }
                scrollTimeout.current = setTimeout(() => {
                    isUserScrolling.current = false;
                }, 150);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        observer.current = new IntersectionObserver(
            (entries) => {
                if (isUserScrolling.current) return;

                const intersectingEntries = entries
                    .filter(entry => entry.isIntersecting)
                    .map(entry => ({
                        id: entry.target.id,
                        ratio: entry.intersectionRatio,
                        top: entry.boundingClientRect.top
                    }))
                    .sort((a, b) => a.top - b.top);

                const topEntry = intersectingEntries.find(entry => entry.ratio > 0.1);
                if (topEntry) {
                    setActiveId(topEntry.id);
                }
            },
            {
                rootMargin: "-10% 0px -60% 0px",
                threshold: [0.1, 0.5]
            }
        );

        const timeoutId = setTimeout(() => {
            const elements = items.map(item => document.getElementById(item.id)).filter(Boolean);
            elements.forEach(el => {
                if (el && observer.current) {
                    observer.current.observe(el);
                }
            });
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }
            window.removeEventListener('scroll', handleScroll);
            observer.current?.disconnect();
        };
    }, [items]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            setActiveId(id);
            isUserScrolling.current = true;

            const SCROLL_OFFSET = 40;
            const viewport = element.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
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
                isUserScrolling.current = false;
            }, 1000);
        }
    };

    if (!items.length) {
        return null;
    }

    return (
        <div className="sticky top-1">
            <ul className="space-y-0.5">
                {items.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                onClick={(e) => handleLinkClick(e, item.id)}
                                className={cn(
                                    "flex items-center gap-2 text-sm transition-colors hover:text-blue-600 hover:cursor-pointer py-1 px-2 rounded-md",
                                    isActive
                                        ? "text-blue-600 font-medium bg-blue-50"
                                        : "text-gray-600 hover:bg-gray-50"
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
        </div>
    );
}
