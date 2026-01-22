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
  
  sections.forEach((section, sectionIndex) => {
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    let match;

    while ((match = headingRegex.exec(section.content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      // Generate the same ID as the Markdown component
      const id = `section-${sectionIndex}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      
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
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    headings.push({
      id,
      title,
      level,
    });
  }

  return headings;
}
