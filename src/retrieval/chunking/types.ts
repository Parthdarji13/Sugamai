export type SectionType =
  | 'overview'
  | 'benefits'
  | 'eligibility'
  | 'exclusions'
  | 'documents'
  | 'application'
  | 'status'
  | 'validity'
  | 'verification'
  | 'other';

export interface DocumentChunk {
  /** Globally unique chunk identifier (e.g. 'pm_kisan_chunk_001') */
  id: string;
  /** 1-based sequential index of this chunk within the parent document */
  chunkIndex: number;
  /** Total number of chunks in this parent document */
  totalChunksInDoc: number;
  /** Canonical government service identifier (e.g. 'pm_kisan') */
  serviceId: string;
  /** Full official display name of the scheme/service */
  serviceName: string;
  /** Source file name in retrieval/sources/ (e.g. 'pm_kisan.txt') */
  sourceFile: string;
  /** Source portal or authority title */
  sourceTitle: string;
  /** Official government portal URL */
  sourceUrl: string;
  /** Ministry or governing department */
  ministry: string;
  /** Normalized semantic section type */
  sectionType: SectionType;
  /** Original section heading from the document */
  sectionTitle: string;
  /** Sub-section or part label if split (e.g. 'Part 1/2' or undefined if single) */
  subSectionLabel?: string;
  /** Verbatim clean text content of the chunk */
  content: string;
  /** Primary language of the document source */
  language: 'en';
  /** Approximate token count */
  tokenEstimate: number;
  /** Character length */
  characterCount: number;
}

export interface ParsedSection {
  sectionTitle: string;
  sectionType: SectionType;
  rawContent: string;
  headerLineNumber: number;
}

export interface ParsedDocument {
  serviceId: string;
  serviceName: string;
  sourceFile: string;
  documentTitle: string;
  officialUrl: string;
  sourceTitle: string;
  ministry: string;
  sections: ParsedSection[];
  originalRawText: string;
}

export interface ChunkingOptions {
  /** Target token count per chunk (default: 180) */
  targetTokens?: number;
  /** Maximum token limit before a section is split (default: 260) */
  maxTokens?: number;
  /** Overlap context in tokens when splitting long sections (default: 30) */
  tokenOverlap?: number;
}

export interface DocumentValidationDetail {
  sourceFile: string;
  serviceId: string;
  originalCharCount: number;
  originalWordCount: number;
  chunkCount: number;
  totalChunkWordCount: number;
  sectionCount: number;
  sectionsFound: string[];
  conservationPassed: boolean;
  missingWords: string[];
}

export interface ChunkValidationReport {
  timestamp: string;
  totalDocuments: number;
  totalChunks: number;
  chunksPerDocument: Record<string, number>;
  sectionTypeCounts: Record<SectionType, number>;
  avgTokensPerChunk: number;
  avgCharsPerChunk: number;
  minChunkTokens: { id: string; tokens: number; serviceId: string; sectionTitle: string };
  maxChunkTokens: { id: string; tokens: number; serviceId: string; sectionTitle: string };
  allTestsPassed: boolean;
  testResults: {
    documentCoverage: { passed: boolean; message: string };
    metadataIntegrity: { passed: boolean; message: string };
    nonEmptyChunks: { passed: boolean; message: string };
    uniqueChunkIds: { passed: boolean; message: string };
    sectionPreservation: { passed: boolean; message: string };
    contentConservation: { passed: boolean; message: string; details: DocumentValidationDetail[] };
  };
}
