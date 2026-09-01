import fs from 'fs/promises';
import { governmentSources, GovernmentSource, getCachedSourcePath } from '../governmentSources';
import {
  DocumentChunk,
  ParsedDocument,
  ParsedSection,
  ChunkingOptions,
  SectionType,
} from './types';
import {
  normalizeSectionHeading,
  extractMinistryFromSourceTitle,
  estimateTokens,
  normalizeTextContent,
} from './sectionNormalizer';

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  targetTokens: 180,
  maxTokens: 260,
  tokenOverlap: 30,
};

/**
 * Validates whether a line qualifies as a primary section header.
 * Primary headers are concise (<= 70 chars, <= 8 words), end with a colon,
 * and are not list items/bullets/sub-methods.
 */
function isPrimarySectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.endsWith(':')) return false;
  if (trimmed.length > 70) return false;

  // Primary section headers never start with a list bullet, dash, or number
  if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  if (words.length > 8) return false;

  const lower = trimmed.toLowerCase();

  // Exclude introductory sentences, sub-methods, or inline notes
  if (
    lower.startsWith('the following') ||
    lower.startsWith('method ') ||
    lower.startsWith('note:') ||
    lower.startsWith('d1:') ||
    lower.startsWith('d2:') ||
    lower.startsWith('d3:') ||
    lower.startsWith('d4:') ||
    lower.startsWith('d5:') ||
    lower.startsWith('d7:') ||
    lower.startsWith('for salaried') ||
    lower.startsWith('for businessmen') ||
    lower.startsWith('for farmers') ||
    lower.startsWith('for pensioners') ||
    lower.startsWith('online method') ||
    lower.startsWith('offline method') ||
    lower.startsWith('step ')
  ) {
    return false;
  }

  // Regex pattern for valid section headers
  return /^([A-Za-z0-9\s,&()+\/-]+):$/.test(trimmed);
}

/**
 * Parses raw government document text into header metadata and structured sections.
 */
export function parseDocumentStructure(
  rawText: string,
  sourceMeta: GovernmentSource
): ParsedDocument {
  const normalizedText = normalizeTextContent(rawText);
  const lines = normalizedText.split('\n');

  let documentTitle = sourceMeta.name;
  let officialUrl = sourceMeta.officialUrl;
  let sourceTitle = sourceMeta.sourceTitle;

  // Extract header lines if present
  let contentStartIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith('official portal:')) {
      officialUrl = line.replace(/official portal:/i, '').trim();
      contentStartIndex = Math.max(contentStartIndex, i + 1);
    } else if (line.toLowerCase().startsWith('source title:')) {
      sourceTitle = line.replace(/source title:/i, '').trim();
      contentStartIndex = Math.max(contentStartIndex, i + 1);
    } else if (i === 0 && line.length > 5 && !line.includes(':')) {
      documentTitle = line.trim();
      contentStartIndex = Math.max(contentStartIndex, 1);
    }
  }

  const sections: ParsedSection[] = [];
  let currentSectionTitle = '';
  let currentSectionLines: string[] = [];
  let currentHeaderLineNum = 0;

  for (let i = contentStartIndex; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isPrimarySectionHeading(trimmed)) {
      // Save previous section if exists
      if (currentSectionTitle && currentSectionLines.length > 0) {
        const rawContent = currentSectionLines.join('\n').trim();
        if (rawContent.length > 0) {
          sections.push({
            sectionTitle: currentSectionTitle,
            sectionType: normalizeSectionHeading(currentSectionTitle),
            rawContent,
            headerLineNumber: currentHeaderLineNum,
          });
        }
      }

      currentSectionTitle = trimmed.replace(/:$/, '').trim();
      currentSectionLines = [];
      currentHeaderLineNum = i + 1;
    } else {
      if (currentSectionTitle) {
        currentSectionLines.push(line);
      }
    }
  }

  // Push final section
  if (currentSectionTitle && currentSectionLines.length > 0) {
    const rawContent = currentSectionLines.join('\n').trim();
    if (rawContent.length > 0) {
      sections.push({
        sectionTitle: currentSectionTitle,
        sectionType: normalizeSectionHeading(currentSectionTitle),
        rawContent,
        headerLineNumber: currentHeaderLineNum,
      });
    }
  }

  const ministry = extractMinistryFromSourceTitle(sourceTitle);

  return {
    serviceId: sourceMeta.id,
    serviceName: sourceMeta.name,
    sourceFile: sourceMeta.cachedFileName,
    documentTitle,
    officialUrl,
    sourceTitle,
    ministry,
    sections,
    originalRawText: rawText,
  };
}

/**
 * Splits a long section into logical sub-blocks without breaking sentences or items.
 */
function splitSectionContent(
  sectionTitle: string,
  rawContent: string,
  maxTokens: number
): string[] {
  const paragraphs = rawContent.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  // If already <= 1 paragraph and within token limit, return as single chunk
  if (paragraphs.length <= 1) {
    const tokens = estimateTokens(`${sectionTitle}:\n${rawContent}`);
    if (tokens <= maxTokens) {
      return [rawContent];
    }
  }

  const chunks: string[] = [];
  let currentBlock: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);

    // If single paragraph exceeds maxTokens (e.g. huge numbered list), split by numbered items
    if (paraTokens > maxTokens) {
      if (currentBlock.length > 0) {
        chunks.push(currentBlock.join('\n\n'));
        currentBlock = [];
        currentTokens = 0;
      }

      const lines = para.split('\n');
      let subGroup: string[] = [];
      let subTokens = 0;

      for (const line of lines) {
        const lineTokens = estimateTokens(line);
        const isItemStart =
          line.trim().match(/^(\d+\.|-|Method\s+\d+|D\d+:|[A-Z]\d+:)/i) !== null;

        if (isItemStart && subTokens + lineTokens > maxTokens && subGroup.length > 0) {
          chunks.push(subGroup.join('\n'));
          subGroup = [line];
          subTokens = lineTokens;
        } else {
          subGroup.push(line);
          subTokens += lineTokens;
        }
      }

      if (subGroup.length > 0) {
        chunks.push(subGroup.join('\n'));
      }
      continue;
    }

    if (currentTokens + paraTokens > maxTokens && currentBlock.length > 0) {
      chunks.push(currentBlock.join('\n\n'));
      currentBlock = [para];
      currentTokens = paraTokens;
    } else {
      currentBlock.push(para);
      currentTokens += paraTokens;
    }
  }

  if (currentBlock.length > 0) {
    chunks.push(currentBlock.join('\n\n'));
  }

  return chunks.length > 0 ? chunks : [rawContent];
}

/**
 * Chunks a single parsed document into an array of DocumentChunk objects.
 */
export function chunkParsedDocument(
  parsedDoc: ParsedDocument,
  options: ChunkingOptions = {}
): DocumentChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rawChunks: Array<{
    sectionType: SectionType;
    sectionTitle: string;
    subSectionLabel?: string;
    content: string;
  }> = [];

  for (const section of parsedDoc.sections) {
    const fullSectionText = `${section.sectionTitle}:\n${section.rawContent}`;
    const totalSectionTokens = estimateTokens(fullSectionText);

    if (totalSectionTokens <= opts.maxTokens) {
      // Section fits cleanly in 1 chunk
      rawChunks.push({
        sectionType: section.sectionType,
        sectionTitle: section.sectionTitle,
        content: fullSectionText,
      });
    } else {
      // Section requires logical sub-chunking
      const subParts = splitSectionContent(
        section.sectionTitle,
        section.rawContent,
        opts.maxTokens
      );

      const totalParts = subParts.length;
      for (let p = 0; p < totalParts; p++) {
        const partLabel = totalParts > 1 ? `Part ${p + 1}/${totalParts}` : undefined;
        const partHeader = partLabel
          ? `${section.sectionTitle} (${partLabel}):`
          : `${section.sectionTitle}:`;

        const chunkContent = `${partHeader}\n${subParts[p].trim()}`;

        rawChunks.push({
          sectionType: section.sectionType,
          sectionTitle: section.sectionTitle,
          subSectionLabel: partLabel,
          content: chunkContent,
        });
      }
    }
  }

  const totalChunksInDoc = rawChunks.length;

  return rawChunks.map((item, index) => {
    const chunkIndex = index + 1;
    const paddedIndex = String(chunkIndex).padStart(3, '0');
    const id = `${parsedDoc.serviceId}_chunk_${paddedIndex}`;
    const tokenEstimate = estimateTokens(item.content);
    const characterCount = item.content.length;

    return {
      id,
      chunkIndex,
      totalChunksInDoc,
      serviceId: parsedDoc.serviceId,
      serviceName: parsedDoc.serviceName,
      sourceFile: parsedDoc.sourceFile,
      sourceTitle: parsedDoc.sourceTitle,
      sourceUrl: parsedDoc.officialUrl,
      ministry: parsedDoc.ministry,
      sectionType: item.sectionType,
      sectionTitle: item.sectionTitle,
      subSectionLabel: item.subSectionLabel,
      content: item.content,
      language: 'en' as const,
      tokenEstimate,
      characterCount,
    };
  });
}

/**
 * Loads, normalizes, and chunks a single government source by its metadata object.
 */
export async function chunkGovernmentSource(
  source: GovernmentSource,
  options: ChunkingOptions = {}
): Promise<{ parsedDoc: ParsedDocument; chunks: DocumentChunk[] }> {
  const filePath = getCachedSourcePath(source.cachedFileName);
  const rawText = await fs.readFile(filePath, 'utf-8');
  const parsedDoc = parseDocumentStructure(rawText, source);
  const chunks = chunkParsedDocument(parsedDoc, options);
  return { parsedDoc, chunks };
}

/**
 * Loads, normalizes, and chunks all supported government sources in the repository.
 */
export async function chunkAllGovernmentSources(
  options: ChunkingOptions = {}
): Promise<{
  allChunks: DocumentChunk[];
  documentsMap: Map<string, { parsedDoc: ParsedDocument; chunks: DocumentChunk[] }>;
}> {
  const allChunks: DocumentChunk[] = [];
  const documentsMap = new Map<string, { parsedDoc: ParsedDocument; chunks: DocumentChunk[] }>();

  for (const source of governmentSources) {
    const { parsedDoc, chunks } = await chunkGovernmentSource(source, options);
    documentsMap.set(source.id, { parsedDoc, chunks });
    allChunks.push(...chunks);
  }

  return { allChunks, documentsMap };
}
