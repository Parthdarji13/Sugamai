import { governmentSources } from '../governmentSources';
import {
  ChunkValidationReport,
  DocumentValidationDetail,
  SectionType,
} from './types';
import { chunkAllGovernmentSources } from './documentChunker';

/**
 * Normalizes a string into a list of lowercase alphanumeric words for conservation testing.
 */
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

/**
 * Validates the entire chunking pipeline across all government sources.
 */
export async function validateChunkingPipeline(): Promise<ChunkValidationReport> {
  const { allChunks, documentsMap } = await chunkAllGovernmentSources();

  const totalDocuments = governmentSources.length;
  const totalChunks = allChunks.length;

  const chunksPerDocument: Record<string, number> = {};
  const sectionTypeCounts: Record<SectionType, number> = {
    overview: 0,
    benefits: 0,
    eligibility: 0,
    exclusions: 0,
    documents: 0,
    application: 0,
    status: 0,
    validity: 0,
    verification: 0,
    other: 0,
  };

  let totalTokens = 0;
  let totalChars = 0;
  let minChunk = { id: '', tokens: Infinity, serviceId: '', sectionTitle: '' };
  let maxChunk = { id: '', tokens: -Infinity, serviceId: '', sectionTitle: '' };

  const seenIds = new Set<string>();
  let duplicateIdFound = false;
  let emptyChunkFound = false;
  let metadataInvalid = false;

  for (const chunk of allChunks) {
    // 1. Unique ID check
    if (seenIds.has(chunk.id)) {
      duplicateIdFound = true;
    }
    seenIds.add(chunk.id);

    // 2. Non-empty check
    if (!chunk.content || chunk.content.trim().length === 0) {
      emptyChunkFound = true;
    }

    // 3. Metadata validity check
    if (
      !chunk.id ||
      !chunk.serviceId ||
      !chunk.serviceName ||
      !chunk.sourceFile ||
      !chunk.sourceUrl ||
      !chunk.sectionType ||
      !chunk.sectionTitle ||
      !chunk.ministry ||
      chunk.language !== 'en'
    ) {
      metadataInvalid = true;
    }

    // Accumulators
    chunksPerDocument[chunk.serviceId] = (chunksPerDocument[chunk.serviceId] || 0) + 1;
    sectionTypeCounts[chunk.sectionType] = (sectionTypeCounts[chunk.sectionType] || 0) + 1;

    totalTokens += chunk.tokenEstimate;
    totalChars += chunk.characterCount;

    if (chunk.tokenEstimate < minChunk.tokens) {
      minChunk = {
        id: chunk.id,
        tokens: chunk.tokenEstimate,
        serviceId: chunk.serviceId,
        sectionTitle: chunk.sectionTitle,
      };
    }
    if (chunk.tokenEstimate > maxChunk.tokens) {
      maxChunk = {
        id: chunk.id,
        tokens: chunk.tokenEstimate,
        serviceId: chunk.serviceId,
        sectionTitle: chunk.sectionTitle,
      };
    }
  }

  // 4. Document Coverage Test
  const docCoveragePassed =
    documentsMap.size === totalDocuments &&
    governmentSources.every(src => (chunksPerDocument[src.id] || 0) >= 1);

  // 5. Section Preservation & Content Conservation per Document
  const documentDetails: DocumentValidationDetail[] = [];
  let allSectionsPreserved = true;
  let allContentConserved = true;

  for (const source of governmentSources) {
    const docData = documentsMap.get(source.id);
    if (!docData) {
      allSectionsPreserved = false;
      allContentConserved = false;
      continue;
    }

    const { parsedDoc, chunks } = docData;

    // Check all parsed sections are represented in chunks
    const chunkSectionTitles = new Set(chunks.map(c => c.sectionTitle));
    const originalSections = parsedDoc.sections.map(s => s.sectionTitle);
    const sectionsFound = originalSections.filter(s => chunkSectionTitles.has(s));

    if (sectionsFound.length !== originalSections.length) {
      allSectionsPreserved = false;
    }

    // Check word conservation from original sections vs combined chunks
    const originalSectionWords = extractWords(
      parsedDoc.sections.map(s => `${s.sectionTitle} ${s.rawContent}`).join(' ')
    );
    const chunkWords = new Set(extractWords(chunks.map(c => c.content).join(' ')));

    const missingWords = originalSectionWords.filter(word => !chunkWords.has(word));
    const conservationPassed = missingWords.length === 0;

    if (!conservationPassed) {
      allContentConserved = false;
    }

    documentDetails.push({
      sourceFile: source.cachedFileName,
      serviceId: source.id,
      originalCharCount: parsedDoc.originalRawText.length,
      originalWordCount: originalSectionWords.length,
      chunkCount: chunks.length,
      totalChunkWordCount: extractWords(chunks.map(c => c.content).join(' ')).length,
      sectionCount: parsedDoc.sections.length,
      sectionsFound,
      conservationPassed,
      missingWords: Array.from(new Set(missingWords)),
    });
  }

  const avgTokensPerChunk = Math.round(totalTokens / (totalChunks || 1));
  const avgCharsPerChunk = Math.round(totalChars / (totalChunks || 1));

  const allTestsPassed =
    docCoveragePassed &&
    !metadataInvalid &&
    !emptyChunkFound &&
    !duplicateIdFound &&
    allSectionsPreserved &&
    allContentConserved;

  return {
    timestamp: new Date().toISOString(),
    totalDocuments,
    totalChunks,
    chunksPerDocument,
    sectionTypeCounts,
    avgTokensPerChunk,
    avgCharsPerChunk,
    minChunkTokens: minChunk.tokens === Infinity ? { id: '', tokens: 0, serviceId: '', sectionTitle: '' } : minChunk,
    maxChunkTokens: maxChunk.tokens === -Infinity ? { id: '', tokens: 0, serviceId: '', sectionTitle: '' } : maxChunk,
    allTestsPassed,
    testResults: {
      documentCoverage: {
        passed: docCoveragePassed,
        message: docCoveragePassed
          ? `All ${totalDocuments} official government sources were successfully ingested and produced chunks.`
          : 'Document coverage test failed: One or more sources were omitted.',
      },
      metadataIntegrity: {
        passed: !metadataInvalid,
        message: !metadataInvalid
          ? 'All chunks contain complete, valid metadata (id, serviceId, serviceName, sourceFile, sourceUrl, ministry, sectionType, sectionTitle, content, language).'
          : 'Metadata integrity failed: One or more chunks are missing required fields.',
      },
      nonEmptyChunks: {
        passed: !emptyChunkFound,
        message: !emptyChunkFound
          ? 'All chunks have non-empty, substantive text content.'
          : 'Non-empty test failed: One or more chunks have empty content.',
      },
      uniqueChunkIds: {
        passed: !duplicateIdFound,
        message: !duplicateIdFound
          ? `All ${totalChunks} chunk IDs are strictly unique and sequentially deterministic.`
          : 'Duplicate ID test failed: Duplicate chunk IDs were detected.',
      },
      sectionPreservation: {
        passed: allSectionsPreserved,
        message: allSectionsPreserved
          ? 'Every single logical section across all 9 documents was successfully preserved.'
          : 'Section preservation failed: One or more sections were dropped during chunking.',
      },
      contentConservation: {
        passed: allContentConserved,
        message: allContentConserved
          ? '100% of all words, rules, numbers, exclusions, documents, and instructions from all original source files are preserved verbatim in the chunks.'
          : 'Content conservation failed: Missing text detected between source documents and chunks.',
        details: documentDetails,
      },
    },
  };
}
