/**
 * Simple stop words list in English, Hindi, and Gujarati to filter out before matching.
 */
const STOP_WORDS = new Set([
  // English
  'what', 'is', 'for', 'are', 'the', 'and', 'to', 'in', 'of', 'how', 'can', 'i', 'you', 'we', 'they', 'he', 'she', 'it', 'on', 'at', 'by', 'from', 'with', 'about', 'whom', 'who', 'eligible', 'eligibility',
  // Hindi
  'क्या', 'है', 'हैं', 'के', 'लिए', 'का', 'की', 'को', 'में', 'से', 'पर', 'और', 'या', 'हो', 'सकता', 'कैसे', 'कौन', 'पात्रता',
  // Gujarati
  'શું', 'છે', 'માટે', 'ના', 'ની', 'નું', 'ને', 'માં', 'થી', 'અને', 'અથવા', 'કેવી', 'રીતે', 'કોણ', 'પાત્રતા'
]);

/**
 * Tokenizes text into a set of words, converting to lowercase and removing punctuation.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

/**
 * Ranks and extracts the most relevant paragraphs from the official source text
 * based on overlap with the query tokens.
 */
export function extractRelevantContent(fullText: string, query: string, maxParagraphs: number = 3): string {
  // Normalize query and extract search terms (ignoring stop words)
  const queryTokens = tokenize(query);
  const searchTerms = queryTokens.filter(token => !STOP_WORDS.has(token));
  
  if (searchTerms.length === 0) {
    // If no specific terms left, default to using the raw tokens
    searchTerms.push(...queryTokens);
  }

  // Split full text into paragraphs
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length <= maxParagraphs) {
    return fullText; // Return the entire text if it is already very short
  }

  // Score paragraphs based on term matches
  const scoredParagraphs = paragraphs.map((paragraph, index) => {
    let score = 0;
    const paragraphTextLower = paragraph.toLowerCase();
    
    // Exact phrase match gets a big bonus
    const phrase = searchTerms.join(' ');
    if (phrase.length > 3 && paragraphTextLower.includes(phrase)) {
      score += 10;
    }

    for (const term of searchTerms) {
      if (paragraphTextLower.includes(term)) {
        score += 2;
        // Check for word boundary to increase score for exact word matches
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        if (regex.test(paragraphTextLower)) {
          score += 2;
        }
      }
    }

    // Give a small boost to earlier paragraphs (often summaries/general eligibility)
    const positionBoost = Math.max(0, 1.0 - (index * 0.15));
    score += positionBoost;

    return { paragraph, score, index };
  });

  // Sort by score descending, then by original index to preserve reading order for top matches
  const selected = scoredParagraphs
    .filter(item => item.score > 0.5) // Minimum score threshold to exclude completely irrelevant parts
    .sort((a, b) => b.score - a.score)
    .slice(0, maxParagraphs)
    .sort((a, b) => a.index - b.index) // Restore original order
    .map(item => item.paragraph);

  if (selected.length === 0) {
    // If no paragraph matched, return the first 2 paragraphs as a default fallback
    return paragraphs.slice(0, 2).join('\n\n');
  }

  return selected.join('\n\n');
}
