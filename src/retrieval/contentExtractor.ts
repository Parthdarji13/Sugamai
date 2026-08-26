/**
 * Simple stop words list in English, Hindi, and Gujarati to filter out before matching.
 */
const STOP_WORDS = new Set([
  // English
  'what', 'is', 'for', 'are', 'the', 'and', 'to', 'in', 'of', 'how', 'can', 'i', 'you', 'we', 'they', 'he', 'she', 'it', 'on', 'at', 'by', 'from', 'with', 'about', 'whom', 'who', 'any', 'there',
  // Hindi
  'क्या', 'है', 'हैं', 'के', 'लिए', 'का', 'की', 'को', 'में', 'से', 'पर', 'और', 'या', 'हो', 'सकता', 'कैसे', 'कौन', 'कोई',
  // Gujarati
  'શું', 'છે', 'માટે', 'ના', 'ની', 'નું', 'ને', 'માં', 'થી', 'અને', 'અથવા', 'કેવી', 'રીતે', 'કોણ', 'કોઈ'
]);

/**
 * Common scheme names/noise words that should not overshadow specific topic words.
 */
const SCHEME_NAME_WORDS = new Set([
  'ayushman', 'bharat', 'pmjay', 'pm-jay', 'kisan', 'yojana', 'scheme', 'samman', 'nidhi'
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
 * Stem helper to normalize variants (e.g. eligible/eligibility, document/documents).
 */
function getStem(word: string): string {
  const w = word.toLowerCase();
  if (w.startsWith('eligib')) return 'eligib';
  if (w.startsWith('benefit')) return 'benefit';
  if (w.startsWith('document')) return 'document';
  if (w.startsWith('appl')) return 'appl';
  if (w.startsWith('hospit')) return 'hospit';
  if (w.startsWith('deadlin')) return 'deadlin';
  if (w.startsWith('valid')) return 'valid';
  if (w.startsWith('install')) return 'install';
  if (w.startsWith('senio')) return 'senior';
  return w;
}

/**
 * Verifies whether the cached official guideline or retrieved context actually contains
 * relevant information for the user's query topic/keywords.
 */
export function hasRelevantVerifiedContext(query: string, contextText: string): boolean {
  if (!contextText || contextText.trim().length === 0) return false;

  const q = query.toLowerCase();
  const contextLower = contextText.toLowerCase();

  // Clean query tokens
  const queryTokens = tokenize(query).filter(w => !STOP_WORDS.has(w));
  if (queryTokens.length === 0) return true;

  // Topic category dictionary
  const topicTerms: Record<string, string[]> = {
    documents: ['document', 'documents', 'proof', 'aadhaar', 'ration', 'id', 'card', 'दस्तावेज', 'દસ્તાવેજ'],
    eligibility: ['eligible', 'eligibility', 'criteria', 'who', 'income', 'limit', 'rural', 'urban', 'secc', 'category', 'पात्रता', 'पात्र', 'પાત્રતા'],
    benefits: ['benefit', 'benefits', 'cover', 'lakh', 'money', 'cashless', 'hospital', 'treatment', 'लाभ', 'ફાયદા'],
    application: ['apply', 'application', 'how to', 'register', 'registration', 'portal', 'csc', 'download', 'आवेदन', 'અરજી'],
    deadline: ['last date', 'deadline', 'validity', 'reset', 'closing', 'તારીખ', 'अंतिम तिथि'],
    age: ['age', 'senior', 'year', 'years', '70', 'gender', 'उम्र', 'आयु', 'ઉંમર']
  };

  // If query targets a specific topic category, verify the context contains terms from that topic
  for (const [, terms] of Object.entries(topicTerms)) {
    const queryHasTopic = terms.some(t => q.includes(t));
    if (queryHasTopic) {
      const contextHasTopic = terms.some(t => contextLower.includes(t));
      if (contextHasTopic) return true;
    }
  }

  // Check stem overlap
  const contextStems = new Set(tokenize(contextText).map(getStem));
  const queryStems = queryTokens.map(getStem);
  const matchCount = queryStems.filter(stem => contextStems.has(stem)).length;

  return matchCount > 0;
}

/**
 * Ranks and extracts the most relevant paragraphs from the official source text
 * based on overlap with the query tokens.
 */
export function extractRelevantContent(fullText: string, query: string, maxParagraphs: number = 6): string {
  // If the document is already compact and complete (under 8KB), return the full verified guideline
  if (fullText.length <= 8000) {
    return fullText;
  }

  // Normalize query and extract search terms (ignoring stop words)
  const queryTokens = tokenize(query);
  const searchTerms = queryTokens.filter(token => !STOP_WORDS.has(token));
  
  if (searchTerms.length === 0) {
    searchTerms.push(...queryTokens);
  }

  // Split full text into paragraphs
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length <= maxParagraphs) {
    return fullText;
  }

  // Score paragraphs based on term matches
  const scoredParagraphs = paragraphs.map((paragraph, index) => {
    let score = 0;
    const paragraphTextLower = paragraph.toLowerCase();
    const pTokens = tokenize(paragraphTextLower);
    const pStems = new Set(pTokens.map(getStem));
    
    // Exact phrase match gets a big bonus
    const phrase = searchTerms.join(' ');
    if (phrase.length > 3 && paragraphTextLower.includes(phrase)) {
      score += 12;
    }

    for (const term of searchTerms) {
      const isSchemeWord = SCHEME_NAME_WORDS.has(term.toLowerCase());
      const weight = isSchemeWord ? 1 : 4; // Higher weight for topic words (documents, eligibility, benefits, etc.)

      if (paragraphTextLower.includes(term)) {
        score += weight * 2;
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        if (regex.test(paragraphTextLower)) {
          score += weight * 2;
        }
      } else if (pStems.has(getStem(term))) {
        score += weight * 1.5;
      }
    }

    // Give a small boost to earlier paragraphs (summaries)
    const positionBoost = Math.max(0, 0.5 - (index * 0.05));
    score += positionBoost;

    return { paragraph, score, index };
  });

  // Sort by score descending, then by original index to preserve reading order
  const selected = scoredParagraphs
    .filter(item => item.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxParagraphs)
    .sort((a, b) => a.index - b.index)
    .map(item => item.paragraph);

  if (selected.length === 0) {
    return paragraphs.slice(0, maxParagraphs).join('\n\n');
  }

  return selected.join('\n\n');
}
