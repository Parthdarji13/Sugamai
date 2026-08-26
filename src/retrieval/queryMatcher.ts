import { governmentSources, GovernmentSource } from './governmentSources';

/**
 * Normalizes a text string by converting it to lowercase and removing punctuation/special characters.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein edit distance between two strings.
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[len1][len2];
}

/**
 * Multilingual intent phrase mapping for extra contextual scoring boost (+6).
 */
const INTENT_PHRASES: Record<string, string[]> = {
  pm_kisan: [
    'farmer money', 'paisa kab milega', 'kisan kist', 'farmer installment', 'kheti ka paisa', 'kisan paisa'
  ],
  ayushman_bharat: [
    'health card', '5 lakh treatment', '5 lakh bima', 'hospital card', 'free hospital treatment', 'health insurance for poor'
  ],
  income_certificate: [
    'income certificate documents', 'income proof documents', 'aavak cert', 'saalana aana dakhla'
  ],
  nfsa_ration_card: [
    'ration card documents', 'rashan card kaise banaye', 'free ration', 'bpl card apply', 'free anaj'
  ],
  pm_awas_yojana: [
    'ghar ke liye scheme', 'ghar ke liye government scheme', 'makan ke liye paisa', 'home subsidy', 'ghar yojana'
  ],
  eshram_card: [
    'labour card', 'worker card', 'shramik card', 'majdoor card', 'labour card documents'
  ],
  passport_seva: [
    'passport documents', 'passport renew kaise kare', 'tatkal passport', 'new passport apply'
  ],
  pm_mudra_yojana: [
    'business loan government', 'small business loan', 'dukan ke liye loan', 'shishu loan apply'
  ],
  national_scholarships: [
    'student scholarship', 'post matric scholarship', 'pre matric scholarship', 'padhai ke liye paisa'
  ]
};

const GENERIC_TERMS = new Set([
  // English
  'certificate', 'yojana', 'scheme', 'eligibility', 'eligible', 'apply', 'documents', 'government', 'gov', 'service', 'today', 'weather', 'restaurant', 'poem', 'write',
  // Hindi
  'योजना', 'प्रमाण पत्र', 'सर्टिफिकेट', 'पात्रता', 'लागू', 'दस्तावेज', 'सरकारी', 'सेवा', 'अप्लाई',
  // Gujarati
  'યોજના', 'પ્રમાણપત્ર', 'દાખલો', 'પાત્રતા', 'લાગુ', 'દસ્તાવેજો', 'સરકારી', 'સેવા', 'અરજી'
]);

export interface MatchResult {
  source: GovernmentSource | null;
  score: number;
  isExplicitAliasMatch: boolean;
}

/**
 * Matches a user query to a government source using data-driven aliases,
 * intent phrase boosts, keyword matching, and selective fuzzy edit-distance matching.
 * Returns the source alongside score metadata.
 */
export function matchQueryWithScore(query: string): MatchResult {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return { source: null, score: 0, isExplicitAliasMatch: false };

  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 3 && !GENERIC_TERMS.has(w));

  let bestSource: GovernmentSource | null = null;
  let highestScore = 0;
  let isExplicitAliasMatch = false;

  for (const source of governmentSources) {
    let score = 0;
    let explicitAlias = false;

    // 1. Data-Driven Alias Matching (+15 for exact alias substring match)
    if (source.aliases) {
      for (const alias of source.aliases) {
        const normAlias = normalizeText(alias);
        if (normAlias && normalizedQuery.includes(normAlias)) {
          score += 15;
          explicitAlias = true;
          break; // Avoid multi-counting aliases for the same source
        }
      }
    }

    // 2. Intent Phrase Boost (+6)
    const intents = INTENT_PHRASES[source.id] || [];
    for (const intent of intents) {
      if (normalizedQuery.includes(intent)) {
        score += 6;
        break;
      }
    }

    // 3. Keyword Matching (+2 per word)
    for (const keyword of source.keywords) {
      const normKeyword = normalizeText(keyword);
      if (!normKeyword) continue;
      
      // For short single-word keywords (<= 4 chars), require exact word boundary to prevent substring false positives
      if (normKeyword.length <= 4) {
        const regex = new RegExp(`\\b${normKeyword}\\b`, 'i');
        if (regex.test(normalizedQuery)) {
          score += 2;
        }
      } else if (normalizedQuery.includes(normKeyword)) {
        score += normKeyword.split(' ').length * 2;
      }
    }

    // 4. Selective Fuzzy Matching (run only if exact alias score < 10)
    if (score < 10 && queryWords.length > 0 && source.aliases) {
      let fuzzyMatchFound = false;
      for (const queryWord of queryWords) {
        for (const alias of source.aliases) {
          const aliasWords = normalizeText(alias).split(' ').filter(w => w.length > 4);
          for (const aliasWord of aliasWords) {
            // Check Levenshtein distance for words > 4 characters
            if (Math.abs(queryWord.length - aliasWord.length) <= 1) {
              const distance = levenshteinDistance(queryWord, aliasWord);
              if (distance <= 1) {
                score += 8; // Medium fuzzy match bonus
                fuzzyMatchFound = true;
                break;
              }
            }
          }
          if (fuzzyMatchFound) break;
        }
        if (fuzzyMatchFound) break;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestSource = source;
      isExplicitAliasMatch = explicitAlias;
    }
  }

  // Threshold: at least a score of 3 is required to guarantee match confidence
  const MIN_THRESHOLD = 3;
  return {
    source: highestScore >= MIN_THRESHOLD ? bestSource : null,
    score: highestScore,
    isExplicitAliasMatch
  };
}

export function matchQueryToSource(query: string): GovernmentSource | null {
  return matchQueryWithScore(query).source;
}

/**
 * Checks if the query contains generic government terms.
 */
export function hasGenericGovTerms(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return Array.from(GENERIC_TERMS).some(term => normalizedQuery.includes(term));
}
