import fs from 'fs/promises';
import { matchQueryWithScore, hasGenericGovTerms } from './queryMatcher';
import { extractRelevantContent, hasRelevantVerifiedContext } from './contentExtractor';
import { getCachedSourcePath, governmentSources } from './governmentSources';

export interface RetrievalResult {
  matched: boolean;
  serviceId?: string;
  serviceName?: string;
  content: string;
  sourceTitle: string;
  sourceUrl: string;
  retrievalMethod: 'live_fetch' | 'live_fetch_with_cached_context' | 'cached_official_fallback' | 'unmatched_default';
  // Diagnostic fields for audit/test reporting
  pmjayAttempted?: boolean;
  pmjayResult?: string;
  pibAttempted?: boolean;
  pibHttpStatus?: number;
  pibRelevantFound?: boolean;
  liveCharCount?: number;
  cachedCharCount?: number;
  isFreshnessQuery?: boolean;
  freshDataAvailable?: boolean;
  hasRelevantContext?: boolean;
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
function isLiveContentSufficient(extractedLive: string, query: string, serviceId?: string): boolean {
  if (!extractedLive || extractedLive.trim().length === 0) {
    return false;
  }

  const contentLower = extractedLive.toLowerCase();
  const queryLower = query.toLowerCase();

  // Check for generic services portal / directory boilerplate
  const isPortalBoilerplate =
    contentLower.includes('services | national portal of india') ||
    contentLower.includes('access over 0 government services') ||
    contentLower.includes('suggest / report a service') ||
    contentLower.includes('streamline your interactions and save time');

  if (isPortalBoilerplate) {
    // Scheme specifics check
    const specificSchemeTerms = [
      'tahsildar', 'mamlatdar', 'salary slip', 'form 16', 'annual income', 'financial year',
      'patwari', 'talati', 'landholding', 'cultivable land', '5 lakh', 'pmjay'
    ];
    const hasSpecifics = specificSchemeTerms.some(term => contentLower.includes(term));
    if (!hasSpecifics) {
      return false;
    }
  }

  // If service is income_certificate, ensure live text actually has income certificate specifics
  if (serviceId === 'income_certificate') {
    const icTerms = ['tahsildar', 'mamlatdar', 'salary slip', 'annual income', 'form 16', 'patwari', 'talati', 'revenue officer', 'self-declaration', 'validity'];
    const matchedCount = icTerms.filter(t => contentLower.includes(t)).length;
    if (matchedCount < 1) {
      return false;
    }
  }

  const guidelineIntents = [
    'eligibility', 'eligible', 'who can', 'kaun', 'kon', 'paatrata', 'paatra', 'पात्रता', 'पात्र', 'પાત્રતા', 'पात्र',
    'document', 'documents', 'proof', 'kagaz', 'kya chahiye', 'kaagaz', 'दस्तावेज', 'કાગળો', 'દસ્તાવેજો',
    'apply', 'application', 'process', 'kaise kare', 'kaise banaye', 'કઈ રીતે', 'અરજી', 'आवेदन', 'प्रक्रिया',
    'benefit', 'benefits', 'uses', 'use', 'amount', 'paisa', 'rs', 'lakh', 'instalment', 'installment', 'लाभ', 'रुपये', 'હપ્તો',
    'last date', 'deadline', 'validity', 'valid', 'expiry', 'end date', 'kab tak', 'अंतिम तिथि', 'છેલ્લી તારીખ',
    'fee', 'fees', 'cost', 'charge', 'charges', 'time', 'how long', 'duration', 'days', 'where', 'office', 'where can',
    'aadhaar', 'ration', 'affidavit', 'bank', 'what is', 'overview', 'definition', 'kya hai', 'shu che', 'શું છે', 'क्या है'
  ];

  if (extractedLive.trim().length < 400) {
    if (guidelineIntents.some(intent => queryLower.includes(intent))) {
      return false;
    }
  }

  const docIntents = ['document', 'documents', 'proof', 'kagaz', 'kya chahiye', 'kaagaz', 'दस्तावेज', 'કાગળો', 'દસ્તાવેજો'];
  if (docIntents.some(intent => queryLower.includes(intent))) {
    const docTerms = ['required documents', 'documents required', 'land record', 'land records', 'salary slip', 'voter id', 'ration card', 'bank account', 'passbook', 'khatiyan', '7/12', 'identity proof'];
    const docFound = docTerms.some(term => contentLower.includes(term));
    if (!docFound) {
      return false;
    }
  }

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
 * Detects whether the citizen's query is asking for latest/recent updates, changes,
 * or announcements that require live verified freshness.
 */
export function isFreshnessSensitiveQuery(query: string): boolean {
  const q = query.toLowerCase();
  const freshnessTerms = [
    'latest', 'update', 'updates', 'recent', 'recently', 'new', 'news', 'change', 'changes',
    'announcement', 'announcements', 'current', 'what changed', 'any change', 'new rule', 'new rules',
    'last date', 'deadline', '2025', '2026', '2027',
    // Hindi
    'ताजा', 'ताज़ा', 'नया', 'नए', 'नई', 'अपडेट', 'हालिया', 'बदलाव', 'परिवर्तन', 'घोषणा', 'समाचार',
    // Gujarati
    'તાજા', 'તાજું', 'નવા', 'નવી', 'અપડેટ', 'ફેરફાર', 'સુધારો', 'જાહેરાત', 'સમાચાર'
  ];

  return freshnessTerms.some(term => q.includes(term));
}

interface PibFallbackResult {
  liveContent: string | null;
  sourceUrl?: string;
  sourceTitle?: string;
  pibHttpSuccess: boolean;
  relevantContentFound: boolean;
  pibHttpStatus: number;
}

/**
 * Attempts official Press Information Bureau (PIB) RSS feed fallback for Ayushman Bharat queries
 * when primary portals (pmjay.gov.in) fail or return sparse content.
 */
async function fetchPibAyushmanFallback(query: string): Promise<PibFallbackResult> {
  console.log('[PIB FALLBACK] Attempting official PIB RSS feed for Ayushman Bharat live updates...');

  const ayushmanTerms = [
    'ayushman bharat', 'ayushman', 'pmjay', 'pm-jay', 'pm jay',
    'national health authority', 'nha', 'ayushman card',
    'आयुष्मान भारत', 'आयुष्मान', 'आयुष्मान कार्ड', 'राष्ट्रीय स्वास्थ्य प्राधिकरण',
    'આયુષ્માન ભારત', 'આયુષ્માન', 'આયુષ્માન કાર્ડ'
  ];

  let pibHttpStatus = 0;
  const rssItems: Array<{ title: string; link: string; description?: string; pubDate?: string }> = [];

  // Fetch English (lang=1), Hindi (lang=2), and Regional (reg=3) PIB RSS feeds
  const feedUrls = [
    'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=48&lang=1',
    'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=48&lang=2',
    'https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=3&lang=1'
  ];

  for (const feedUrl of feedUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(feedUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SugamGovAI/1.0',
          'Accept': 'application/xml,text/xml,application/xhtml+xml,*/*'
        }
      });
      clearTimeout(timeoutId);

      if (response.status > 0) pibHttpStatus = response.status;
      if (response.ok) {
        const xmlText = await response.text();
        const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

        for (const itemXml of itemMatches) {
          const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
          const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
          const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
          const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

          if (titleMatch && linkMatch) {
            const rawTitle = titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim();
            let rawLink = linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
            const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim() : '';

            if (rawLink.startsWith('http://pib.gov.in') || rawLink.startsWith('http://www.pib.gov.in')) {
              rawLink = rawLink.replace('http://', 'https://');
            }

            rssItems.push({
              title: rawTitle,
              link: rawLink,
              description: rawDesc,
              pubDate: dateMatch ? dateMatch[1].trim() : undefined
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[PIB FALLBACK] RSS feed fetch failed (${feedUrl}): ${(err as Error).message}`);
    }
  }

  // Filter RSS items for Ayushman relevance
  const matchingItems = rssItems.filter(item => {
    const combinedText = `${item.title} ${item.description || ''}`.toLowerCase();
    return ayushmanTerms.some(term => combinedText.includes(term.toLowerCase()));
  });

  if (matchingItems.length === 0) {
    console.log('[PIB FALLBACK] PIB RSS feed reached, but 0 relevant Ayushman Bharat items found.');
    return {
      liveContent: null,
      pibHttpSuccess: pibHttpStatus >= 200 && pibHttpStatus < 300,
      relevantContentFound: false,
      pibHttpStatus: pibHttpStatus || 200
    };
  }

  // Fetch detailed press release pages for matching items or format text
  let extractedLivePibText = '';
  const mainUrl = matchingItems[0].link;

  for (const match of matchingItems.slice(0, 2)) {
    let prText = `${match.title}\n${match.description || ''}`;
    if (match.link) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(match.link, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SugamGovAI/1.0',
            'Accept': 'text/html,application/xhtml+xml,*/*'
          }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const html = await res.text();
          const cleaned = cleanHtmlContent(html);
          if (isValidLiveContent(cleaned)) {
            const extracted = extractRelevantContent(cleaned, query);
            if (extracted && extracted.length >= 80) {
              prText = extracted;
            }
          }
        }
      } catch {
        // Fall back to title + description
      }
    }

    const pubInfo = match.pubDate ? ` (Published: ${match.pubDate})` : '';
    extractedLivePibText += `PIB Official Release: ${match.title}${pubInfo}\n${prText}\n\n`;
  }

  extractedLivePibText = extractedLivePibText.trim();
  console.log(`[PIB FALLBACK] Found ${matchingItems.length} relevant Ayushman PIB item(s). Extracted ${extractedLivePibText.length} chars of live PIB text.`);

  return {
    liveContent: extractedLivePibText,
    sourceUrl: mainUrl,
    sourceTitle: 'National Health Authority / Press Information Bureau',
    pibHttpSuccess: true,
    relevantContentFound: true,
    pibHttpStatus: pibHttpStatus || 200
  };
}

/**
 * Determines whether a query is a plausible follow-up related to government schemes/services
 * rather than a completely unrelated general knowledge query.
 */
export function isPlausibleFollowUp(query: string): boolean {
  const q = query.toLowerCase();
  const followUpKeywords = [
    // English
    'eligible', 'eligibility', 'who', 'who is', 'who can', 'document', 'documents', 'proof', 'papers', 'paper',
    'apply', 'application', 'process', 'how', 'how to', 'how can', 'benefit', 'benefits', 'uses', 'use',
    'amount', 'money', 'paisa', 'kist', 'installment', 'status', 'update', 'updates', 'latest',
    'rule', 'rules', 'form', 'card', 'last date', 'deadline', 'validity', 'valid', 'expiry', 'aadhaar', 'age', 'limit',
    'fee', 'fees', 'cost', 'charge', 'charges', 'duration', 'time', 'days', 'where', 'where can', 'where do', 'office', 'centre', 'center',
    // Hindi & Transliterated
    'kya', 'kaise', 'kaun', 'kitna', 'kab', 'kaha', 'kahan', 'paatrata', 'paatra', 'kagaz', 'kaagaz', 'shulk',
    'पात्रता', 'पात्र', 'दस्तावेज', 'कागज', 'आवेदन', 'लाभ', 'किस्त', 'फीस', 'शुल्क', 'खर्च', 'समय', 'दिन', 'कहाँ', 'कार्यालय', 'वैधता',
    // Gujarati & Transliterated
    'shu', 'kevi', 'rite', 'kon', 'kaya', 'ketla', 'kare', 'dakhlo', 'kharch',
    'કઈ રીતે', 'કોણ', 'પાત્રતા', 'દસ્તાવેજો', 'કાગળો', 'કાગળ', 'અરજી', 'લાભ', 'હપ્તો', 'ફી', 'ખર્ચ', 'સમય', 'દિવસ', 'ક્યાં', 'ઓફિસ', 'માન્યતા'
  ];
  return followUpKeywords.some(kw => q.includes(kw)) || hasGenericGovTerms(query);
}

/**
 * Retrieves official government information related to the user query.
 * Attempts live GET retrieval from the official portal with a short timeout.
 * If live retrieval is insufficient or fails, enriches or falls back to verified local .txt sources.
 */
export async function retrieveOfficialInfo(query: string, fallbackSourceId?: string): Promise<RetrievalResult> {
  const isFreshnessQuery = isFreshnessSensitiveQuery(query);

  // 1. Identify which government service matches the query (with score metadata)
  const matchResult = matchQueryWithScore(query);
  let source = matchResult.source;

  // Context preservation rule:
  // Retain fallbackSourceId only if query is a follow-up or generic government inquiry
  if (fallbackSourceId && isPlausibleFollowUp(query)) {
    if (!source || (!matchResult.isExplicitAliasMatch && matchResult.score < 10 && source.id !== fallbackSourceId)) {
      const activeFallbackSource = governmentSources.find(s => s.id === fallbackSourceId);
      if (activeFallbackSource) {
        source = activeFallbackSource;
      }
    }
  }

  if (!source) {
    return {
      matched: false,
      content: 'No matching official government service was found for this query.',
      sourceTitle: 'SugamGov AI System',
      sourceUrl: '',
      retrievalMethod: 'unmatched_default',
      isFreshnessQuery,
      freshDataAvailable: false
    };
  }

  const targetUrls = [source.officialUrl, ...(source.alternateUrls || [])];
  const targetName = source.name;

  let extractedLive: string | null = null;
  let retrievalMethod: 'live_fetch' | 'live_fetch_with_cached_context' | 'cached_official_fallback' = 'cached_official_fallback';

  // Audit variables
  const isAyushman = source.id === 'ayushman_bharat';
  let pmjayAttempted = false;
  let pmjayResult = 'Not Attempted';
  let pibAttempted = false;
  let pibHttpStatus = 0;
  let pibRelevantFound = false;
  let liveCharCount = 0;
  let cachedCharCount = 0;
  let finalSourceTitle = source.sourceTitle;
  let finalSourceUrl = source.officialUrl;

  // 2. Attempt Live GET retrieval (Priority 1: Primary portal, Priority 2: Alternate URLs)
  for (const urlToFetch of targetUrls) {
    if (extractedLive) break; // Stop once valid content is fetched
    console.log(`[LIVE RETRIEVAL] Attempting ${targetName} (${urlToFetch})`);
    if (isAyushman && urlToFetch.includes('pmjay.gov.in')) {
      pmjayAttempted = true;
    }

    try {
      const controller = new AbortController();
      const timeoutMs = urlToFetch.includes('pmjay.gov.in') || urlToFetch.includes('nha.gov.in') ? 2500 : 6000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(urlToFetch, {
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
            extractedLive = liveExtract;
            if (isAyushman && urlToFetch.includes('pmjay.gov.in')) pmjayResult = 'HTTP 200 (Success)';
            console.log(`[LIVE RETRIEVAL] Live GET Succeeded for ${targetName} via ${urlToFetch} - Extracted ${extractedLive.length} chars live text.`);
          } else {
            if (isAyushman && urlToFetch.includes('pmjay.gov.in')) pmjayResult = 'HTTP 200 (Sparse/Shell Content)';
          }
        } else {
          if (isAyushman && urlToFetch.includes('pmjay.gov.in')) pmjayResult = 'HTTP 200 (Blocked/Error Page)';
        }
      } else {
        if (isAyushman && urlToFetch.includes('pmjay.gov.in')) pmjayResult = `HTTP ${response.status}`;
      }
    } catch (err) {
      const errMsg = (err as Error).name === 'AbortError' ? 'Timed out after 2500ms' : (err as Error).message;
      if (isAyushman && urlToFetch.includes('pmjay.gov.in')) pmjayResult = `Failed (${errMsg})`;
      console.warn(`[LIVE RETRIEVAL] Failed ${targetName} (${urlToFetch}) - ${errMsg}`);
    }
  }

  // 3. Fallback to PIB feed for Ayushman Bharat (Priority 3) if primary portals fail/return sparse content
  if (!extractedLive && isAyushman) {
    pibAttempted = true;
    const pibResult = await fetchPibAyushmanFallback(query);
    pibHttpStatus = pibResult.pibHttpStatus;
    pibRelevantFound = pibResult.relevantContentFound;

    if (pibResult.liveContent) {
      extractedLive = pibResult.liveContent;
      if (pibResult.sourceUrl) finalSourceUrl = pibResult.sourceUrl;
      if (pibResult.sourceTitle) finalSourceTitle = pibResult.sourceTitle;
      console.log(`[LIVE RETRIEVAL] PIB Fallback Succeeded for ${targetName}. Extracted ${extractedLive.length} chars live PIB text.`);
    }
  }

  // 4. Determine Sufficiency & Combined Context
  let finalContent = '';
  const isPortalBoilerplate =
    extractedLive !== null &&
    (extractedLive.toLowerCase().includes('services | national portal of india') ||
     extractedLive.toLowerCase().includes('access over 0 government services'));
  const freshDataAvailable = !!extractedLive && extractedLive.length > 0 && !(source.id === 'income_certificate' && isPortalBoilerplate);

  if (extractedLive) {
    liveCharCount = extractedLive.length;
    const sufficient = isLiveContentSufficient(extractedLive, query, source.id);

    if (sufficient && !pibAttempted) {
      retrievalMethod = 'live_fetch';
      finalContent = extractedLive;
      console.log(`[LIVE RETRIEVAL] Live content is SUFFICIENT for query intent. Using 'live_fetch'.`);
    } else {
      retrievalMethod = 'live_fetch_with_cached_context';
      console.log(`[LIVE RETRIEVAL] Combining live official context + verified cached guidelines.`);

      // Read verified local cached .txt file
      let cachedText = '';
      try {
        const filePath = getCachedSourcePath(source.cachedFileName);
        cachedText = await fs.readFile(filePath, 'utf-8');
      } catch {
        cachedText = '';
      }

      const extractedCached = extractRelevantContent(cachedText, query);
      cachedCharCount = extractedCached.length;

      const liveHeader = pibAttempted
        ? 'LIVE OFFICIAL PIB ANNOUNCEMENTS & UPDATES:'
        : 'LIVE OFFICIAL ANNOUNCEMENTS & UPDATES:';

      finalContent = `${liveHeader}\n${extractedLive}\n\nVERIFIED OFFICIAL GUIDELINES:\n${extractedCached}`;
    }
  } else {
    // 5. Live fetch & fallbacks failed -> Fall back to local cached source (Priority 4/5)
    retrievalMethod = 'cached_official_fallback';
    console.log(`[LIVE RETRIEVAL] Live fetch failed/sparse. Using cached_official_fallback for ${targetName}.`);

    let cachedText = '';
    try {
      const filePath = getCachedSourcePath(source.cachedFileName);
      cachedText = await fs.readFile(filePath, 'utf-8');
    } catch {
      cachedText = `Error: Official government document for ${source.name} is temporarily unavailable.`;
    }

    const extractedCached = extractRelevantContent(cachedText, query);
    cachedCharCount = extractedCached.length;
    finalContent = extractedCached;
  }

  const hasRelevantContext = hasRelevantVerifiedContext(query, finalContent);

  console.log(`[RETRIEVAL SUMMARY] Matched Service: ${source.name}`);
  console.log(`[RETRIEVAL SUMMARY] Official URL: ${finalSourceUrl}`);
  console.log(`[RETRIEVAL SUMMARY] Retrieval Method: ${retrievalMethod}`);
  console.log(`[RETRIEVAL SUMMARY] Live fetch status: ${extractedLive ? 'Succeeded' : 'Failed'}`);
  console.log(`[RETRIEVAL SUMMARY] Freshness query: ${isFreshnessQuery ? 'Yes' : 'No'} | Fresh data available: ${freshDataAvailable ? 'Yes' : 'No'}`);
  console.log(`[RETRIEVAL SUMMARY] Relevant verified context found: ${hasRelevantContext ? 'Yes' : 'No'}`);
  console.log(`[RETRIEVAL SUMMARY] Final context length: ${finalContent.length} chars`);

  return {
    matched: true,
    serviceId: source.id,
    serviceName: source.name,
    content: finalContent,
    sourceTitle: finalSourceTitle,
    sourceUrl: finalSourceUrl,
    retrievalMethod,
    pmjayAttempted,
    pmjayResult,
    pibAttempted,
    pibHttpStatus,
    pibRelevantFound,
    liveCharCount,
    cachedCharCount,
    isFreshnessQuery,
    freshDataAvailable,
    hasRelevantContext
  };
}

