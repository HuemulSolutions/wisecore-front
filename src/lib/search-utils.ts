/**
 * Utility functions for search highlighting and text processing
 */

/**
 * Simple markdown to HTML converter for basic formatting
 */
function simpleMarkdownToHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```(\w+)?\n?/g, '').replace(/```$/g, '');
      return `<pre><code>${code}</code></pre>`;
    })
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Wrap in paragraphs
    .replace(/^(?!<[h1-6]|<pre|<ul|<ol)(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[^>]+>)<\/p>/g, '$1');
}

/**
 * Creates a highlighted version of content by wrapping matching text with HTML tags
 * @param fullContent - The complete content to search within
 * @param searchContent - The content from search results that should be highlighted
 * @returns The full content with highlighted matches as HTML
 */
export function highlightSearchMatches(fullContent: string, searchContent: string): string {
  // Ensure both parameters are strings
  if (!fullContent || typeof fullContent !== 'string') {
    return '';
  }
  
  if (!searchContent || typeof searchContent !== 'string') {
    return simpleMarkdownToHtml(fullContent);
  }

  console.log('[highlightSearchMatches] Starting with:', {
    fullLength: fullContent.length,
    searchLength: searchContent.length
  });

  // Normalize both contents for comparison - remove markdown, HTML and normalize whitespace
  const normalizeForComparison = (text: string) => {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[#*\[\]()]/g, '') // Remove markdown symbols
      .replace(/\|/g, ' ') // Replace table pipes with spaces
      .replace(/\n+/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
  };

  const normalizedSearchContent = normalizeForComparison(searchContent);
  const normalizedFullContent = normalizeForComparison(fullContent);
  
  console.log('[highlightSearchMatches] Normalized search (first 200 chars):', normalizedSearchContent.substring(0, 200));
  
  let highlightedContent = fullContent;
  let highlightCount = 0;

  // Extract meaningful phrases (3+ words) from search content
  const phrases: string[] = [];
  const words = normalizedSearchContent.split(/\s+/);
  
  // Create overlapping 3-5 word phrases for better matching
  for (let length = 5; length >= 3; length--) {
    for (let i = 0; i <= words.length - length; i++) {
      const phrase = words.slice(i, i + length).join(' ');
      if (phrase.length > 15) { // Only meaningful phrases
        phrases.push(phrase);
      }
    }
  }
  
  console.log('[highlightSearchMatches] Extracted', phrases.length, 'phrases');
  
  // Try to highlight each phrase
  phrases.forEach(phrase => {
    if (normalizedFullContent.includes(phrase)) {
      console.log('[highlightSearchMatches] Found phrase:', phrase.substring(0, 50));
      
      // Find the actual text in the original content
      const phraseWords = phrase.split(/\s+/);
      const pattern = phraseWords
        .map(word => escapeRegExp(word))
        .join('\\s*\\**\\n*\\s*'); // Allow whitespace, asterisks, line breaks between words
      
      const regex = new RegExp(`(${pattern})`, 'gi');
      const before = highlightedContent;
      highlightedContent = highlightedContent.replace(regex, (match) => {
        // Don't highlight if already highlighted
        if (match.includes('<mark')) return match;
        highlightCount++;
        return `<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-1">${match}</mark>`;
      });
      
      if (before !== highlightedContent) {
        console.log('[highlightSearchMatches] Applied highlight for phrase');
      }
    }
  });

  console.log('[highlightSearchMatches] Total highlights applied:', highlightCount);

  return simpleMarkdownToHtml(highlightedContent);
}

/**
 * Escapes special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds the best matching section within the full content based on search result
 * @param fullContent - The complete content
 * @param searchContent - The content from search results
 * @returns Object with the position and similarity score
 */
export function findBestMatch(fullContent: string, searchContent: string): {
  startIndex: number;
  endIndex: number;
  score: number;
} {
  if (!searchContent || !fullContent || typeof fullContent !== 'string' || typeof searchContent !== 'string') {
    return { startIndex: 0, endIndex: 0, score: 0 };
  }

  const cleanSearchContent = searchContent
    .replace(/[#*\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  const words = cleanSearchContent.split(/\s+/).filter(word => word.length > 2);
  let bestMatch = { startIndex: 0, endIndex: 0, score: 0 };

  // Try to find the section with the most matching words
  const contentWords = fullContent.split(/\s+/);
  
  for (let i = 0; i < contentWords.length - words.length; i++) {
    const section = contentWords.slice(i, i + words.length * 2).join(' ');
    const score = calculateSimilarity(section.toLowerCase(), cleanSearchContent.toLowerCase());
    
    if (score > bestMatch.score) {
      const startIndex = fullContent.indexOf(contentWords[i]);
      const endSection = contentWords.slice(i, i + words.length * 2).join(' ');
      const endIndex = startIndex + endSection.length;
      
      bestMatch = { startIndex, endIndex, score };
    }
  }

  return bestMatch;
}

/**
 * Calculates similarity between two strings using a simple word matching approach
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  const matches = words1.filter(word => 
    words2.some(w2 => w2.includes(word) || word.includes(w2))
  ).length;
  
  return matches / Math.max(words1.length, words2.length);
}