import { retrieveOfficialInfo } from '../retrieval/sourceManager';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface TestCase {
  id: string;
  query: string;
  isLatestQuery?: boolean;
}

const AYUSHMAN_TEST_CASES: TestCase[] = [
  { id: 'A1', query: 'What is Ayushman Bharat PM-JAY?' },
  { id: 'A2', query: 'Who is eligible for Ayushman Bharat?' },
  { id: 'A3', query: 'What are the benefits of Ayushman Bharat?' },
  { id: 'A4', query: 'How can I get an Ayushman card?' },
  { id: 'A5', query: 'What documents are required for Ayushman Bharat?' },
  { id: 'A6', query: 'Is Aadhaar mandatory for Ayushman Bharat?' },
  { id: 'A7', query: 'Is there any age limit for Ayushman Bharat?' },
  { id: 'A8', query: 'Is there a last date to apply for Ayushman Bharat?' },
  { id: 'A9', query: 'What is the latest Ayushman Bharat update?', isLatestQuery: true },
  { id: 'A10', query: 'What is the latest change in Ayushman Bharat eligibility?', isLatestQuery: true }
];

const PM_KISAN_REGRESSION_CASES: TestCase[] = [
  { id: 'K1', query: 'What is PM Kisan?' },
  { id: 'K2', query: 'Who is eligible for PM Kisan?' },
  { id: 'K3', query: 'What is the latest PM Kisan installment information?', isLatestQuery: true },
  { id: 'K4', query: 'What is the latest PM Kisan update?', isLatestQuery: true }
];

async function callGemini(systemPrompt: string, userQuery: string): Promise<{ text: string; model: string; httpStatus: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key_here') {
    return { text: '[Demo Mode - Gemini API Key missing]', model: 'DemoMode', httpStatus: 200 };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent(userQuery);
      const text = result.response.text();
      return { text, model: modelName, httpStatus: 200 };
    } catch (err) {
      console.warn(`[GEMINI CASCADE] Model ${modelName} failed: ${(err as Error).message}`);
    }
  }

  return { text: 'All Gemini models failed', model: 'None', httpStatus: 503 };
}

async function runAyushmanAndRegressionSuite() {
  console.log('==================================================');
  console.log(' AYUSHMAN BHARAT & PM KISAN FORENSIC RETRIEVAL TEST');
  console.log('==================================================\n');

  console.log('--- PART 1: AYUSHMAN BHARAT TESTS (A1 - A10) ---\n');

  const ayushmanResults: any[] = [];

  for (const tc of AYUSHMAN_TEST_CASES) {
    console.log(`\n==================================================`);
    console.log(`[TEST ${tc.id}] "${tc.query}"`);
    console.log(`==================================================`);

    const ret = await retrieveOfficialInfo(tc.query);

    const sourceHeading = ret.retrievalMethod === 'live_fetch_with_cached_context'
      ? 'Here is the VERIFIED information retrieved from official government sources (combining live portal updates and verified official guidelines):'
      : 'Here is the VERIFIED information retrieved from the official government source:';

    const systemPrompt = `You are SugamGov AI, an intelligent government service assistant.
Your goal is to answer the citizen's question accurately using only the retrieved official government information below.

${sourceHeading}
---
${ret.content}
---

Official Source: ${ret.sourceTitle}
Source Link: ${ret.sourceUrl}

Instructions:
1. Answer the user's question ONLY using the verified information provided above.
2. Do NOT invent, assume, or guess any details.
3. Translate and answer in English.
`;

    const geminiRes = await callGemini(systemPrompt, tc.query);

    let passStatus = false;
    if (tc.isLatestQuery) {
      // For A9 & A10: PASS ONLY if fresh official live content was actually retrieved (liveCharCount > 0)
      passStatus = ret.matched && (ret.liveCharCount || 0) > 0 && ret.retrievalMethod === 'live_fetch_with_cached_context';
    } else {
      // For A1-A8: PASS if matched and valid context returned
      passStatus = ret.matched && ret.content.length > 100;
    }

    const reportItem = {
      id: tc.id,
      query: tc.query,
      matchedSource: ret.serviceName || 'None',
      officialUrl: ret.sourceUrl,
      pmjayAttempted: ret.pmjayAttempted ?? false,
      pmjayResult: ret.pmjayResult ?? 'N/A',
      pibAttempted: ret.pibAttempted ?? false,
      pibHttpStatus: ret.pibHttpStatus ?? 0,
      pibRelevantContentFound: ret.pibRelevantFound ?? false,
      liveCharCount: ret.liveCharCount ?? 0,
      cachedCharCount: ret.cachedCharCount ?? 0,
      finalRetrievalMethod: ret.retrievalMethod,
      geminiModel: geminiRes.model,
      httpStatus: geminiRes.httpStatus,
      passStatus: passStatus ? 'PASS' : (tc.isLatestQuery ? 'FAIL (No fresh live content retrieved)' : 'FAIL'),
      answerSnippet: geminiRes.text.substring(0, 200).replace(/\n/g, ' ')
    };

    ayushmanResults.push(reportItem);

    console.log(`- matched source: ${reportItem.matchedSource}`);
    console.log(`- official URL: ${reportItem.officialUrl}`);
    console.log(`- pmjay live attempt: ${reportItem.pmjayAttempted ? 'Yes' : 'No'}`);
    console.log(`- pmjay result: ${reportItem.pmjayResult}`);
    console.log(`- PIB fallback attempt: ${reportItem.pibAttempted ? 'Yes' : 'No'}`);
    console.log(`- PIB HTTP status: ${reportItem.pibHttpStatus}`);
    console.log(`- PIB relevant content found: ${reportItem.pibRelevantContentFound}`);
    console.log(`- live character count: ${reportItem.liveCharCount}`);
    console.log(`- cached character count: ${reportItem.cachedCharCount}`);
    console.log(`- final retrieval method: ${reportItem.finalRetrievalMethod}`);
    console.log(`- Gemini model: ${reportItem.geminiModel}`);
    console.log(`- HTTP status: ${reportItem.httpStatus}`);
    console.log(`- final result: ${reportItem.passStatus}`);
  }

  console.log('\n\n--- PART 2: PM KISAN REGRESSION TESTS (K1 - K4) ---\n');

  const pmKisanResults: any[] = [];

  for (const tc of PM_KISAN_REGRESSION_CASES) {
    console.log(`\n==================================================`);
    console.log(`[REGRESSION TEST ${tc.id}] "${tc.query}"`);
    console.log(`==================================================`);

    const ret = await retrieveOfficialInfo(tc.query);

    const isLive = ret.retrievalMethod === 'live_fetch' || ret.retrievalMethod === 'live_fetch_with_cached_context';
    const passStatus = ret.matched && ret.serviceId === 'pm_kisan' && isLive;

    const reportItem = {
      id: tc.id,
      query: tc.query,
      matchedSource: ret.serviceName || 'None',
      officialUrl: ret.sourceUrl,
      liveCharCount: ret.liveCharCount || ret.content.length,
      finalRetrievalMethod: ret.retrievalMethod,
      passStatus: passStatus ? 'PASS (Untouched & Live)' : 'FAIL'
    };

    pmKisanResults.push(reportItem);

    console.log(`- matched source: ${reportItem.matchedSource}`);
    console.log(`- official URL: ${reportItem.officialUrl}`);
    console.log(`- live character count: ${reportItem.liveCharCount}`);
    console.log(`- final retrieval method: ${reportItem.finalRetrievalMethod}`);
    console.log(`- final result: ${reportItem.passStatus}`);
  }

  console.log('\n\n==================================================');
  console.log(' SUITE SUMMARY REPORT');
  console.log('==================================================');

  console.log('\nAyushman Bharat (A1-A10):');
  ayushmanResults.forEach(r => {
    console.log(`  [${r.id}] ${r.passStatus.padEnd(42)} Method: ${r.finalRetrievalMethod} | Live Chars: ${r.liveCharCount} | PIB Found: ${r.pibRelevantContentFound}`);
  });

  console.log('\nPM Kisan Regression (K1-K4):');
  pmKisanResults.forEach(r => {
    console.log(`  [${r.id}] ${r.passStatus.padEnd(30)} Method: ${r.finalRetrievalMethod}`);
  });
}

runAyushmanAndRegressionSuite().catch(console.error);
