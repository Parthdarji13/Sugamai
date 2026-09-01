import { SectionType } from '../chunking/types';

/**
 * A scored and ranked document chunk returned by vector similarity retrieval.
 */
export interface ScoredChunk {
  /** Globally unique chunk identifier (e.g. 'pm_kisan_chunk_001') */
  chunkId: string;
  /** Canonical service/scheme identifier (e.g. 'pm_kisan') */
  documentId: string;
  /** Full official scheme/service display name */
  scheme: string;
  /** Original section title from official source */
  section: string;
  /** Normalized semantic section type */
  sectionType: SectionType;
  /** Sub-section/part label if partitioned */
  subSectionLabel?: string;
  /** Language of source chunk */
  language: string;
  /** Source authority or portal title */
  source: string;
  /** Source filename in retrieval/sources/ */
  sourceFile: string;
  /** Official government URL */
  sourceUrl: string;
  /** Ministry or governing department */
  ministry: string;
  /** 1-based sequential index of this chunk within parent document */
  chunkIndex: number;
  /** Total number of chunks in parent document */
  totalChunksInDoc: number;
  /** Approximate token count */
  tokenEstimate: number;
  /** Character count */
  characterCount: number;
  /** Clean text content of the chunk */
  content: string;
  /** Cosine similarity score between query and chunk embedding [0.0 - 1.0] */
  similarityScore: number;
  /** 1-based ranking in the current retrieval result set */
  rank: number;
}

/**
 * Configuration options for vector similarity retrieval.
 */
export interface VectorRetrievalOptions {
  /** Number of top relevant chunks to return (default: 5) */
  topK?: number;
  /** Minimum cosine similarity threshold required to include a chunk (default: 0.60) */
  minRelevanceScore?: number;
  /** Embedding model identifier (default: 'models/gemini-embedding-001') */
  embeddingModel?: string;
  /** Optional custom API key */
  apiKey?: string;
  /** Optional custom path to document_embeddings.json */
  customArtifactPath?: string;
  /** Optional filter to restrict search to a specific document/service ID */
  filterDocumentId?: string;
  /** Optional filter to restrict search to specific section types */
  filterSectionTypes?: SectionType[];
}

/**
 * Complete structured result from a vector retrieval query.
 */
export interface VectorRetrievalResult {
  /** Original citizen query text */
  query: string;
  /** Embedding vector dimensions (e.g. 3072) */
  queryEmbeddingDimensions: number;
  /** Total number of embedded chunks evaluated */
  totalChunksSearched: number;
  /** Configured Top-K limit */
  topK: number;
  /** Configured minimum relevance threshold */
  minRelevanceScore: number;
  /** Granular latency measurements */
  latencyMs: {
    queryEmbeddingMs: number;
    similaritySearchMs: number;
    totalMs: number;
  };
  /** Filtered and ranked matching chunks */
  matches: ScoredChunk[];
  /** Highest similarity score observed before threshold filtering */
  topScoreObserved: number;
  /** Top-1 scored chunk before threshold filtering (for threshold analysis) */
  topCandidate?: {
    chunkId: string;
    scheme: string;
    section: string;
    score: number;
  };
  /** Whether any candidate passed the minimum relevance threshold */
  hasSufficientRelevance: boolean;
}

/**
 * Result of a single semantic test case.
 */
export interface SemanticTestCaseResult {
  testId: string;
  label: string;
  query: string;
  expectedScheme: string;
  expectedSection?: string;
  topMatch?: ScoredChunk;
  topScore: number;
  passedThreshold: boolean;
  isCorrectScheme: boolean;
  isCorrectSection?: boolean;
  passed: boolean;
  notes?: string;
}
