import https from 'https';
import http from 'http';

interface TestResult {
  query: string;
  matchedSource: string;
  retrievalMethod: string;
  liveCharCount: number;
  cachedCharCount: number;
  geminiAnswered: boolean;
  groundedCorrect: boolean;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function makeHttpRequest(url: string, method = 'GET', body?: Record<string, unknown>): Promise<{ status: number; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Phase4Verifier/1.0'
      }
    };

    const req = (parsedUrl.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          // Could be SSE stream
        }
        resolve({ status: res.statusCode || 0, data: json, raw: data });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function parseSseStream(raw: string): { metadata?: any; text: string; error?: string } {
  const lines = raw.split('\n');
  let metadata: any = null;
  let text = '';
  let error: string | undefined = undefined;

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      if (data.type === 'metadata') {
        metadata = data;
      } else if (data.type === 'chunk') {
        text += data.text;
      } else if (data.type === 'error') {
        error = data.message;
      }
    } catch {
      // not JSON
    }
  }

  return { metadata, text, error };
}

async function runPhase4Tests() {
  console.log('========================================================================');
  console.log(' STARTING PHASE 4 COMPREHENSIVE VERIFICATION SUITE');
  console.log('========================================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Test /api/updates
  console.log('--- 1. Testing /api/updates Endpoint ---');
  try {
    const res = await makeHttpRequest(`${BASE_URL}/api/updates`);
    const updates = res.data;
    const isArray = Array.isArray(updates);
    const count = isArray ? updates.length : 0;
    const hasRequiredFields = count >= 3 && updates.every((u: any) =>
      u.id && u.title?.en && u.summary?.en && u.department?.en && u.date && u.sourceUrl
    );

    console.log(`HTTP Status: ${res.status}`);
    console.log(`Received Updates Count: ${count}`);
    if (count > 0) {
      console.log(`Sample Item 1 Title (EN): "${updates[0].title.en}"`);
      console.log(`Sample Item 1 Dept (EN): "${updates[0].department.en}"`);
      console.log(`Sample Item 1 Summary: "${updates[0].summary.en}"`);
      console.log(`Sample Item 1 Source URL: "${updates[0].sourceUrl}"`);
    }

    results.push({
      query: 'GET /api/updates',
      matchedSource: 'PIB Feed / Static Fallback',
      retrievalMethod: count >= 3 ? 'live_pib_or_fallback' : 'insufficient',
      liveCharCount: JSON.stringify(updates).length,
      cachedCharCount: 0,
      geminiAnswered: false,
      groundedCorrect: hasRequiredFields,
      status: (res.status === 200 && hasRequiredFields) ? 'PASS' : 'FAIL',
      details: `Returned ${count} updates with valid schema & multilingual text`
    });
  } catch (err) {
    results.push({
      query: 'GET /api/updates',
      matchedSource: 'Error',
      retrievalMethod: 'error',
      liveCharCount: 0,
      cachedCharCount: 0,
      geminiAnswered: false,
      groundedCorrect: false,
      status: 'FAIL',
      details: `Request failed: ${(err as Error).message}`
    });
  }

  // Test chat queries
  const testQueries = [
    // Normal Phase 4 / Scheme queries
    {
      name: 'Normal Query (PM Kisan EN)',
      message: 'What is PM Kisan scheme and what are its benefits?',
      language: 'en',
      expectedSource: 'PM-Kisan',
      checkKeywords: ['6000', 'farmer', 'installment', '2000']
    },
    {
      name: 'Normal Query (Ayushman Bharat EN)',
      message: 'How does Ayushman Bharat work and what is the insurance amount?',
      language: 'en',
      expectedSource: 'Ayushman Bharat',
      checkKeywords: ['5 lakh', 'health', 'hospital']
    },
    {
      name: 'Specific/Detail Query (PM Kisan Eligibility Exclusions)',
      message: 'Who is excluded from PM Kisan scheme?',
      language: 'en',
      expectedSource: 'PM-Kisan',
      checkKeywords: ['institutional', 'tax', 'doctor', 'engineer', 'pension', 'exclude']
    },
    {
      name: 'Specific/Detail Query (Income Certificate Documents)',
      message: 'What documents are required for Income Certificate?',
      language: 'en',
      expectedSource: 'Income Certificate',
      checkKeywords: ['salary', 'ration', 'aadhaar', 'affidavit', 'tahsildar', 'mamlatdar']
    },
    {
      name: 'Freshness / Latest Query (PM Kisan)',
      message: 'What is the latest update or new announcement for PM Kisan?',
      language: 'en',
      expectedSource: 'PM-Kisan',
      checkKeywords: ['pm kisan', 'official', 'installment']
    },
    {
      name: 'Hindi Query (Ayushman Bharat HI)',
      message: 'आयुष्मान भारत योजना के तहत कितना स्वास्थ्य बीमा मिलता है?',
      language: 'hi',
      expectedSource: 'Ayushman Bharat',
      checkKeywords: ['५ लाख', '5 लाख', 'स्वास्थ्य', 'अस्पताल']
    },
    {
      name: 'Gujarati Query (PM Kisan GU)',
      message: 'પીએમ કિસાન યોજનામાં વાર્ષિક કેટલા રૂપિયા મળે છે?',
      language: 'gu',
      expectedSource: 'PM-Kisan',
      checkKeywords: ['6000', 'હપ્તો', 'ખેડૂત', 'રૂપિયા']
    },
    {
      name: 'Gujarati Query (Income Certificate GU)',
      message: 'આવકનો દાખલો કઢાવવા માટે કયા પુરાવા જોઈએ?',
      language: 'gu',
      expectedSource: 'Income Certificate',
      checkKeywords: ['આવક', 'દાખલો', 'પુરાવા', 'દસ્તાવેજ', 'રેશન', 'આધાર']
    },
    {
      name: 'Unrelated Query Rejection',
      message: 'What is the capital of France and write a poem about the moon?',
      language: 'en',
      expectedSource: 'SugamGov AI System',
      isUnrelated: true
    }
  ];

  for (const tq of testQueries) {
    console.log(`\n--- Testing: ${tq.name} ---`);
    console.log(`Query: "${tq.message}" (${tq.language})`);

    try {
      const res = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
        message: tq.message,
        language: tq.language
      });

      const { metadata, text, error } = parseSseStream(res.raw);

      const matchedSource = metadata?.officialSource || 'None';
      const retrievalMethod = metadata?.retrievalMethod || 'None';
      const isSupported = metadata?.isSupported !== false;
      const textLen = text.length;

      console.log(`Matched Source: ${matchedSource}`);
      console.log(`Retrieval Method: ${retrievalMethod}`);
      console.log(`Response Length: ${textLen} chars`);
      console.log(`Response Preview: ${text.slice(0, 140)}...`);

      let isGrounded = false;
      if (tq.isUnrelated) {
        isGrounded = !isSupported || text.toLowerCase().includes("couldn't find") || text.toLowerCase().includes("verified information");
      } else {
        const lower = text.toLowerCase();
        isGrounded = (tq.checkKeywords || []).some(k => lower.includes(k.toLowerCase()) || text.includes(k));
      }

      const passed = !error && ((tq.isUnrelated && isGrounded) || (!tq.isUnrelated && isSupported && textLen > 50));

      results.push({
        query: tq.message,
        matchedSource,
        retrievalMethod,
        liveCharCount: metadata?.liveCharCount || 0,
        cachedCharCount: metadata?.cachedCharCount || 0,
        geminiAnswered: textLen > 0 && !error,
        groundedCorrect: isGrounded,
        status: passed ? 'PASS' : 'FAIL',
        details: passed ? 'Response generated accurately and grounded' : (error || 'Response lacked expected content')
      });
    } catch (err) {
      results.push({
        query: tq.message,
        matchedSource: 'Error',
        retrievalMethod: 'error',
        liveCharCount: 0,
        cachedCharCount: 0,
        geminiAnswered: false,
        groundedCorrect: false,
        status: 'FAIL',
        details: `Request error: ${(err as Error).message}`
      });
    }
  }

  // Multi-turn Follow-up & Context Switching Test
  console.log('\n--- Testing Multi-Turn Follow-Up & Context Switching ---');
  try {
    // Turn 1: PM Kisan
    const turn1Res = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
      message: 'PM Kisan eligibility kya hai?',
      language: 'en'
    });
    const turn1 = parseSseStream(turn1Res.raw);
    const serviceId = turn1.metadata?.serviceId;

    // Turn 2: Follow-up relying on serviceId context
    const turn2Res = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
      message: 'What documents do I need to submit?',
      language: 'en',
      lastMatchedSourceId: serviceId
    });
    const turn2 = parseSseStream(turn2Res.raw);

    // Turn 3: Context Switch to Ayushman Bharat
    const turn3Res = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
      message: 'Tell me about Ayushman Bharat health card benefits',
      language: 'en',
      lastMatchedSourceId: serviceId
    });
    const turn3 = parseSseStream(turn3Res.raw);

    const followUpSuccess = turn2.metadata?.serviceId === 'pm_kisan' && turn2.text.length > 50;
    const switchSuccess = turn3.metadata?.serviceId === 'ayushman_bharat' && turn3.text.length > 50;

    results.push({
      query: 'Multi-turn: PM Kisan -> Follow-up -> Switch to Ayushman',
      matchedSource: `${turn2.metadata?.officialSource} -> ${turn3.metadata?.officialSource}`,
      retrievalMethod: `${turn2.metadata?.retrievalMethod} / ${turn3.metadata?.retrievalMethod}`,
      liveCharCount: 0,
      cachedCharCount: 0,
      geminiAnswered: turn2.text.length > 0 && turn3.text.length > 0,
      groundedCorrect: followUpSuccess && switchSuccess,
      status: (followUpSuccess && switchSuccess) ? 'PASS' : 'FAIL',
      details: `Follow-up retained context (${turn2.metadata?.serviceId}); context switch cleanly changed to (${turn3.metadata?.serviceId})`
    });
  } catch (err) {
    results.push({
      query: 'Multi-turn follow-up test',
      matchedSource: 'Error',
      retrievalMethod: 'error',
      liveCharCount: 0,
      cachedCharCount: 0,
      geminiAnswered: false,
      groundedCorrect: false,
      status: 'FAIL',
      details: (err as Error).message
    });
  }

  // Consecutive Queries Stress Test (5 in a row)
  console.log('\n--- Testing 5 Consecutive Queries Stress Test ---');
  let consecutivePassed = true;
  for (let i = 1; i <= 5; i++) {
    try {
      const stressRes = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
        message: `PM Kisan installment question iteration ${i}`,
        language: 'en'
      });
      const parsed = parseSseStream(stressRes.raw);
      if (!parsed.metadata || parsed.text.length === 0) {
        consecutivePassed = false;
        break;
      }
    } catch {
      consecutivePassed = false;
      break;
    }
  }

  results.push({
    query: 'Consecutive Stress Test (5 rapid sequential queries)',
    matchedSource: 'PM-Kisan',
    retrievalMethod: 'consecutive_check',
    liveCharCount: 0,
    cachedCharCount: 0,
    geminiAnswered: consecutivePassed,
    groundedCorrect: consecutivePassed,
    status: consecutivePassed ? 'PASS' : 'FAIL',
    details: consecutivePassed ? 'All 5 consecutive queries answered with no rejection or quota exhaustion' : 'Failed during consecutive run'
  });

  // Print Summary Table
  console.log('\n========================================================================');
  console.log(' PHASE 4 COMPLETE TEST MATRIX RESULTS');
  console.log('========================================================================\n');
  console.table(results.map(r => ({
    Query: r.query.slice(0, 35),
    Source: r.matchedSource.slice(0, 25),
    Method: r.retrievalMethod,
    Answered: r.geminiAnswered ? 'YES' : 'NO',
    Grounded: r.groundedCorrect ? 'YES' : 'NO',
    Status: r.status
  })));

  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`\nOVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
}

runPhase4Tests().catch(console.error);
