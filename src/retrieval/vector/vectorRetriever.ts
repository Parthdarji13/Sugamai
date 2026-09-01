import { EmbeddedChunk, EmbeddingsIndexFile } from '../embeddings/types';
import { loadStoredEmbeddings } from '../embeddings/embeddingStorage';
import { cosineSimilarity } from './similarity';
import { embedQuery } from './queryEmbedder';
import {
  ScoredChunk,
  VectorRetrievalOptions,
  VectorRetrievalResult,
} from './types';

export const DEFAULT_TOP_K = 5;
export const DEFAULT_MIN_RELEVANCE_SCORE = 0.60;

// Module-level in-memory cache for loaded embeddings index
let cachedIndex: EmbeddingsIndexFile | null = null;

/**
 * Clears the in-memory cache of embedded chunks.
 */
export function clearCachedEmbeddings(): void {
  cachedIndex = null;
}

/**
 * Loads the embeddings index, caching in memory for sub-millisecond retrieval.
 */
export async function getOrLoadEmbeddings(
  customPath?: string
): Promise<EmbeddingsIndexFile> {
  if (cachedIndex && !customPath) {
    return cachedIndex;
  }

  const loaded = await loadStoredEmbeddings(customPath);
  if (!customPath) {
    cachedIndex = loaded;
  }
  return loaded;
}

/**
 * Core vector search algorithm: computes cosine similarity against stored chunks,
 * tracks highest observed scores, applies relevance threshold filtering, and returns Top-K.
 */
export function searchSimilarChunks(
  queryVector: number[],
  chunks: EmbeddedChunk[],
  options: VectorRetrievalOptions = {}
): {
  matches: ScoredChunk[];
  topScoreObserved: number;
  topCandidate?: {
    chunkId: string;
    scheme: string;
    section: string;
    score: number;
  };
} {
  const topK = options.topK !== undefined ? options.topK : DEFAULT_TOP_K;
  const minRelevanceScore =
    options.minRelevanceScore !== undefined
      ? options.minRelevanceScore
      : DEFAULT_MIN_RELEVANCE_SCORE;

  // Filter candidates if documentId or sectionType filters are specified
  let candidates = chunks;
  if (options.filterDocumentId) {
    candidates = candidates.filter(c => c.documentId === options.filterDocumentId);
  }
  if (options.filterSectionTypes && options.filterSectionTypes.length > 0) {
    const secSet = new Set(options.filterSectionTypes);
    candidates = candidates.filter(c => secSet.has(c.sectionType));
  }

  // 1. Calculate cosine similarity for each candidate
  const scored = candidates.map(chunk => {
    const score = cosineSimilarity(queryVector, chunk.embedding);
    return {
      chunk,
      score: Number(score.toFixed(4)),
    };
  });

  // 2. Sort descending by score, breaking ties deterministically by chunkId
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.chunk.chunkId.localeCompare(b.chunk.chunkId);
  });

  const topScoreObserved = scored.length > 0 ? scored[0].score : 0;
  const topCandidate =
    scored.length > 0
      ? {
          chunkId: scored[0].chunk.chunkId,
          scheme: scored[0].chunk.scheme,
          section: scored[0].chunk.section,
          score: scored[0].score,
        }
      : undefined;

  // 3. Filter by minimum relevance threshold
  const filtered = scored.filter(item => item.score >= minRelevanceScore);

  // 4. Slice Top-K and assign 1-based ranks
  const topKItems = filtered.slice(0, topK);
  const matches: ScoredChunk[] = topKItems.map((item, index) => ({
    chunkId: item.chunk.chunkId,
    documentId: item.chunk.documentId,
    scheme: item.chunk.scheme,
    section: item.chunk.section,
    sectionType: item.chunk.sectionType,
    subSectionLabel: item.chunk.subSectionLabel,
    language: item.chunk.language,
    source: item.chunk.source,
    sourceFile: item.chunk.sourceFile,
    sourceUrl: item.chunk.sourceUrl,
    ministry: item.chunk.ministry,
    chunkIndex: item.chunk.chunkIndex,
    totalChunksInDoc: item.chunk.totalChunksInDoc,
    tokenEstimate: item.chunk.tokenEstimate,
    characterCount: item.chunk.characterCount,
    content: item.chunk.content,
    similarityScore: item.score,
    rank: index + 1,
  }));

  return { matches, topScoreObserved, topCandidate };
}

/**
 * End-to-end vector retrieval:
 * 1. Loads embeddings index.
 * 2. Generates dense vector for citizen query.
 * 3. Searches and ranks Top-K chunks passing the relevance threshold.
 * 4. Measures and returns detailed latency breakdowns.
 */
export async function retrieveRelevantChunks(
  query: string,
  options: VectorRetrievalOptions = {}
): Promise<VectorRetrievalResult> {
  const totalStart = performance.now();

  // Step A: Load Index
  const index = await getOrLoadEmbeddings(options.customArtifactPath);

  // Step B: Query Embedding
  const embedStart = performance.now();
  const queryVector = await embedQuery(query, {
    apiKey: options.apiKey,
    modelName: options.embeddingModel,
  });
  const embedEnd = performance.now();

  // Step C: Similarity Search & Ranking
  const searchStart = performance.now();
  const { matches, topScoreObserved, topCandidate } = searchSimilarChunks(
    queryVector,
    index.chunks,
    options
  );
  const searchEnd = performance.now();

  const totalEnd = performance.now();

  const topK = options.topK !== undefined ? options.topK : DEFAULT_TOP_K;
  const minRelevanceScore =
    options.minRelevanceScore !== undefined
      ? options.minRelevanceScore
      : DEFAULT_MIN_RELEVANCE_SCORE;

  return {
    query,
    queryEmbeddingDimensions: queryVector.length,
    totalChunksSearched: index.chunks.length,
    topK,
    minRelevanceScore,
    latencyMs: {
      queryEmbeddingMs: Number((embedEnd - embedStart).toFixed(2)),
      similaritySearchMs: Number((searchEnd - searchStart).toFixed(2)),
      totalMs: Number((totalEnd - totalStart).toFixed(2)),
    },
    matches,
    topScoreObserved,
    topCandidate,
    hasSufficientRelevance: matches.length > 0,
  };
}
