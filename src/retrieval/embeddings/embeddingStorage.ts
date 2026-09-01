import fs from 'fs/promises';
import path from 'path';
import { EmbeddingsIndexFile } from './types';

const DEFAULT_ARTIFACT_REL_PATH = 'src/retrieval/embeddings/generated/document_embeddings.json';

export function getEmbeddingsArtifactPath(): string {
  return path.resolve(process.cwd(), DEFAULT_ARTIFACT_REL_PATH);
}

/**
 * Saves the generated embeddings index file to disk.
 */
export async function saveEmbeddingsIndex(
  index: EmbeddingsIndexFile,
  customPath?: string
): Promise<string> {
  const targetPath = customPath || getEmbeddingsArtifactPath();
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });

  const jsonContent = JSON.stringify(index, null, 2);
  await fs.writeFile(targetPath, jsonContent, 'utf-8');
  return targetPath;
}

/**
 * Loads the stored embeddings index from disk.
 */
export async function loadStoredEmbeddings(
  customPath?: string
): Promise<EmbeddingsIndexFile> {
  const targetPath = customPath || getEmbeddingsArtifactPath();
  const raw = await fs.readFile(/*turbopackIgnore: true*/ targetPath, 'utf-8');
  return JSON.parse(raw) as EmbeddingsIndexFile;
}

/**
 * Returns metadata about the stored embeddings file if it exists.
 */
export async function getStoredEmbeddingsStats(
  customPath?: string
): Promise<{ exists: boolean; sizeBytes: number; sizeFormatted: string }> {
  const targetPath = customPath || getEmbeddingsArtifactPath();
  try {
    const stat = await fs.stat(/*turbopackIgnore: true*/ targetPath);
    const sizeBytes = stat.size;
    const sizeFormatted = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
    return { exists: true, sizeBytes, sizeFormatted };
  } catch {
    return { exists: false, sizeBytes: 0, sizeFormatted: '0 MB' };
  }
}
