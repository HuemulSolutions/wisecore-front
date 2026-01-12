import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { TableOfContentsProps } from "@/types/table-of-contents";

export function TableOfContents({ items }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const isUserScrolling = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (observer.current) {
            observer.current.disconnect();
        }

        // Track user scrolling to avoid conflicts
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
                // Only update if user is not actively scrolling via click
                if (isUserScrolling.current) return;

                // Find all intersecting entries and their positions
                const intersectingEntries = entries
                    .filter(entry => entry.isIntersecting)
                    .map(entry => ({
                        id: entry.target.id,
                        ratio: entry.intersectionRatio,
                        top: entry.boundingClientRect.top
                    }))
                    .sort((a, b) => a.top - b.top); // Sort by position from top

                // Select the first (topmost) intersecting element with decent visibility
                const topEntry = intersectingEntries.find(entry => entry.ratio > 0.1);
                
                if (topEntry) {
                    setActiveId(topEntry.id);
                }
            },
            { 
                rootMargin: "-10% 0px -60% 0px", // Top margin smaller, bottom margin larger
                threshold: [0.1, 0.5] // Simplified thresholds
            }
        );

        // Create a timeout to ensure DOM is ready
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
            // Immediately set as active and prevent observer updates
            setActiveId(id);
            isUserScrolling.current = true;
            
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            
            // Reset scrolling flag after animation completes
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }
            scrollTimeout.current = setTimeout(() => {
                isUserScrolling.current = false;
            }, 1000); // Longer timeout for smooth scroll animation
        } else {
            console.warn(`Element with id "${id}" not found`);
        }
    };

    if (!items.length) {
        return null;
    }

    return (
        <div className="sticky top-1">
            <ul className="space-y-1">
                {items.map((item) => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            onClick={(e) => handleLinkClick(e, item.id)}
                            className={cn(
                                "block text-sm transition-colors hover:text-blue-600 hover:cursor-pointer py-1",
                                {
                                    "text-blue-600 font-medium": activeId === item.id,
                                    "text-gray-600": activeId !== item.id,
                                }
                            )}
                            style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
                        >
                            {item.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
