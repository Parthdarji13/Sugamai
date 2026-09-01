import { SectionType } from '../chunking/types';

/**
 * An individual document chunk with its dense vector embedding and preserved metadata.
 */
export interface EmbeddedChunk {
  /** Globally unique chunk identifier (e.g. 'pm_kisan_chunk_001') */
  chunkId: string;
  /** Canonical service/scheme identifier (e.g. 'pm_kisan') */
  documentId: string;
  /** Full official scheme/service name */
  scheme: string;
  /** Original section title from official guidelines */
  section: string;
  /** Normalized semantic section category */
  sectionType: SectionType;
  /** Sub-section/part label if long section was divided */
  subSectionLabel?: string;
  /** Language of the document chunk */
  language: string;
  /** Official authority/portal name */
  source: string;
  /** Source file name in retrieval/sources/ */
  sourceFile: string;
  /** Official government portal URL */
  sourceUrl: string;
  /** Ministry or governing department */
  ministry: string;
  /** 1-based sequential index of this chunk within the parent document */
  chunkIndex: number;
  /** Total number of chunks in parent document */
  totalChunksInDoc: number;
  /** Approximate token count */
  tokenEstimate: number;
  /** Character length */
  characterCount: number;
  /** Clean text content of the chunk preserved verbatim */
  content: string;
  /** Dense vector embedding values */
  embedding: number[];
  /** Model identifier used to produce embedding (e.g. 'models/gemini-embedding-001') */
  embeddingModel: string;
  /** Vector dimensionality (e.g. 3072) */
  embeddingDimensions: number;
}

/**
 * Structured schema for the generated local embeddings index artifact.
 */
export interface EmbeddingsIndexFile {
  version: string;
  generatedAt: string;
  embeddingModel: string;
  embeddingDimensions: number;
  totalChunks: number;
  documentsCount: number;
  serviceIds: string[];
  chunks: EmbeddedChunk[];
}

/**
 * Options for embedding generation.
 */
export interface EmbeddingGenerationOptions {
  batchSize?: number;
  modelName?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  apiKey?: string;
}

/**
 * Cross-lingual validation result for a query against an English document chunk.
 */
export interface CrossLingualPairResult {
  docChunkId: string;
  docScheme: string;
  docSection: string;
  queryText: string;
  queryLanguage: 'en' | 'hi' | 'gu';
  cosineSimilarity: number;
  passed: boolean;
}

/**
 * Full validation report for the embedding pipeline.
 */
export interface EmbeddingValidationReport {
  timestamp: string;
  embeddingModel: string;
  embeddingDimensions: number;
  totalChunks: number;
  embeddedChunks: number;
  failedChunks: number;
  artifactPath: string;
  artifactSizeBytes: number;
  artifactSizeFormatted: string;
  metadataValidationPassed: boolean;
  contentConservationPassed: boolean;
  vectorHealthPassed: boolean;
  repeatabilityPassed: boolean;
  crossLingualValidation: {
    passed: boolean;
    results: CrossLingualPairResult[];
  };
  allPassed: boolean;
}
