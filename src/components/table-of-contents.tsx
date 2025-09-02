import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
    id: string;
    title: string;
    level: number;
}

interface TableOfContentsProps {
    items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-50% 0px -50% 0px" } // Set active when element is in the middle of the screen
        );

        const elements = items.map(item => document.getElementById(item.id)).filter(Boolean);
        elements.forEach(el => observer.current!.observe(el!));

        return () => observer.current?.disconnect();
    }, [items]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
        // Manually set active id on click for instant feedback
        setActiveId(id);
    };

    if (!items.length) {
        return null;
    }

    return (
        <div className="sticky top-1">
            <p className="font-medium mb-2">Table of Contents</p>
            <ul className="space-y-2">
                {items.map((item) => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            onClick={(e) => handleLinkClick(e, item.id)}
                            className={cn(
                                "text-sm text-muted-foreground hover:text-foreground transition-colors",
                                {
                                    "text-foreground font-medium": activeId === item.id,
                                }
                            )}
                            style={{ paddingLeft: `${(item.level - 1) * 1}rem` }}
                        >
                            {item.level > 1 && '- '}
                            {item.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
