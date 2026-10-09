import { getGovernmentSchemesCollection, GovernmentSchemeDocument } from '@/lib/dbCollections';

export interface GovernmentSchemeInfo {
  schemeId?: string;
  schemeName: string;
  schemeShortTitle?: string;
  nodalMinistry: string;
  schemeCategory?: string;
  level?: string;
  benefits: string;
  eligibilityCriteria: string;
  documentsRequired: string;
  applicationProcess: string;
  officialPortalUrl: string;
  sourceName: string;
  lastVerifiedAt?: Date | string;
}

export interface GovernmentServiceResult {
  matched: boolean;
  schemes: GovernmentSchemeInfo[];
  primaryScheme: GovernmentSchemeInfo | null;
  sourceType: 'official_api' | 'verified_database';
  sourceName: string;
  officialPortalUrl: string;
  lastVerifiedAt?: string;
}

// Multilingual keyword dictionary for seamless English, Hindi & Gujarati scheme matching
const SCHEME_KEYWORD_MAP: Record<string, string[]> = {
  pm_kisan: ['kisan', 'किसान', 'ખેડૂત', 'કિસાન', 'pmkisan', 'pm-kisan', 'farmer'],
  ayushman_bharat_pmjay: ['ayushman', 'pmjay', 'pm-jay', 'आयुष्मान', 'આયુષ્માન', 'health', 'hospital', '5 lakh', 'आरोग्य', 'treatment'],
  pm_awas_yojana_urban: ['awas urban', 'pmay urban', 'pmay-u', 'आवास शहरी', 'આવાસ શહેરી', 'housing urban'],
  pm_awas_yojana_gramin: ['awas gramin', 'pmay gramin', 'pmay-g', 'आवास ग्रामीण', 'આવાસ ગ્રામીણ', 'housing rural'],
  pm_mudra_yojana: ['mudra', 'मुद्रा', 'મુદ્રા', 'business loan', 'shishu', 'kishore', 'tarun', 'loan'],
  sukanya_samriddhi_yojana: ['sukanya', 'सुकन्या', 'સુકન્યા', 'girl child', 'beti', 'samriddhi', 'સમૃદ્ધિ', 'daughter'],
  atal_pension_yojana: ['atal pension', 'apy', 'अटल पेंशन', 'અટલ પેન્શન', 'pension', 'પેન્શન', 'पेंशन'],
  pm_jeevan_jyoti_bima_yojana: ['jeevan jyoti', 'pmjjby', 'जीवन ज्योति', 'જીવન જ્યોતિ', 'life insurance', '436'],
  pm_suraksha_bima_yojana: ['suraksha bima', 'pmsby', 'सुरक्षा बीमा', 'સુરક્ષા વીમો', 'accident insurance', '20'],
  pm_svanidhi: ['svanidhi', 'street vendor', 'स्वनिधि', 'સ્વનિધિ', 'रेहड़ी', 'फेरीवाला', 'hawker'],
  pm_garib_kalyan_anna_yojana: ['anna yojana', 'ration', 'pmgkay', 'nfsa', 'राशन', 'अन्न योजना', 'રેશન', 'અનાજ', 'foodgrain'],
  eshram_card: ['eshram', 'e-shram', 'ई-श्रम', 'ઇ-શ્રમ', 'unorganized worker', 'uan'],
  pm_ujjwala_yojana: ['ujjwala', 'lpg', 'gas cylinder', 'उज्ज्वला', 'ઉજ્જવલા', 'ગેસ'],
  pm_vishwakarma: ['vishwakarma', 'विश्वकर्मा', 'વિશ્વકર્મા', 'artisan', 'craftsperson', 'carpenter'],
  stand_up_india: ['stand up india', 'standup', 'स्टैंड अप', 'સ્ટેન્ડ અપ'],
  national_scholarship_portal: ['scholarship', 'nsp', 'छात्रवृत्ति', 'શિષ્યવૃત્તિ', 'scholarships', 'education'],
  pm_kaushal_vikas_yojana: ['kaushal vikas', 'pmkvy', 'skill', 'कौशल विकास', 'કૌશલ્ય'],
  kisan_credit_card: ['kisan credit card', 'kcc', 'किसान क्रेडिट', 'કિસાન ક્રેડિટ'],
  pm_fasal_bima_yojana: ['fasal bima', 'pmfby', 'crop insurance', 'फसल बीमा', 'પાક વીમો'],
  jal_jeevan_mission: ['jal jeevan', 'har ghar jal', 'जल जीवन', 'જળ જીવન', 'नल से जल', 'પાણી'],
  ddu_gky: ['ddu-gky', 'ddu gky', 'rural skill', 'ग्रामीण कौशल्य'],
  pm_poshan_midday_meal: ['poshan', 'mid day meal', 'midday', 'पोषण', 'મધ્યાહન ભોજન'],
  mahila_samman_savings_certificate: ['mahila samman', 'mssc', 'महिला सम्मान', 'મહિલા સન્માન'],
  pm_employment_generation_programme: ['pmegp', 'employment generation', 'रोजगार सृजन', 'રોજગાર'],
  national_apprenticeship_promotion_scheme: ['apprenticeship', 'naps', 'शिक्षुता', 'એપ્રેન્ટિસશીપ']
};

/**
 * Searches the verified MongoDB scheme database (Fallback / Core Demo Source).
 */
async function searchDatabaseSchemes(cleanQuery: string): Promise<GovernmentSchemeDocument[]> {
  try {
    const collection = await getGovernmentSchemesCollection();

    // 1. Multilingual Keyword Match
    const matchedSchemeIds: string[] = [];
    for (const [schemeId, keywords] of Object.entries(SCHEME_KEYWORD_MAP)) {
      if (keywords.some((kw) => cleanQuery.includes(kw.toLowerCase()))) {
        matchedSchemeIds.push(schemeId);
        if (matchedSchemeIds.length >= 3) break;
      }
    }

    if (matchedSchemeIds.length > 0) {
      const keywordMatches = await collection
        .find({ schemeId: { $in: matchedSchemeIds } })
        .limit(3)
        .toArray();
      if (keywordMatches && keywordMatches.length > 0) {
        return keywordMatches as GovernmentSchemeDocument[];
      }
    }

    // 2. MongoDB Text Search (scored)
    try {
      const textMatches = await collection
        .find(
          { $text: { $search: cleanQuery } },
          { projection: { score: { $meta: 'textScore' } } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(3)
        .toArray();

      // Only accept text match if score is meaningful (avoid matching just the word "scheme")
      if (textMatches && textMatches.length > 0) {
        const top = textMatches[0] as { score?: number };
        if (top.score && top.score > 1.2) {
          return textMatches as GovernmentSchemeDocument[];
        }
      }
    } catch {
      // Text index fallback
    }

    // 3. Fallback Regex Match (ignoring generic stop words)
    const STOP_WORDS = new Set([
      'scheme', 'schemes', 'yojana', 'yojna', 'government', 'govt', 'sarkari', 'apply', 'application',
      'details', 'detail', 'info', 'information', 'how', 'what', 'where', 'when', 'which', 'who',
      'about', 'tell', 'want', 'need', 'kya', 'hai', 'kaise', 'kare', 'batao', 'krna', 'online', 'portal',
      'योजना', 'सरकारी', 'યોજના', 'સરકારી', 'માહિતી', 'કેવી', 'રીતે'
    ]);

    const meaningfulTokens = cleanQuery
      .replace(/[^\w\s\u0900-\u097F\u0A80-\u0AFF]/gi, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

    if (meaningfulTokens.length > 0) {
      const regexPatterns = meaningfulTokens.map((token) => new RegExp(token, 'i'));
      const fallbackMatches = await collection
        .find({
          $or: [
            { schemeName: { $in: regexPatterns } },
            { schemeShortTitle: { $in: regexPatterns } },
            { schemeCategory: { $in: regexPatterns } },
          ],
        })
        .limit(3)
        .toArray();

      if (fallbackMatches && fallbackMatches.length > 0) {
        return fallbackMatches as GovernmentSchemeDocument[];
      }
    }

    return [];
  } catch (err) {
    console.error('[DATABASE SCHEME SEARCH ERROR]:', err);
    return [];
  }
}

/**
 * Attempts to call the official Government API if configured via environment variables.
 * Ready for API Setu / myScheme integration when credentials become available.
 */
async function callOfficialGovernmentApi(query: string): Promise<GovernmentSchemeInfo[] | null> {
  const apiEndpoint = process.env.GOV_API_ENDPOINT;
  const apiKey = process.env.GOV_API_KEY;
  const clientId = process.env.GOV_CLIENT_ID;

  // If live API credentials are not configured, return null immediately
  if (!apiEndpoint || !apiKey) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        ...(clientId ? { 'X-CLIENT-ID': clientId } : {})
      },
      body: JSON.stringify({ query }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[GOV API] Live API returned HTTP status ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Map the external API response format into our GovernmentSchemeInfo schema
    if (data && Array.isArray(data.schemes) && data.schemes.length > 0) {
      return data.schemes.map((s: Record<string, unknown>) => ({
        schemeName: String(s.schemeName || s.title || 'Government Scheme'),
        schemeShortTitle: s.schemeShortTitle ? String(s.schemeShortTitle) : undefined,
        nodalMinistry: String(s.nodalMinistry || s.ministry || 'Government of India'),
        schemeCategory: s.schemeCategory ? String(s.schemeCategory) : undefined,
        level: s.level ? String(s.level) : 'Central',
        benefits: String(s.benefits || s.details || ''),
        eligibilityCriteria: String(s.eligibilityCriteria || s.eligibility || ''),
        documentsRequired: String(s.documentsRequired || s.documents || ''),
        applicationProcess: String(s.applicationProcess || s.process || ''),
        officialPortalUrl: String(s.officialPortalUrl || s.url || 'https://www.myscheme.gov.in'),
        sourceName: String(s.sourceName || 'Official Government API / API Setu'),
        lastVerifiedAt: s.lastVerifiedAt ? new Date(String(s.lastVerifiedAt)) : new Date()
      }));
    }

    return null;
  } catch (err) {
    console.warn('[GOV API] Error connecting to live Government API, falling back to database:', (err as Error).message);
    return null;
  }
}

/**
 * Main Service Function: fetchGovernmentScheme(query)
 * 1. Checks and calls live Official Government API if configured.
 * 2. If API is not configured or offline, falls back to the verified MongoDB repository.
 */
export async function fetchGovernmentScheme(query: string): Promise<GovernmentServiceResult> {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    return {
      matched: false,
      schemes: [],
      primaryScheme: null,
      sourceType: 'verified_database',
      sourceName: 'National Portal of India / myScheme',
      officialPortalUrl: 'https://www.myscheme.gov.in'
    };
  }

  // Step A: Attempt Official Government API (when configured)
  const apiSchemes = await callOfficialGovernmentApi(query);
  if (apiSchemes && apiSchemes.length > 0) {
    const primary = apiSchemes[0];
    return {
      matched: true,
      schemes: apiSchemes,
      primaryScheme: primary,
      sourceType: 'official_api',
      sourceName: primary.sourceName,
      officialPortalUrl: primary.officialPortalUrl,
      lastVerifiedAt: primary.lastVerifiedAt ? new Date(primary.lastVerifiedAt).toISOString().split('T')[0] : undefined
    };
  }

  // Step B: Transparent Fallback to Verified MongoDB Database (for demo & offline reliability)
  const dbSchemes = await searchDatabaseSchemes(cleanQuery);
  if (dbSchemes && dbSchemes.length > 0) {
    const primary = dbSchemes[0];
    return {
      matched: true,
      schemes: dbSchemes,
      primaryScheme: primary,
      sourceType: 'verified_database',
      sourceName: primary.sourceName,
      officialPortalUrl: primary.officialPortalUrl,
      lastVerifiedAt: primary.lastVerifiedAt ? new Date(primary.lastVerifiedAt).toISOString().split('T')[0] : undefined
    };
  }

  // Step C: No relevant official information found
  return {
    matched: false,
    schemes: [],
    primaryScheme: null,
    sourceType: 'verified_database',
    sourceName: 'National Portal of India / myScheme',
    officialPortalUrl: 'https://www.myscheme.gov.in'
  };
}
