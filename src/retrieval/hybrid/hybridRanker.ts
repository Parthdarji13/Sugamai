import { EmbeddedChunk } from '../embeddings/types';
import { MatchResult } from '../queryMatcher';
import { SectionType } from '../chunking/types';
import {
  HybridRankingWeights,
  HybridScoredChunk,
} from './types';

export const DEFAULT_RANKING_WEIGHTS: HybridRankingWeights = {
  vectorWeight: 0.65,
  lexicalWeight: 0.25,
  intentWeight: 0.10,
};

/**
 * Multilingual intent keywords mapped to semantic section categories.
 */
const INTENT_KEYWORD_PATTERNS: Record<SectionType, string[]> = {
  eligibility: [
    'eligib', 'eligible', 'who can', 'criteria', 'qualification', 'age limit',
    'paatra', 'paatrata', 'kaun', 'kon', 'पात्रता', 'पात्र', 'कौन पात्र', 'પાત્રતા', 'પાત્ર', 'કોણ પાત્ર'
  ],
  documents: [
    'document', 'documents', 'paper', 'papers', 'proof', 'certificate', 'id', 'card',
    'kagaz', 'kaagaz', 'praman', 'दस्तावेज', 'कागज', 'कागजात', 'પ્રમાણપત્ર', 'કાગળ', 'કાગળો', 'દસ્તાવેજો'
  ],
  benefits: [
    'benefit', 'benefits', 'coverage', 'amount', 'rs', 'lakh', 'money', 'financial', 'installment', 'kist', 'paisa',
    'fayda', 'labh', 'लाभ', 'फायदा', 'राशि', 'किस्त', 'रुपये', 'પૈસા', 'લાભ', 'હપ્તો', 'સહાય'
  ],
  application: [
    'apply', 'application', 'how to apply', 'process', 'procedure', 'form', 'portal', 'online', 'offline', 'registration',
    'kaise kare', 'kaise banaye', 'आवेदन', 'प्रक्रिया', 'पंजीकरण', 'કેવી રીતે', 'અરજી', 'નોંધણી'
  ],
  validity: [
    'validity', 'valid', 'expiry', 'duration', 'years', 'time', 'how long', 'period',
    'kab tak', 'myaad', 'अवधि', 'वैधता', 'कब तक', 'માન્યતા', 'સમયગાળો'
  ],
  status: [
    'status', 'check status', 'track', 'application status', 'installment status',
    'stithi', 'स्थिति', 'ट्रैक', 'સ્થિતિ', 'તપાસ'
  ],
  exclusions: [
    'exclusion', 'exclusions', 'not eligible', 'ineligible', 'who cannot', 'disqualified',
    'apratra', 'अप्रात्र', 'અપાત્ર', 'નથી'
  ],
  overview: [
    'what is', 'overview', 'about', 'scheme details', 'introduction',
    'kya hai', 'shu che', 'क्या है', 'વિશે', 'શું છે'
  ],
  verification: [
    'verification', 'verify', 'inspection', 'officer', 'inquiry',
    'satyaapan', 'सत्यापन', 'તપાસ', 'ચકાસણી'
  ],
  other: []
};

/**
 * Computes normalized intent alignment score [0.0 - 1.0] for a query and a section type.
 */
export function computeIntentAlignmentScore(query: string, sectionType: SectionType): number {
  const qLower = query.toLowerCase();
  const patterns = INTENT_KEYWORD_PATTERNS[sectionType] || [];

  for (const pattern of patterns) {
    if (qLower.includes(pattern)) {
      return 1.0;
    }
  }

  return 0.0;
}

/**
 * Computes normalized lexical score [0.0 - 1.0] for a chunk given the lexical match result.
 */
export function computeLexicalScore(chunk: EmbeddedChunk, lexicalMatch: MatchResult): number {
  if (!lexicalMatch.source || chunk.documentId !== lexicalMatch.source.id) {
    return 0.0;
  }

  // Full score for explicit alias match
  if (lexicalMatch.isExplicitAliasMatch) {
    return 1.0;
  }

  // High score for strong lexical/intent match (score >= 10)
  if (lexicalMatch.score >= 10) {
    return 0.85;
  }

  // Medium score for fuzzy or partial match (score >= 6)
  if (lexicalMatch.score >= 6) {
    return 0.70;
  }

  // Baseline score for single keyword match (score >= 3)
  if (lexicalMatch.score >= 3) {
    return 0.40;
  }

  return 0.0;
}

/**
 * Fuses vector similarity, lexical signals, and section intent into a single hybrid score.
 *
 * Formula:
 * - When lexical match is present:
 *     hybridScore = (w_vec * vectorScore) + (w_lex * lexicalScore) + (w_intent * intentScore)
 * - When no lexical match is present (conceptual / cross-document query):
 *     hybridScore = (w_vec * vectorScore + w_intent * intentScore) / (w_vec + w_intent)
 */
export function rankHybridChunks(
  query: string,
  chunks: Array<{ chunk: EmbeddedChunk; vectorScore: number }>,
  lexicalMatch: MatchResult,
  weights: HybridRankingWeights = DEFAULT_RANKING_WEIGHTS,
  minHybridScore = 0.60,
  topK = 5
): HybridScoredChunk[] {
  const scoredList: HybridScoredChunk[] = [];
  const hasLexicalSource = lexicalMatch.source !== null;

  for (const item of chunks) {
    const { chunk, vectorScore } = item;

    const vecScore = Math.max(0, Math.min(1.0, vectorScore));
    const lexScore = computeLexicalScore(chunk, lexicalMatch);
    const intScore = computeIntentAlignmentScore(query, chunk.sectionType);

    let rawHybrid = 0;
    if (hasLexicalSource) {
      rawHybrid =
        weights.vectorWeight * vecScore +
        weights.lexicalWeight * lexScore +
        weights.intentWeight * intScore;
    } else {
      // Dynamic renormalization when no lexical scheme was identified
      const activeWeightSum = weights.vectorWeight + weights.intentWeight;
      rawHybrid = (weights.vectorWeight * vecScore + weights.intentWeight * intScore) / activeWeightSum;
    }

    const hybridScore = Number(Math.max(0, Math.min(1.0, rawHybrid)).toFixed(4));

    scoredList.push({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      scheme: chunk.scheme,
      section: chunk.section,
      sectionType: chunk.sectionType,
      subSectionLabel: chunk.subSectionLabel,
      language: chunk.language,
      source: chunk.source,
      sourceFile: chunk.sourceFile,
      sourceUrl: chunk.sourceUrl,
      ministry: chunk.ministry,
      chunkIndex: chunk.chunkIndex,
      totalChunksInDoc: chunk.totalChunksInDoc,
      tokenEstimate: chunk.tokenEstimate,
      characterCount: chunk.characterCount,
      content: chunk.content,
      similarityScore: vecScore,
      vectorScore: vecScore,
      lexicalScore: Number(lexScore.toFixed(4)),
      intentScore: Number(intScore.toFixed(4)),
      hybridScore,
      rank: 0,
      sourceType: 'semantic_chunk',
    });
  }

  // Sort descending by hybridScore, breaking ties deterministically by chunkId
  scoredList.sort((a, b) => {
    if (b.hybridScore !== a.hybridScore) {
      return b.hybridScore - a.hybridScore;
    }
    return a.chunkId.localeCompare(b.chunkId);
  });

  // Filter by minimum hybrid score threshold
  const filtered = scoredList.filter(item => item.hybridScore >= minHybridScore);

  // Assign 1-based ranks to Top-K
  const topKMatches = filtered.slice(0, topK).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return topKMatches;
}
