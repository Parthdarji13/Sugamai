import fs from 'fs/promises';
import { matchQueryToSource } from './queryMatcher';
import { extractRelevantContent } from './contentExtractor';
import { getCachedSourcePath, governmentSources } from './governmentSources';

export interface RetrievalResult {
  matched: boolean;
  serviceId?: string;
  serviceName?: string;
  content: string;
  sourceTitle: string;
  sourceUrl: string;
  retrievalMethod: 'live_fetch' | 'cached_official_fallback' | 'unmatched_default';
}

/**
 * Retrieves official government information related to the user query.
 * Attempts a live check/scrape if possible, but falls back to reading official cached documents
 * if live access fails or is blocked (common with government websites).
 */
export async function retrieveOfficialInfo(query: string, fallbackSourceId?: string): Promise<RetrievalResult> {
  // 1. Identify which government service matches the query
  let source = matchQueryToSource(query);

  // Fallback to previous matched source in session if current query is not explicitly matched
  if (!source && fallbackSourceId) {
    source = governmentSources.find(s => s.id === fallbackSourceId) || null;
  }

  if (!source) {
    return {
      matched: false,
      content: 'No matching official government service was found for this query. The prototype currently supports: PM Kisan, Ayushman Bharat, and Income Certificate.',
      sourceTitle: 'SugamGov AI System',
      sourceUrl: '',
      retrievalMethod: 'unmatched_default'
    };
  }

  const retrieveStart = performance.now();

  // 2. Immediate retrieval of content from local official cache (critical path)
  let rawContent = '';
  try {
    const filePath = getCachedSourcePath(source.cachedFileName);
    rawContent = await fs.readFile(filePath, 'utf-8');
  } catch (fsError) {
    console.error(`Failed to read cached official file: ${(fsError as Error).message}`);
    rawContent = `Error: Official government document for ${source.name} is temporarily unavailable.`;
  }

  const retrieveEnd = performance.now();
  console.log(`[TIMING] Local file retrieval for ${source.name} took ${(retrieveEnd - retrieveStart).toFixed(2)}ms`);

  // 3. Asynchronous Live Website connection check (non-blocking)
  const targetUrl = source.officialUrl;
  const targetName = source.name;
  
  // Kick off the fetch asynchronously and log the result when it finishes
  (async () => {
    const checkStart = performance.now();
    try {
      const response = await fetch(targetUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2500),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SugamGovAI/1.0'
        }
      });
      
      const checkEnd = performance.now();
      const duration = (checkEnd - checkStart).toFixed(2);
      if (response.ok) {
        console.log(`[TIMING] Async live check: Connected to official portal ${targetUrl} successfully in ${duration}ms`);
      } else {
        console.warn(`[TIMING] Async live check: Connected to official portal ${targetUrl} but returned status ${response.status} in ${duration}ms`);
      }
    } catch (err) {
      const checkEnd = performance.now();
      console.warn(`[Live Check Warning] Non-critical check failed/aborted for ${targetName} (${targetUrl}): ${(err as Error).message} in ${(checkEnd - checkStart).toFixed(2)}ms`);
    }
  })().catch(unhandledErr => {
    console.error('[CRITICAL ASYNC CHECK ERROR]:', unhandledErr);
  });

  // 4. Extract the most relevant paragraphs matching the query
  const relevantContent = extractRelevantContent(rawContent, query);

  return {
    matched: true,
    serviceId: source.id,
    serviceName: source.name,
    content: relevantContent,
    sourceTitle: source.sourceTitle,
    sourceUrl: source.officialUrl,
    retrievalMethod: 'cached_official_fallback'
  };
}
