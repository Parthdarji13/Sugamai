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
  retrievalMethod: 'live_fetch' | 'live_fetch_with_cached_context' | 'cached_official_fallback' | 'unmatched_default';
}

/**
 * Strips HTML tags, scripts, styles, navigation, headers, footers, and redundant whitespace.
 * Returns clean plain text.
 */
function cleanHtmlContent(html: string): string {
  let cleaned = html;

  // 1. Remove script, style, nav, header, footer, noscript, svg, iframe elements and their contents
  cleaned = cleaned.replace(/<(script|style|nav|header|footer|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, ' ');
  cleaned = cleaned.replace(/<(script|style|nav|header|footer|noscript|svg|iframe)[\s\S]*?>/gi, ' ');

  // 2. Convert common block-level tags or breaks to newline equivalents
  cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n\n');
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

  // 3. Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // 4. Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // 5. Normalize whitespace and empty lines
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim().replace(/\s+/g, ' '))
    .filter(line => line.length > 0)
    .join('\n\n');

  return cleaned.trim();
}

/**
 * Validates retrieved text to ensure it's not an error page, block screen, or unusable text.
 */
function isValidLiveContent(text: string): boolean {
  if (!text || text.length < 150) {
    return false;
  }
  const lower = text.toLowerCase();

  // Check for common error / blocked / captcha phrases
  const errorPhrases = [
    'access denied',
    '403 forbidden',
    '503 service unavailable',
    '502 bad gateway',
    '404 not found',
    'cloudflare',
    'attention required',
    'please turn javascript on',
    'enable javascript',
    'security check',
    'captcha'
  ];

  for (const phrase of errorPhrases) {
    if (lower.includes(phrase) && text.length < 1000) {
      return false; // Error page
    }
  }

  return true;
}

/**
 * Determines whether live extracted content is sufficient to answer the user's intent,
 * or whether verified guideline context should be combined with it.
 */
function isLiveContentSufficient(extractedLive: string, query: string): boolean {
  if (!extractedLive || extractedLive.trim().length < 400) {
    const queryLower = query.toLowerCase();
    const guidelineIntents = [
      'eligibility', 'eligible', 'who can', 'kaun', 'kon', 'paatrata', 'paatra', 'पात्रता', 'पात्र', 'પાત્રતા', 'પાત્ર',
      'document', 'documents', 'proof', 'kagaz', 'kya chahiye', 'kaagaz', 'दस्तावेज', 'કાગળો', 'દસ્તાવેજો',
      'apply', 'application', 'process', 'kaise kare', 'kaise banaye', 'કઈ રીતે', 'અરજી', 'आवेदन', 'प्रक्रिया',
      'benefit', 'amount', 'paisa', 'rs', 'lakh', 'instalment', 'installment', 'लाभ', 'रुपये', 'હપ્તો'
    ];

    if (guidelineIntents.some(intent => queryLower.includes(intent))) {
      return false;
    }
  }

  const queryLower = query.toLowerCase();
  const contentLower = extractedLive.toLowerCase();

  const guidelineIntents = [
    'eligibility', 'eligible', 'who can', 'kaun', 'kon', 'paatrata', 'paatra', 'पात्रता', 'पात्र', 'પાત્રતા', 'પાત્ર',
    'document', 'documents', 'proof', 'kagaz', 'kya chahiye', 'kaagaz', 'दस्तावेज', 'કાગળો', 'દસ્તાવેજો',
    'apply', 'application', 'process', 'kaise kare', 'kaise banaye', 'કઈ રીતે', 'અરજી', 'आवेदन', 'प्रक्रिया'
  ];

  if (guidelineIntents.some(intent => queryLower.includes(intent))) {
    const concreteTerms = [
      'landholding', 'cultivable land', 'farmer family', 'exclusion', '6000', '2000', '5 lakh',
      'aadhaar', 'income certificate', 'salary slip', 'tahsildar', 'mamlatdar', 'csc',
      'अपात्र', 'जमीन', 'दस्तावेज', 'અરજી', 'દસ્તાવેજો'
    ];

    const foundCount = concreteTerms.filter(term => contentLower.includes(term)).length;
    if (foundCount < 1) {
      return false;
    }
  }

  return true;
}

/**
 * Retrieves official government information related to the user query.
 * Attempts live GET retrieval from the official portal with a 6-second timeout.
 * If live retrieval is insufficient or fails, enriches or falls back to verified local .txt sources.
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
      content: 'No matching official government service was found for this query.',
      sourceTitle: 'SugamGov AI System',
      sourceUrl: '',
      retrievalMethod: 'unmatched_default'
    };
  }

  const targetUrl = source.officialUrl;
  const targetName = source.name;

  console.log(`[LIVE RETRIEVAL] Attempting ${targetName} (${targetUrl})`);

  let liveFetchedCleanHtml: string | null = null;
  let extractedLive: string | null = null;
  let retrievalMethod: 'live_fetch' | 'live_fetch_with_cached_context' | 'cached_official_fallback' = 'cached_official_fallback';

  // 2. Attempt Live GET retrieval with 6-second timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SugamGovAI/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8,gu;q=0.7'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const htmlText = await response.text();
      const cleanedText = cleanHtmlContent(htmlText);

      if (isValidLiveContent(cleanedText)) {
        const liveExtract = extractRelevantContent(cleanedText, query);
        if (liveExtract && liveExtract.trim().length >= 100) {
          liveFetchedCleanHtml = cleanedText;
          extractedLive = liveExtract;
          console.log(`[LIVE RETRIEVAL] Live GET Succeeded for ${targetName} - Extracted ${extractedLive.length} chars live text.`);
        }
      }
    }
  } catch (err) {
    const errMsg = (err as Error).name === 'AbortError' ? 'Timed out after 6000ms' : (err as Error).message;
    console.warn(`[LIVE RETRIEVAL] Failed ${targetName} - ${errMsg}`);
  }

  // 3. Determine Sufficiency & Combined Context
  let finalContent = '';

  if (liveFetchedCleanHtml && extractedLive) {
    const sufficient = isLiveContentSufficient(extractedLive, query);

    if (sufficient) {
      retrievalMethod = 'live_fetch';
      finalContent = extractedLive;
      console.log(`[LIVE RETRIEVAL] Live content is SUFFICIENT for query intent. Using 'live_fetch'.`);
    } else {
      retrievalMethod = 'live_fetch_with_cached_context';
      console.log(`[LIVE RETRIEVAL] Live fetch succeeded for ${targetName}, but query requires official guideline context. Combining live + verified cached context.`);

      // Read verified local cached .txt file
      let cachedText = '';
      try {
        const filePath = getCachedSourcePath(source.cachedFileName);
        cachedText = await fs.readFile(filePath, 'utf-8');
      } catch {
        cachedText = '';
      }

      const extractedCached = extractRelevantContent(cachedText, query);

      finalContent = `LIVE OFFICIAL ANNOUNCEMENTS & UPDATES:\n${extractedLive}\n\nVERIFIED OFFICIAL GUIDELINES:\n${extractedCached}`;
    }
  } else {
    // 4. Live fetch completely failed -> Fall back to local cached source
    retrievalMethod = 'cached_official_fallback';
    console.log(`[LIVE RETRIEVAL] Live fetch failed/sparse. Using cached_official_fallback for ${targetName}.`);

    let cachedText = '';
    try {
      const filePath = getCachedSourcePath(source.cachedFileName);
      cachedText = await fs.readFile(filePath, 'utf-8');
    } catch {
      cachedText = `Error: Official government document for ${source.name} is temporarily unavailable.`;
    }

    finalContent = extractRelevantContent(cachedText, query);
  }

  return {
    matched: true,
    serviceId: source.id,
    serviceName: source.name,
    content: finalContent,
    sourceTitle: source.sourceTitle,
    sourceUrl: source.officialUrl,
    retrievalMethod
  };
}
