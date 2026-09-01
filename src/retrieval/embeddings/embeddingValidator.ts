import { GoogleGenerativeAI } from '@google/generative-ai';
import { chunkAllGovernmentSources } from '../chunking/documentChunker';
import { resolveGeminiApiKey, sleep } from './embeddingGenerator';
import { getStoredEmbeddingsStats } from './embeddingStorage';
import {
  EmbeddingsIndexFile,
  EmbeddingValidationReport,
  CrossLingualPairResult,
} from './types';

/**
 * Calculates standard cosine similarity between two dense numerical vectors.
 */
export function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

/**
 * Validates cross-lingual semantic alignment of English source chunks
 * against natural citizen queries in English, Hindi, and Gujarati.
 */
export async function validateCrossLingualAlignment(
  index: EmbeddingsIndexFile,
  apiKey?: string
): Promise<{ passed: boolean; results: CrossLingualPairResult[] }> {
  const resolvedKey = resolveGeminiApiKey(apiKey);
  const genAI = new GoogleGenerativeAI(resolvedKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

  const chunkMap = new Map(index.chunks.map(c => [c.chunkId, c]));

  // Representative multilingual test queries against English official source chunks
  const testQueries: Array<{
    docChunkId: string;
    text: string;
    lang: 'en' | 'hi' | 'gu';
  }> = [
    {
      docChunkId: 'pm_kisan_chunk_003', // Eligibility Criteria
      text: 'Who is eligible for PM Kisan Samman Nidhi financial assistance?',
      lang: 'en',
    },
    {
      docChunkId: 'pm_kisan_chunk_003',
      text: 'पीएम किसान सम्मान निधि योजना के लिए कौन पात्र है?',
      lang: 'hi',
    },
    {
      docChunkId: 'pm_kisan_chunk_003',
      text: 'પીએમ કિસાન સન્માન નિધિ યોજના માટે કોણ પાત્ર છે?',
      lang: 'gu',
    },
    {
      docChunkId: 'ayushman_bharat_chunk_002', // Key Benefits
      text: 'What is the maximum hospital treatment coverage under Ayushman Bharat?',
      lang: 'en',
    },
    {
      docChunkId: 'ayushman_bharat_chunk_002',
      text: 'आयुष्मान भारत योजना के तहत कितना अस्पताल खर्च कवर मिलता है?',
      lang: 'hi',
    },
    {
      docChunkId: 'ayushman_bharat_chunk_002',
      text: 'આયુષ્માન ભારત યોજના હેઠળ હોસ્પિટલ સારવાર માટે કેટલી રકમ મળે છે?',
      lang: 'gu',
    },
    {
      docChunkId: 'income_certificate_chunk_003', // Required Documents
      text: 'What documents are required to apply for an Income Certificate?',
      lang: 'en',
    },
    {
      docChunkId: 'income_certificate_chunk_003',
      text: 'आय प्रमाण पत्र बनवाने के लिए कौन से आवश्यक दस्तावेज चाहिए?',
      lang: 'hi',
    },
    {
      docChunkId: 'income_certificate_chunk_003',
      text: 'આવકનો દાખલો મેળવવા માટે કયા કાગળો જરૂરી છે?',
      lang: 'gu',
    },
  ];

  // Batch embed all test queries in a single request with retry
  let queryEmbeddings: number[][] = [];
  let attempt = 0;
  const maxRetries = 5;

  while (attempt < maxRetries && queryEmbeddings.length === 0) {
    attempt++;
    try {
      const batchResult = await model.batchEmbedContents({
        requests: testQueries.map(q => ({
          content: { role: 'user', parts: [{ text: q.text }] },
        })),
      });
      queryEmbeddings = batchResult.embeddings.map(e => e.values);
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || String(err);
      if (attempt < maxRetries) {
        console.warn(
          `[Cross-Lingual Validation] Retrying test query batch in 6000ms (attempt ${attempt}/${maxRetries})...`
        );
        await sleep(6000);
      } else {
        console.error('Failed to embed test queries for cross-lingual validation:', errorMsg);
      }
    }
  }

  const results: CrossLingualPairResult[] = [];
  let allPairsPassed = queryEmbeddings.length === testQueries.length;

  for (let i = 0; i < testQueries.length; i++) {
    const q = testQueries[i];
    const docChunk = chunkMap.get(q.docChunkId);

    if (!docChunk || !queryEmbeddings[i] || queryEmbeddings[i].length === 0) {
      results.push({
        docChunkId: q.docChunkId,
        docScheme: docChunk?.scheme || 'Unknown',
        docSection: docChunk?.section || 'Unknown',
        queryText: q.text,
        queryLanguage: q.lang,
        cosineSimilarity: 0,
        passed: false,
      });
      allPairsPassed = false;
      continue;
    }

    const similarity = computeCosineSimilarity(docChunk.embedding, queryEmbeddings[i]);
    const passed = similarity >= 0.65;
    if (!passed) allPairsPassed = false;

    results.push({
      docChunkId: docChunk.chunkId,
      docScheme: docChunk.scheme,
      docSection: docChunk.section,
      queryText: q.text,
      queryLanguage: q.lang,
      cosineSimilarity: Number(similarity.toFixed(4)),
      passed,
    });
  }

  return { passed: allPairsPassed, results };
}

/**
 * Performs full validation across all criteria for the generated embeddings index.
 */
export async function validateEmbeddingsIndex(
  index: EmbeddingsIndexFile,
  artifactPath: string
): Promise<EmbeddingValidationReport> {
  const { allChunks } = await chunkAllGovernmentSources();

  const totalChunks = allChunks.length;
  const embeddedChunks = index.chunks.length;
  const failedChunks = totalChunks - embeddedChunks;

  // 1. Vector health & dimensionality check
  let vectorHealthPassed = true;
  const EXPECTED_DIM = 3072;

  for (const chunk of index.chunks) {
    if (!chunk.embedding || chunk.embedding.length !== EXPECTED_DIM) {
      vectorHealthPassed = false;
      break;
    }
    const hasNaN = chunk.embedding.some(v => typeof v !== 'number' || isNaN(v) || !isFinite(v));
    if (hasNaN) {
      vectorHealthPassed = false;
      break;
    }
  }

  // 2. Metadata preservation check
  let metadataValidationPassed = true;
  for (const chunk of index.chunks) {
    if (
      !chunk.chunkId ||
      !chunk.documentId ||
      !chunk.scheme ||
      !chunk.section ||
      !chunk.sectionType ||
      !chunk.language ||
      !chunk.source ||
      !chunk.sourceFile ||
      !chunk.sourceUrl ||
      !chunk.ministry ||
      typeof chunk.chunkIndex !== 'number' ||
      typeof chunk.totalChunksInDoc !== 'number' ||
      typeof chunk.tokenEstimate !== 'number' ||
      typeof chunk.characterCount !== 'number' ||
      !chunk.embeddingModel ||
      chunk.embeddingDimensions !== EXPECTED_DIM
    ) {
      metadataValidationPassed = false;
      break;
    }
  }

  // 3. Content conservation check (verbatim text match against Step 1 chunks)
  let contentConservationPassed = true;
  const chunkMap = new Map(allChunks.map(c => [c.id, c.content]));

  for (const chunk of index.chunks) {
    const originalText = chunkMap.get(chunk.chunkId);
    if (!originalText || originalText !== chunk.content) {
      contentConservationPassed = false;
      break;
    }
  }

  // 4. Repeatability & deterministic uniqueness check
  const seenIds = new Set<string>();
  let repeatabilityPassed = true;
  for (const chunk of index.chunks) {
    if (seenIds.has(chunk.chunkId)) {
      repeatabilityPassed = false;
      break;
    }
    seenIds.add(chunk.chunkId);
  }

  if (index.chunks.length !== allChunks.length) {
    repeatabilityPassed = false;
  }

  // 5. Multilingual Cross-Lingual validation
  const crossLingual = await validateCrossLingualAlignment(index);

  // 6. Artifact size
  const stats = await getStoredEmbeddingsStats(artifactPath);

  const allPassed =
    embeddedChunks === totalChunks &&
    failedChunks === 0 &&
    vectorHealthPassed &&
    metadataValidationPassed &&
    contentConservationPassed &&
    repeatabilityPassed &&
    crossLingual.passed;

  return {
    timestamp: new Date().toISOString(),
    embeddingModel: index.embeddingModel,
    embeddingDimensions: EXPECTED_DIM,
    totalChunks,
    embeddedChunks,
    failedChunks,
    artifactPath,
    artifactSizeBytes: stats.sizeBytes,
    artifactSizeFormatted: stats.sizeFormatted,
    metadataValidationPassed,
    contentConservationPassed,
    vectorHealthPassed,
    repeatabilityPassed,
    crossLingualValidation: crossLingual,
    allPassed,
  };
}
