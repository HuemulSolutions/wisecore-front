/**
 * Utilities for extracting and processing headings from markdown content
 */

import type { ContentSection } from '@/types';

export interface HeadingItem {
  id: string;
  title: string;
  level: number;
  sectionId?: string;
  sectionIndex?: number;
}

/**
 * Extract headings from multiple content sections for table of contents
 */
export function extractHeadingsFromSections(sections: ContentSection[]): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const idCount = new Map<string, number>();
  
  sections.forEach((section, sectionIndex) => {
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    let match;

    while ((match = headingRegex.exec(section.content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const baseId = `section-${sectionIndex}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      const count = idCount.get(baseId) || 0;
      idCount.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
      
      headings.push({
        id,
        title,
        level,
        sectionId: section.id,
        sectionIndex,
      });
    }
  });

  return headings;
}

/**
 * Legacy function for backward compatibility - extracts headings from a single markdown string
 */
export function extractHeadings(markdown: string): HeadingItem[] {
  const headingRegex = /^(#{1,6})\s+(.*)$/gm;
  const headings: HeadingItem[] = [];
  const idCount = new Map<string, number>();
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const baseId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const count = idCount.get(baseId) || 0;
    idCount.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
    
    headings.push({
      id,
      title,
      level,
    });
  }

  return headings;
}
