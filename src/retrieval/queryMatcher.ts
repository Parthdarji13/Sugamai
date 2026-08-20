import { governmentSources, GovernmentSource } from './governmentSources';

/**
 * Normalizes a text string by converting it to lowercase and removing special characters.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches a user query to a government source based on keyword frequency and weightings.
 * Returns the matched GovernmentSource or null if no source meets the confidence threshold.
 */
export function matchQueryToSource(query: string): GovernmentSource | null {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return null;

  let bestSource: GovernmentSource | null = null;
  let highestScore = 0;

  for (const source of governmentSources) {
    let score = 0;

    // Direct scheme name matches (highest weight)
    if (source.id === 'pm_kisan') {
      if (normalizedQuery.includes('pm kisan') || normalizedQuery.includes('pm-kisan') || normalizedQuery.includes('pmkisan')) {
        score += 15;
      }
    } else if (source.id === 'ayushman_bharat') {
      if (normalizedQuery.includes('ayushman') || normalizedQuery.includes('pmjay') || normalizedQuery.includes('pm-jay') || normalizedQuery.includes('pm jay')) {
        score += 15;
      }
    } else if (source.id === 'income_certificate') {
      if (
        normalizedQuery.includes('income certificate') || 
        normalizedQuery.includes('income cert') || 
        normalizedQuery.includes('आय प्रमाण') || 
        normalizedQuery.includes('આવકનું પ્રમાણ') ||
        normalizedQuery.includes('આવક દાખલો') ||
        normalizedQuery.includes('આવક નો દાખલો')
      ) {
        score += 15;
      }
    }

    // Keyword overlap matching
    for (const keyword of source.keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      // Check if keyword is a separate word or exact substring in the query
      if (normalizedKeyword && normalizedQuery.includes(normalizedKeyword)) {
        // If it's a multi-word keyword (like 'income certificate' or 'pm kisan') and already matched above,
        // give it slightly less weight to avoid double counting, otherwise count it
        score += normalizedKeyword.split(' ').length * 2;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestSource = source;
    }
  }

  // Threshold: at least a score of 2 is required to match (e.g. at least one keyword match)
  const MIN_THRESHOLD = 2;
  return highestScore >= MIN_THRESHOLD ? bestSource : null;
}

const GENERIC_TERMS = [
  // English
  'certificate', 'yojana', 'scheme', 'eligibility', 'eligible', 'apply', 'documents', 'government', 'gov', 'service',
  // Hindi
  'योजना', 'प्रमाण पत्र', 'सर्टिफिकेट', 'पात्रता', 'लागू', 'दस्तावेज', 'सरकारी', 'सेवा', 'अप्लाई',
  // Gujarati
  'યોજના', 'પ્રમાણપત્ર', 'દાખલો', 'પાત્રતા', 'લાગુ', 'દસ્તાવેજો', 'સરકારી', 'સેવા', 'અરજી'
];

/**
 * Checks if the query contains generic government terms.
 */
export function hasGenericGovTerms(query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return GENERIC_TERMS.some(term => normalizedQuery.includes(term));
}
