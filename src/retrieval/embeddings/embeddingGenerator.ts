import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentChunk } from '../chunking/types';
import { chunkAllGovernmentSources } from '../chunking/documentChunker';
import {
  EmbeddedChunk,
  EmbeddingsIndexFile,
  EmbeddingGenerationOptions,
} from './types';

const DEFAULT_MODEL = 'gemini-embedding-001';
const CANONICAL_MODEL_ID = 'models/gemini-embedding-001';
const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_MAX_RETRIES = 8;
const DEFAULT_RETRY_DELAY_MS = 6000;

/**
 * Resolves the Gemini API Key from options, process.env, or .env.local file.
 */
export function resolveGeminiApiKey(customKey?: string): string {
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }

  // Fallback check in .env.local if running standalone outside Next.js runtime
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/GEMINI_API_KEY\s*=\s*(.+)/);
      if (match && match[1]) {
        const parsedKey = match[1].trim().replace(/^["']|["']$/g, '');
        if (parsedKey && parsedKey !== 'your_key_here') {
          return parsedKey;
        }
      }
    }
  } catch {
    // Ignore read errors
  }

  throw new Error(
    'GEMINI_API_KEY is not configured in process.env or .env.local. Embedding generation requires a valid Gemini API key.'
  );
}

/**
 * Helper to pause execution for rate-limit spacing and exponential backoff.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates dense vector embeddings for an array of DocumentChunk objects.
 * Uses batchEmbedContents to minimize network calls and stay within free-tier quotas.
 */
export async function generateDocumentEmbeddings(
  chunks?: DocumentChunk[],
  options: EmbeddingGenerationOptions = {}
): Promise<{
  indexFile: EmbeddingsIndexFile;
  successfulChunks: number;
  failedChunks: number;
}> {
  const apiKey = resolveGeminiApiKey(options.apiKey);
  const modelName = options.modelName || DEFAULT_MODEL;
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  const maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;
  const retryDelayMs = options.retryDelayMs || DEFAULT_RETRY_DELAY_MS;

  // If chunks are not provided, run the Step 1 chunking pipeline to get them
  let sourceChunks = chunks;
  if (!sourceChunks || sourceChunks.length === 0) {
    const chunkingResult = await chunkAllGovernmentSources();
    sourceChunks = chunkingResult.allChunks;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const embeddedChunks: EmbeddedChunk[] = [];
  let failedCount = 0;

  // Process in batches
  for (let i = 0; i < sourceChunks.length; i += batchSize) {
    const batch = sourceChunks.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(sourceChunks.length / batchSize);

    let batchSuccess = false;
    let attempt = 0;

    while (!batchSuccess && attempt < maxRetries) {
      attempt++;
      try {
        const embedRequests = batch.map(chunk => ({
          content: {
            role: 'user',
            parts: [{ text: chunk.content }],
          },
        }));

        const result = await model.batchEmbedContents({
          requests: embedRequests,
        });

        if (!result.embeddings || result.embeddings.length !== batch.length) {
          throw new Error(
            `Expected ${batch.length} embeddings from batch ${batchNumber}, but received ${result.embeddings?.length || 0}.`
          );
        }

        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j];
          const rawEmbedding = result.embeddings[j];
          const values = rawEmbedding.values;

          if (!values || values.length === 0) {
            throw new Error(`Received empty embedding vector for chunk ID: ${chunk.id}`);
          }

          embeddedChunks.push({
            chunkId: chunk.id,
            documentId: chunk.serviceId,
            scheme: chunk.serviceName,
            section: chunk.sectionTitle,
            sectionType: chunk.sectionType,
            subSectionLabel: chunk.subSectionLabel,
            language: chunk.language,
            source: chunk.sourceTitle,
            sourceFile: chunk.sourceFile,
            sourceUrl: chunk.sourceUrl,
            ministry: chunk.ministry,
            chunkIndex: chunk.chunkIndex,
            totalChunksInDoc: chunk.totalChunksInDoc,
            tokenEstimate: chunk.tokenEstimate,
            characterCount: chunk.characterCount,
            content: chunk.content,
            embedding: values,
            embeddingModel: CANONICAL_MODEL_ID,
            embeddingDimensions: values.length,
          });
        }

        batchSuccess = true;

        // Space out batches to stay well under rate limits
        if (i + batchSize < sourceChunks.length) {
          await sleep(2000);
        }
      } catch (err: unknown) {
        const errorMsg = (err as Error).message || String(err);
        const isRateLimit =
          errorMsg.includes('429') ||
          errorMsg.toLowerCase().includes('quota') ||
          errorMsg.toLowerCase().includes('resource_exhausted');
        const isTemporary =
          errorMsg.includes('503') ||
          errorMsg.includes('502') ||
          errorMsg.toLowerCase().includes('overloaded');

        if ((isRateLimit || isTemporary) && attempt < maxRetries) {
          const backoff = Math.max(retryDelayMs, 3000 * attempt);
          console.warn(
            `[Embedding Batch ${batchNumber}/${totalBatches}] Hit temporary API limit (${isRateLimit ? '429 Quota' : '503 Service'}). Retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})...`
          );
          await sleep(backoff);
        } else {
          console.error(
            `[Embedding Batch ${batchNumber}/${totalBatches}] Failed after ${attempt} attempts: ${errorMsg}`
          );
          failedCount += batch.length;
          break;
        }
      }
    }
  }

  const uniqueServiceIds = Array.from(new Set(sourceChunks.map(c => c.serviceId)));
  const dimensions = embeddedChunks.length > 0 ? embeddedChunks[0].embeddingDimensions : 3072;

  const indexFile: EmbeddingsIndexFile = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    embeddingModel: CANONICAL_MODEL_ID,
    embeddingDimensions: dimensions,
    totalChunks: embeddedChunks.length,
    documentsCount: uniqueServiceIds.length,
    serviceIds: uniqueServiceIds,
    chunks: embeddedChunks,
  };

  return {
    indexFile,
    successfulChunks: embeddedChunks.length,
    failedChunks: failedCount,
  };
}
