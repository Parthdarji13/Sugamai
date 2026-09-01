import { GovernmentSource } from '../governmentSources';
import { ScoredChunk } from '../vector/types';

/**
 * A hybrid-scored chunk with granular score component breakdowns.
 */
export interface HybridScoredChunk extends ScoredChunk {
  /** Raw cosine similarity score [0.0 - 1.0] */
  vectorScore: number;
  /** Normalized lexical score [0.0 - 1.0] */
  lexicalScore: number;
  /** Normalized intent alignment score [0.0 - 1.0] */
  intentScore: number;
  /** Final fused hybrid score [0.0 - 1.0] */
  hybridScore: number;
  /** Source classification of this chunk */
  sourceType: 'live_official' | 'verified_guideline' | 'semantic_chunk';
}

/**
 * Weights configuration for the hybrid ranking formula.
 * Formula: hybridScore = (w_vec * vectorScore) + (w_lex * lexicalScore) + (w_intent * intentScore)
 * Sum of weights must equal 1.0 for normalized output.
 */
export interface HybridRankingWeights {
  /** Weight assigned to dense vector cosine similarity (default: 0.65) */
  vectorWeight: number;
  /** Weight assigned to lexical/fuzzy alias matching (default: 0.25) */
  lexicalWeight: number;
  /** Weight assigned to query-to-section intent alignment (default: 0.10) */
  intentWeight: number;
}

/**
 * Options for hybrid retrieval.
 */
export interface HybridRetrievalOptions {
  /** Maximum number of semantic chunks to return (default: 5) */
  topK?: number;
  /** Minimum vector cosine similarity required for candidate consideration (default: 0.60) */
  minVectorScore?: number;
  /** Minimum hybrid score required for final inclusion in context (default: 0.60) */
  minHybridScore?: number;
  /** Configurable ranking weights */
  rankingWeights?: Partial<HybridRankingWeights>;
  /** Optional custom API key */
  apiKey?: string;
  /** Optional custom embedding model */
  embeddingModel?: string;
  /** Whether to enable live GET fetching for freshness (default: true) */
  enableLiveFetch?: boolean;
}

/**
 * Consolidated result returned by the Hybrid Retrieval engine.
 */
export interface HybridRetrievalResult {
  /** Whether a supported government service or high-confidence semantic chunk was matched */
  matched: boolean;
  /** Canonical service ID (e.g. 'pm_kisan') */
  serviceId?: string;
  /** Display service name (e.g. 'PM Kisan Samman Nidhi') */
  serviceName?: string;
  /** Official source title / authority name */
  sourceTitle: string;
  /** Official portal URL */
  sourceUrl: string;
  /** Method by which content was retrieved */
  retrievalMethod:
    | 'live_fetch'
    | 'live_fetch_with_cached_context'
    | 'cached_official_fallback'
    | 'semantic_hybrid_rag'
    | 'unmatched_default';
  /** Primary retrieved text (live announcements or verified cached text) */
  primaryContent: string;
  /** Top-K relevant semantic chunks with hybrid score breakdowns */
  semanticSupportingChunks: HybridScoredChunk[];
  /** Complete structured context formatted for Gemini prompt injection */
  combinedPromptContext: string;
  /** Matched official government source metadata object if resolved */
  resolvedSource?: GovernmentSource | null;
  /** Diagnostic flags */
  isFreshnessQuery?: boolean;
  freshDataAvailable?: boolean;
  hasRelevantContext?: boolean;
  isConceptualMatch?: boolean;
  /** Granular latency measurements */
  latencyMs: {
    lexicalMs: number;
    vectorMs: number;
    hybridRankMs: number;
    liveFetchMs: number;
    totalMs: number;
  };
}
