import { GoogleGenerativeAI } from '@google/generative-ai';
import { resolveGeminiApiKey, sleep } from '../embeddings/embeddingGenerator';

export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
export const CANONICAL_MODEL_NAME = 'models/gemini-embedding-001';
export const EXPECTED_EMBEDDING_DIMENSIONS = 3072;

export interface QueryEmbedOptions {
  apiKey?: string;
  modelName?: string;
  maxRetries?: number;
}

/**
 * Generates a 3072-dimensional vector embedding for a user query.
 * Uses models/gemini-embedding-001 via GoogleGenerativeAI.
 */
export async function embedQuery(
  query: string,
  options: QueryEmbedOptions = {}
): Promise<number[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('Query string cannot be empty for embedding generation.');
  }

  const apiKey = resolveGeminiApiKey(options.apiKey);
  const modelName = options.modelName || DEFAULT_EMBEDDING_MODEL;
  const maxRetries = options.maxRetries || 6;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const res = await model.embedContent({
        content: { role: 'user', parts: [{ text: trimmed }] },
      });

      const values = res.embedding?.values;
      if (!values || values.length === 0) {
        throw new Error('Received empty embedding values from Gemini API.');
      }

      if (values.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
        console.warn(
          `[Warning] Expected ${EXPECTED_EMBEDDING_DIMENSIONS} dimensions, but received ${values.length}.`
        );
      }

      return values;
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
        const backoff = Math.max(5000, 3000 * attempt);
        console.warn(
          `[Query Embedder] Temporary API error (${isRateLimit ? '429 Quota' : '503 Service'}). Retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})...`
        );
        await sleep(backoff);
      } else {
        throw new Error(`Failed to generate query embedding after ${attempt} attempts: ${errorMsg}`);
      }
    }
  }

  throw new Error(`Failed to generate query embedding: max retries (${maxRetries}) exceeded.`);
}
