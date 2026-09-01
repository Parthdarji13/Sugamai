import { EmbeddedChunk } from '../embeddings/types';
import { governmentSources, GovernmentSource } from '../governmentSources';
import { matchQueryWithScore, MatchResult } from '../queryMatcher';
import {
  retrieveOfficialInfo,
  isPlausibleFollowUp,
  isFreshnessSensitiveQuery,
} from '../sourceManager';
import { getOrLoadEmbeddings } from '../vector/vectorRetriever';
import { embedQuery } from '../vector/queryEmbedder';
import { cosineSimilarity } from '../vector/similarity';
import {
  rankHybridChunks,
  DEFAULT_RANKING_WEIGHTS,
} from './hybridRanker';
import {
  HybridRankingWeights,
  HybridRetrievalOptions,
  HybridRetrievalResult,
  HybridScoredChunk,
} from './types';

const DEFAULT_TOP_K = 5;
const DEFAULT_MIN_HYBRID_SCORE = 0.60;

/**
 * Determines whether a query is continuing an existing scheme context or switching to a new one.
 */
export function determineContextAction(
  query: string,
  lastMatchedSourceId?: string
): { action: 'FOLLOW_UP' | 'NEW_CONTEXT'; targetSourceId?: string } {
  if (!lastMatchedSourceId) {
    return { action: 'NEW_CONTEXT' };
  }

  const lexicalMatch = matchQueryWithScore(query);

  // If explicit alias match for another scheme, switch context
  if (
    lexicalMatch.isExplicitAliasMatch &&
    lexicalMatch.source &&
    lexicalMatch.source.id !== lastMatchedSourceId
  ) {
    return { action: 'NEW_CONTEXT', targetSourceId: lexicalMatch.source.id };
  }

  // If query is a follow-up or generic inquiry, retain parent scheme context
  if (isPlausibleFollowUp(query)) {
    if (!lexicalMatch.source || lexicalMatch.score < 10) {
      return { action: 'FOLLOW_UP', targetSourceId: lastMatchedSourceId };
    }
  }

  return { action: 'NEW_CONTEXT', targetSourceId: lexicalMatch.source?.id };
}

/**
 * Executes unified Hybrid Retrieval combining lexical, vector, and live official signals.
 */
export async function retrieveHybridOfficialInfo(
  query: string,
  lastMatchedSourceId?: string,
  options: HybridRetrievalOptions = {}
): Promise<HybridRetrievalResult> {
  const totalStart = performance.now();
  const topK = options.topK !== undefined ? options.topK : DEFAULT_TOP_K;
  const minHybridScore =
    options.minHybridScore !== undefined ? options.minHybridScore : DEFAULT_MIN_HYBRID_SCORE;
  const rankingWeights: HybridRankingWeights = {
    ...DEFAULT_RANKING_WEIGHTS,
    ...options.rankingWeights,
  };

  // ----------------------------------------------------------------
  // STEP 1: Context Determination & Lexical Matching
  // ----------------------------------------------------------------
  const lexStart = performance.now();
  const contextAction = determineContextAction(query, lastMatchedSourceId);

  let lexicalMatch: MatchResult = { source: null, score: 0, isExplicitAliasMatch: false };
  if (contextAction.action === 'FOLLOW_UP' && lastMatchedSourceId) {
    const parentSource = governmentSources.find(s => s.id === lastMatchedSourceId);
    if (parentSource) {
      lexicalMatch = { source: parentSource, score: 15, isExplicitAliasMatch: true };
    }
  } else {
    lexicalMatch = matchQueryWithScore(query);
  }
  const lexEnd = performance.now();

  // ----------------------------------------------------------------
  // STEP 2: Vector Retrieval & Cosine Similarity
  // ----------------------------------------------------------------
  const vecStart = performance.now();
  let queryVector: number[] = [];
  let vectorCandidates: Array<{ chunk: EmbeddedChunk; vectorScore: number }> = [];

  try {
    const index = await getOrLoadEmbeddings();
    queryVector = await embedQuery(query, {
      apiKey: options.apiKey,
      modelName: options.embeddingModel,
    });

    vectorCandidates = index.chunks.map(chunk => ({
      chunk,
      vectorScore: cosineSimilarity(queryVector, chunk.embedding),
    }));
  } catch (err) {
    console.warn(
      `[HYBRID RETRIEVAL] Vector embedding failed: ${(err as Error).message}. Continuing with lexical fallback.`
    );
  }
  const vecEnd = performance.now();

  // ----------------------------------------------------------------
  // STEP 3: Hybrid Fusion Ranking
  // ----------------------------------------------------------------
  const rankStart = performance.now();
  const hybridMatches: HybridScoredChunk[] =
    vectorCandidates.length > 0
      ? rankHybridChunks(
          query,
          vectorCandidates,
          lexicalMatch,
          rankingWeights,
          minHybridScore,
          topK
        )
      : [];
  const rankEnd = performance.now();

  // ----------------------------------------------------------------
  // STEP 4: Scheme Resolution (Lexical > High-Confidence Semantic Concept)
  // ----------------------------------------------------------------
  let resolvedSource: GovernmentSource | null = lexicalMatch.source;
  let isConceptualMatch = false;

  // If lexical match didn't find a scheme, check if top vector chunk has high semantic confidence (>= 0.65)
  if (!resolvedSource && hybridMatches.length > 0) {
    const topMatch = hybridMatches[0];
    if (topMatch.similarityScore >= 0.65) {
      const discovered = governmentSources.find(s => s.id === topMatch.documentId);
      if (discovered) {
        resolvedSource = discovered;
        isConceptualMatch = true;
        console.log(
          `[HYBRID RETRIEVAL] Conceptually resolved scheme: ${discovered.name} (Vector Score: ${topMatch.similarityScore})`
        );
      }
    }
  }

  // If no source was resolved and no hybrid matches passed threshold -> Unmatched Query
  if (!resolvedSource && hybridMatches.length === 0) {
    const totalEnd = performance.now();
    return {
      matched: false,
      sourceTitle: 'Government of India Services Portal',
      sourceUrl: 'https://services.india.gov.in',
      retrievalMethod: 'unmatched_default',
      primaryContent: '',
      semanticSupportingChunks: [],
      combinedPromptContext: '',
      resolvedSource: null,
      isFreshnessQuery: false,
      freshDataAvailable: false,
      hasRelevantContext: false,
      isConceptualMatch: false,
      latencyMs: {
        lexicalMs: Number((lexEnd - lexStart).toFixed(2)),
        vectorMs: Number((vecEnd - vecStart).toFixed(2)),
        hybridRankMs: Number((rankEnd - rankStart).toFixed(2)),
        liveFetchMs: 0,
        totalMs: Number((totalEnd - totalStart).toFixed(2)),
      },
    };
  }

  // ----------------------------------------------------------------
  // STEP 5: Official Retrieval & Freshness Handling (Live Fetch / Cache Fallback)
  // ----------------------------------------------------------------
  const liveStart = performance.now();
  const isFreshness = isFreshnessSensitiveQuery(query);

  // Execute official retrieval using existing verified pipeline
  const officialRes = await retrieveOfficialInfo(
    query,
    resolvedSource ? resolvedSource.id : undefined
  );
  const liveEnd = performance.now();

  // ----------------------------------------------------------------
  // STEP 6: Context Assembly for Gemini Prompt
  // ----------------------------------------------------------------
  const relevantSupportingChunks = hybridMatches;

  let combinedPromptContext = '';

  if (isFreshness && officialRes.freshDataAvailable) {
    // Priority 1: Fresh live announcements at top
    combinedPromptContext += `LIVE OFFICIAL ANNOUNCEMENTS & UPDATES:\n${officialRes.content}\n\n`;

    if (relevantSupportingChunks.length > 0) {
      combinedPromptContext += `VERIFIED BASELINE GUIDELINES (SUPPORTING POLICY):\n`;
      for (const chunk of relevantSupportingChunks.slice(0, 3)) {
        combinedPromptContext += `### [${chunk.scheme} - ${chunk.section}]\n${chunk.content}\n\n`;
      }
    }
  } else if (isFreshness && !officialRes.freshDataAvailable) {
    // Unverified freshness query: provide baseline guidelines but explicitly instruct Gemini not to claim as latest
    combinedPromptContext += `VERIFIED BASELINE GUIDELINES (NOTE: No new live update announced today):\n${officialRes.content}\n\n`;

    if (relevantSupportingChunks.length > 0) {
      for (const chunk of relevantSupportingChunks.slice(0, 3)) {
        combinedPromptContext += `### [${chunk.scheme} - ${chunk.section}]\n${chunk.content}\n\n`;
      }
    }
  } else {
    // Standard informational query: Combine verified official guidelines with top semantic supporting chunks
    combinedPromptContext += `VERIFIED OFFICIAL GUIDELINES:\n${officialRes.content}\n\n`;

    if (relevantSupportingChunks.length > 0) {
      combinedPromptContext += `RELEVANT SUPPORTING SECTIONS:\n`;
      for (const chunk of relevantSupportingChunks.slice(0, 3)) {
        // Avoid duplicating if chunk text is already identical to primary content
        if (!officialRes.content.includes(chunk.content.slice(0, 50))) {
          combinedPromptContext += `### [${chunk.scheme} - ${chunk.section}]\n${chunk.content}\n\n`;
        }
      }
    }
  }

  const totalEnd = performance.now();

  return {
    matched: true,
    serviceId: resolvedSource ? resolvedSource.id : officialRes.serviceId,
    serviceName: resolvedSource ? resolvedSource.name : officialRes.serviceName,
    sourceTitle: officialRes.sourceTitle,
    sourceUrl: officialRes.sourceUrl,
    retrievalMethod: isConceptualMatch ? 'semantic_hybrid_rag' : officialRes.retrievalMethod,
    primaryContent: officialRes.content,
    semanticSupportingChunks: relevantSupportingChunks,
    combinedPromptContext: combinedPromptContext.trim(),
    resolvedSource,
    isFreshnessQuery: officialRes.isFreshnessQuery,
    freshDataAvailable: officialRes.freshDataAvailable,
    hasRelevantContext: officialRes.hasRelevantContext,
    isConceptualMatch,
    latencyMs: {
      lexicalMs: Number((lexEnd - lexStart).toFixed(2)),
      vectorMs: Number((vecEnd - vecStart).toFixed(2)),
      hybridRankMs: Number((rankEnd - rankStart).toFixed(2)),
      liveFetchMs: Number((liveEnd - liveStart).toFixed(2)),
      totalMs: Number((totalEnd - totalStart).toFixed(2)),
    },
  };
}
