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

  // Normalize both contents for comparison - remove markdown and normalize whitespace
  const normalizeForComparison = (text: string) => {
    return text
      .replace(/[#*\[\]()]/g, '') // Remove markdown symbols
      .replace(/\n+/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
  };

  const normalizedSearchContent = normalizeForComparison(searchContent);
  const normalizedFullContent = normalizeForComparison(fullContent);
  
  let highlightedContent = fullContent;

  // First try to find the exact search content within the full content
  if (normalizedFullContent.includes(normalizedSearchContent)) {
    // Find the actual position in the original content
    const searchWords = normalizedSearchContent.split(/\s+/);
    
    // Create a more flexible pattern that accounts for line breaks and formatting
    const flexiblePattern = searchWords
      .map(word => escapeRegExp(word))
      .join('\\s*\\n*\\s*'); // Allow whitespace and line breaks between words
    
    const regex = new RegExp(`(${flexiblePattern})`, 'gi');
    highlightedContent = highlightedContent.replace(regex, (match) => {
      return `<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-1">${match}</mark>`;
    });
    
    return simpleMarkdownToHtml(highlightedContent);
  }

  // If exact match doesn't work, try to find larger meaningful chunks
  const sentences = normalizedSearchContent
    .split(/[.!?;]/)
    .map(s => s.trim())
    .filter(s => s.length > 20) // Only longer, meaningful sentences
    .sort((a, b) => b.length - a.length);

  sentences.forEach(sentence => {
    if (sentence.length < 20) return;

    const sentenceWords = sentence.split(/\s+/);
    if (sentenceWords.length < 4) return; // Need at least 4 words for a meaningful phrase

    // Create pattern allowing for line breaks and extra whitespace
    const pattern = sentenceWords
      .map(word => escapeRegExp(word))
      .join('\\s*\\n*\\s*(?:\\w+\\s*\\n*\\s*){0,1}'); // Allow one extra word between
    
    const regex = new RegExp(`(${pattern})`, 'gi');
    if (fullContent.match(regex)) {
      highlightedContent = highlightedContent.replace(regex, (match) => {
        // Don't highlight if already highlighted
        if (!match.includes('<mark')) {
          return `<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-1">${match}</mark>`;
        }
        return match;
      });
    }
  });

  // Only highlight significant individual words if no sentence matches were found
  const hasHighlights = highlightedContent.includes('<mark');
  if (!hasHighlights) {
    const significantWords = normalizedSearchContent
      .split(/\s+/)
      .filter(word => word.length > 6) // Only longer, more specific words
      .filter(word => !/^(the|and|for|are|but|not|you|all|can|her|was|one|our|had|but|day|get|use|man|new|now|way|may|say)$/i.test(word)) // Exclude common words
      .slice(0, 5); // Limit to avoid over-highlighting

    significantWords.forEach(word => {
      const wordRegex = new RegExp(`\\b(${escapeRegExp(word)})\\b`, 'gi');
      highlightedContent = highlightedContent.replace(wordRegex, (match, p1) => {
        // Only highlight if not already highlighted
        if (!match.includes('<mark')) {
          return `<mark class="bg-blue-100 dark:bg-blue-900 rounded px-0.5">${p1}</mark>`;
        }
        return match;
      });
    });
  }

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