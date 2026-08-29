import { GovernmentUpdate } from './updatesData';

interface ParsedRssItem {
  title: string;
  link: string;
  pubDate?: string;
  prid?: string;
}

/**
 * Strips CDATA tags and trims text.
 */
function cleanXmlText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Extracts PRID query parameter from PIB press release URL.
 */
function extractPrid(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('PRID') || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Validates whether a URL strictly belongs to official PIB domains and uses HTTPS.
 */
function isValidPibUrl(url: string): boolean {
  if (!url || !url.startsWith('https://')) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'pib.gov.in' || host === 'www.pib.gov.in';
  } catch {
    return false;
  }
}

/**
 * Fetches and parses official PIB RSS XML for a given language code (1 = English, 2 = Hindi).
 */
async function fetchPibRssFeed(lang: number, timeoutMs = 5000): Promise<ParsedRssItem[]> {
  const feedUrl = `https://www.pib.gov.in/RssMain.aspx?ModId=6&reg=48&lang=${lang}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(feedUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SugamGovAI/1.0',
        'Accept': 'application/xml,text/xml,application/xhtml+xml,*/*'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[UPDATES FETCH] PIB RSS lang=${lang} returned HTTP status ${response.status}`);
      return [];
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('xml') && !contentType.includes('text')) {
      console.warn(`[UPDATES FETCH] PIB RSS lang=${lang} unexpected Content-Type: ${contentType}`);
      return [];
    }

    const xmlText = await response.text();
    const items: ParsedRssItem[] = [];
    const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (const itemXml of itemMatches) {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<(pubDate|dc:date)>([\s\S]*?)<\/(pubDate|dc:date)>/i);

      if (titleMatch && linkMatch) {
        const rawTitle = cleanXmlText(titleMatch[1]);
        let rawLink = cleanXmlText(linkMatch[1]);

        // Automatically upgrade http to https if link points to official pib.gov.in
        if (rawLink.startsWith('http://pib.gov.in') || rawLink.startsWith('http://www.pib.gov.in')) {
          rawLink = rawLink.replace('http://', 'https://');
        }

        // Validate strictly HTTPS and official PIB domain
        if (rawTitle.length >= 15 && isValidPibUrl(rawLink)) {
          const pubDate = pubDateMatch ? cleanXmlText(pubDateMatch[2]) : undefined;
          const prid = extractPrid(rawLink);

          items.push({
            title: rawTitle,
            link: rawLink,
            pubDate,
            prid
          });
        }
      }
    }

    return items;
  } catch (err) {
    clearTimeout(timeoutId);
    const errMsg = (err as Error).name === 'AbortError' ? 'Timed out after 5000ms' : (err as Error).message;
    console.warn(`[UPDATES FETCH] PIB RSS lang=${lang} fetch error: ${errMsg}`);
    return [];
  }
}

/**
 * Maps press release titles to existing category keys.
 */
function inferCategory(title: string): 'pm_kisan' | 'ayushman_bharat' | 'income_certificate' {
  const lower = title.toLowerCase();
  if (lower.includes('ayushman') || lower.includes('health') || lower.includes('hospital') || lower.includes('medical') || lower.includes('pmjay')) {
    return 'ayushman_bharat';
  }
  if (lower.includes('income') || lower.includes('tax') || lower.includes('revenue') || lower.includes('finance') || lower.includes('bank') || lower.includes('certificate')) {
    return 'income_certificate';
  }
  return 'pm_kisan';
}

/**
 * Infers official Ministry / Department information from the press release title.
 */
function inferDepartment(title: string): { en: string; hi: string; gu: string } {
  const lower = title.toLowerCase();

  if (lower.includes('agriculture') || lower.includes('kisan') || lower.includes('farmer') || lower.includes('fasal') || lower.includes('krishi')) {
    return {
      en: 'Ministry of Agriculture and Farmers Welfare',
      hi: 'कृषि एवं किसान कल्याण मंत्रालय',
      gu: 'કૃષિ અને ખેડૂત કલ્યાણ મંત્રાલય'
    };
  }
  if (lower.includes('health') || lower.includes('ayushman') || lower.includes('pmjay') || lower.includes('hospital') || lower.includes('medical') || lower.includes('swasthya')) {
    return {
      en: 'Ministry of Health and Family Welfare',
      hi: 'स्वास्थ्य एवं परिवार कल्याण मंत्रालय',
      gu: 'સ્વાસ્થ્ય અને પરિવાર કલ્યાણ મંત્રાલય'
    };
  }
  if (lower.includes('housing') || lower.includes('pmay') || lower.includes('awas') || lower.includes('urban')) {
    return {
      en: 'Ministry of Housing and Urban Affairs',
      hi: 'आवासन और शहरी कार्य मंत्रालय',
      gu: 'આવાસ અને શહેરી બાબતોનું મંત્રાલય'
    };
  }
  if (lower.includes('finance') || lower.includes('tax') || lower.includes('revenue') || lower.includes('bank') || lower.includes('mudra') || lower.includes('cbn') || lower.includes('narcotics')) {
    return {
      en: 'Ministry of Finance (Government of India)',
      hi: 'वित्त मंत्रालय (भारत सरकार)',
      gu: 'નાણા મંત્રાલય (ભારત સરકાર)'
    };
  }
  if (lower.includes('labour') || lower.includes('shram') || lower.includes('worker') || lower.includes('employment')) {
    return {
      en: 'Ministry of Labour and Employment',
      hi: 'श्रम एवं रोजगार मंत्रालय',
      gu: 'શ્રમ અને રોજગાર મંત્રાલય'
    };
  }
  if (lower.includes('textile') || lower.includes('textiles') || lower.includes('vastr')) {
    return {
      en: 'Ministry of Textiles (Government of India)',
      hi: 'वस्त्र मंत्रालय (भारत सरकार)',
      gu: 'કાપડ મંત્રાલય (ભારત સરકાર)'
    };
  }
  if (lower.includes('rural') || lower.includes('pmgsy') || lower.includes('panchayat') || lower.includes('gramin')) {
    return {
      en: 'Ministry of Rural Development',
      hi: 'ग्रामीण विकास मंत्रालय',
      gu: 'ગ્રામીણ વિકાસ મંત્રાલય'
    };
  }
  if (lower.includes('education') || lower.includes('scholarship') || lower.includes('student') || lower.includes('shiksha')) {
    return {
      en: 'Ministry of Education (Government of India)',
      hi: 'शिक्षा मंत्रालय (भारत सरकार)',
      gu: 'શિક્ષણ મંત્રાલય (ભારત સરકાર)'
    };
  }
  if (lower.includes('electronics') || lower.includes('meity') || lower.includes('digital') || lower.includes('it ')) {
    return {
      en: 'Ministry of Electronics and Information Technology',
      hi: 'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय',
      gu: 'ઇલેક્ટ્રોનિક્સ અને ઇન્ફોર્મેશન ટેકનોલોજી મંત્રાલય'
    };
  }

  return {
    en: 'Press Information Bureau (Government of India)',
    hi: 'प्रेस सूचना ब्यूरो (भारत सरकार)',
    gu: 'પ્રેસ ઇન્ફર્મેશન બ્યુરો (ભારત સરકાર)'
  };
}

/**
 * Formats pubDate XML string into a valid YYYY-MM-DD date string.
 * Falls back to current date if missing or unparseable.
 */
function formatPublicationDate(pubDateStr?: string): string {
  if (pubDateStr) {
    const parsed = new Date(pubDateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Primary function to fetch live Government Updates from official PIB RSS feeds.
 * Returns an array of GovernmentUpdate objects, or null if live fetch fails or has <3 valid items.
 */
export async function fetchLiveGovernmentUpdates(): Promise<GovernmentUpdate[] | null> {
  console.log('[UPDATES FETCH] Attempting PIB live feed');

  // Fetch English (lang=1) and Hindi (lang=2) feeds in parallel
  const [enResult, hiResult] = await Promise.allSettled([
    fetchPibRssFeed(1, 5000),
    fetchPibRssFeed(2, 5000)
  ]);

  const enItems = enResult.status === 'fulfilled' ? enResult.value : [];
  const hiItems = hiResult.status === 'fulfilled' ? hiResult.value : [];

  if (enItems.length < 3) {
    console.warn(`[UPDATES FETCH] PIB live feed failed - Only ${enItems.length} valid English items retrieved (minimum 3 required).`);
    return null;
  }

  // Map Hindi items by PRID for strict matching
  const hiByPrid = new Map<string, string>();
  hiItems.forEach(item => {
    if (item.prid) hiByPrid.set(item.prid, item.title);
  });

  const updates: GovernmentUpdate[] = enItems.slice(0, 6).map((enItem, idx) => {
    // Determine Hindi title match by exact PRID or fallback to English title (prevent cross-story mismatch)
    const hiTitle = (enItem.prid && hiByPrid.get(enItem.prid)) || enItem.title;
    const formattedDate = formatPublicationDate(enItem.pubDate);
    const category = inferCategory(enItem.title);
    const department = inferDepartment(enItem.title);

    return {
      id: `pib_live_${enItem.prid || idx}_${Date.now()}`,
      title: {
        en: enItem.title,
        hi: hiTitle,
        gu: enItem.title // Fallback for Gujarati as supported by UI
      },
      summary: {
        en: `Official government release: ${enItem.title}. Access official details via the source link below.`,
        hi: `आधिकारिक सरकारी विज्ञप्ति: ${hiTitle}। नीचे दिए गए स्रोत लिंक के माध्यम से आधिकारिक विवरण प्राप्त करें।`,
        gu: `સત્તાવાર સરકારી જાહેરાત: ${enItem.title}. નીચે આપેલ લિંક દ્વારા સત્તાવાર વિગતો મેળવો.`
      },
      department,
      date: formattedDate,
      sourceUrl: enItem.link,
      sourceName: department.en,
      category
    };
  });

  console.log(`[UPDATES FETCH] Live PIB feed succeeded - ${updates.length} official updates retrieved.`);
  return updates;
}
