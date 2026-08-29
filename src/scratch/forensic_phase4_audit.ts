import http from 'http';
import https from 'https';

interface AuditItem {
  category: string;
  testCase: string;
  retrievalMethod: string;
  source: string;
  details: string;
  status: 'PASS' | 'FAIL';
}

const auditResults: AuditItem[] = [];

function makeHttpRequest(url: string, method = 'GET', body?: Record<string, unknown>): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Phase4ForensicAuditor/1.0'
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
          // Could be stream
        }
        resolve({ status: res.statusCode || 0, headers: res.headers, data: json, raw: data });
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

async function runForensicAudit() {
  console.log('========================================================================');
  console.log(' PHASE 4 FORENSIC VERIFICATION AUDIT');
  console.log('========================================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // --- 1. /api/updates Forensic Tests ---
  console.log('1. Auditing /api/updates Endpoint & Live Feed Validation...');
  try {
    const res = await makeHttpRequest(`${BASE_URL}/api/updates`);
    const updates = res.data;
    const isArray = Array.isArray(updates);
    const count = isArray ? updates.length : 0;
    const cacheControl = res.headers['cache-control'] || '';

    // Check minimum 3 items rule
    const min3Rule = count >= 3;

    // Check fields completeness (Title, Summary, Department, Date, SourceUrl, SourceName)
    const hasAllFields = isArray && updates.every((u: any) =>
      u.id &&
      u.title?.en && u.title?.hi && u.title?.gu &&
      u.summary?.en && u.summary?.hi && u.summary?.gu &&
      u.department?.en && u.department?.hi && u.department?.gu &&
      u.date && /^\d{4}-\d{2}-\d{2}$/.test(u.date) &&
      u.sourceUrl && u.sourceUrl.startsWith('https://') &&
      u.sourceName &&
      u.category
    );

    // Check HTTPS and official domain strictly
    const officialDomains = ['pib.gov.in', 'www.pib.gov.in', 'pmkisan.gov.in', 'pmjay.gov.in', 'services.india.gov.in'];
    const domainsValid = isArray && updates.every((u: any) => {
      try {
        const uHost = new URL(u.sourceUrl).hostname.toLowerCase();
        return officialDomains.some(d => uHost === d || uHost.endsWith('.gov.in') || uHost.endsWith('.nic.in'));
      } catch {
        return false;
      }
    });

    auditResults.push({
      category: 'Phase 4 Updates',
      testCase: 'GET /api/updates HTTP 200 & Cache-Control',
      retrievalMethod: 'live_pib_or_fallback',
      source: 'PIB Feed',
      details: `Status: ${res.status}, Cache-Control: ${cacheControl}`,
      status: (res.status === 200 && cacheControl.includes('max-age')) ? 'PASS' : 'FAIL'
    });

    auditResults.push({
      category: 'Phase 4 Updates',
      testCase: 'Minimum 3 Valid Items Rule',
      retrievalMethod: 'live_pib_or_fallback',
      source: 'PIB Feed',
      details: `Retrieved ${count} items (minimum 3 required)`,
      status: min3Rule ? 'PASS' : 'FAIL'
    });

    auditResults.push({
      category: 'Phase 4 Updates',
      testCase: 'Multilingual Schema Completeness (EN, HI, GU)',
      retrievalMethod: 'live_pib_or_fallback',
      source: 'PIB Feed',
      details: `All items have complete title, summary, department in EN, HI, GU, and formatted date`,
      status: hasAllFields ? 'PASS' : 'FAIL'
    });

    auditResults.push({
      category: 'Phase 4 Updates',
      testCase: 'Official Source HTTPS & Domain Validation',
      retrievalMethod: 'live_pib_or_fallback',
      source: 'PIB Feed',
      details: `All URLs strictly use HTTPS and verified .gov.in domains`,
      status: domainsValid ? 'PASS' : 'FAIL'
    });
  } catch (err) {
    auditResults.push({
      category: 'Phase 4 Updates',
      testCase: 'GET /api/updates Execution',
      retrievalMethod: 'error',
      source: 'None',
      details: (err as Error).message,
      status: 'FAIL'
    });
  }

  // --- 2. Fallback Verification ---
  console.log('\n2. Auditing Static Fallback Integrity...');
  try {
    const { governmentUpdates } = await import('../retrieval/updatesData');
    const fallbackCount = governmentUpdates.length;
    const fallbackValid = fallbackCount >= 3 && governmentUpdates.every(u =>
      u.id && u.title.en && u.title.hi && u.title.gu &&
      u.summary.en && u.summary.hi && u.summary.gu &&
      u.department.en && u.department.hi && u.department.gu &&
      u.sourceUrl.startsWith('https://')
    );

    auditResults.push({
      category: 'Phase 4 Updates',
      testCase: 'Verified Static Fallback Integrity',
      retrievalMethod: 'static_fallback_data',
      source: 'updatesData.ts',
      details: `${fallbackCount} verified static fallback announcements across PM Kisan, Ayushman Bharat, and Income Certificate`,
      status: fallbackValid ? 'PASS' : 'FAIL'
    });
  } catch (err) {
    auditResults.push({
      category: 'Phase 4 Updates',
      testCase: 'Verified Static Fallback Integrity',
      retrievalMethod: 'error',
      source: 'updatesData.ts',
      details: (err as Error).message,
      status: 'FAIL'
    });
  }

  // --- 3. Chat & Retrieval Regressions ---
  console.log('\n3. Auditing Core Schemes & Chat Functionality...');

  const chatTests = [
    {
      name: 'PM Kisan Live Retrieval (EN)',
      msg: 'What is PM Kisan Samman Nidhi and what are its key features?',
      lang: 'en',
      expectedMethod: ['live_fetch', 'live_fetch_with_cached_context'],
      keywords: ['pm-kisan', 'kisan', 'farmer', 'installment']
    },
    {
      name: 'Ayushman Bharat Retrieval & Grounding (EN)',
      msg: 'What is Ayushman Bharat health insurance limit and hospital coverage?',
      lang: 'en',
      expectedMethod: ['cached_official_fallback', 'live_fetch_with_cached_context', 'live_fetch'],
      keywords: ['5 lakh', 'health', 'hospital', 'coverage']
    },
    {
      name: 'Income Certificate Guidelines (EN)',
      msg: 'What is the procedure and documents needed for Income Certificate?',
      lang: 'en',
      expectedMethod: ['live_fetch_with_cached_context', 'cached_official_fallback'],
      keywords: ['salary', 'affidavit', 'certificate', 'tahsildar', 'mamlatdar']
    },
    {
      name: 'Freshness / Anti-Hallucination Query (PM Kisan)',
      msg: 'What is the latest update or new change in PM Kisan for 2025/2026?',
      lang: 'en',
      expectedMethod: ['live_fetch', 'live_fetch_with_cached_context'],
      keywords: ['pm kisan', 'installment', 'official']
    },
    {
      name: 'Hindi Multilingual Grounding (HI)',
      msg: 'पीएम किसान योजना क्या है और इसके क्या लाभ हैं?',
      lang: 'hi',
      expectedMethod: ['live_fetch', 'live_fetch_with_cached_context'],
      keywords: ['किसान', 'पीएम', 'योजना', 'किस्त', 'लाभ']
    },
    {
      name: 'Gujarati Multilingual Grounding (GU)',
      msg: 'આયુષ્માન ભારત યોજના હેઠળ કેટલા રૂપિયા સુધીની મફત સારવાર મળે છે?',
      lang: 'gu',
      expectedMethod: ['cached_official_fallback', 'live_fetch_with_cached_context'],
      keywords: ['૫ લાખ', '5 લાખ', 'પાંચ લાખ', 'સારવાર', 'હોસ્પિટલ', 'આયુષ્માન']
    },
    {
      name: 'Unrelated Query Rejection',
      msg: 'How do I bake a chocolate cake and what is the recipe?',
      lang: 'en',
      expectedMethod: 'unmatched_default',
      isUnrelated: true
    }
  ];

  for (const ct of chatTests) {
    try {
      const res = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
        message: ct.msg,
        language: ct.lang
      });
      const { metadata, text, error } = parseSseStream(res.raw);
      const isSupported = metadata?.isSupported !== false;
      const textLen = text.length;

      let passed = false;
      if (ct.isUnrelated) {
        passed = !isSupported || text.includes("couldn't find verified information") || text.includes("Which government scheme");
      } else {
        const expectedMethods = Array.isArray(ct.expectedMethod) ? ct.expectedMethod : [ct.expectedMethod];
        const methodMatch = expectedMethods.includes(metadata?.retrievalMethod);
        const lower = text.toLowerCase();
        const keywordMatch = ct.keywords ? ct.keywords.some(k => lower.includes(k.toLowerCase()) || text.includes(k)) : true;
        passed = !error && isSupported && methodMatch && keywordMatch && textLen > 50;
      }

      auditResults.push({
        category: 'Chat Regression',
        testCase: ct.name,
        retrievalMethod: metadata?.retrievalMethod || 'None',
        source: metadata?.officialSource || 'None',
        details: `Response length: ${textLen} chars, Method: ${metadata?.retrievalMethod}`,
        status: passed ? 'PASS' : 'FAIL'
      });
    } catch (err) {
      auditResults.push({
        category: 'Chat Regression',
        testCase: ct.name,
        retrievalMethod: 'error',
        source: 'None',
        details: (err as Error).message,
        status: 'FAIL'
      });
    }
  }

  // --- 4. Multi-Turn Follow-Up & Context Switching ---
  console.log('\n4. Auditing Multi-turn Follow-up and Context Switching...');
  try {
    // Turn 1: PM Kisan
    const t1 = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
      message: 'What is PM Kisan?',
      language: 'en'
    });
    const p1 = parseSseStream(t1.raw);
    const serviceId = p1.metadata?.serviceId;

    // Turn 2: Follow-up question without naming PM Kisan
    const t2 = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
      message: 'Who is not eligible for this?',
      language: 'en',
      lastMatchedSourceId: serviceId
    });
    const p2 = parseSseStream(t2.raw);
    const followUpRetained = p2.metadata?.serviceId === 'pm_kisan' && p2.text.toLowerCase().includes('exclude');

    // Turn 3: Context Switch to Income Certificate
    const t3 = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
      message: 'How do I apply for an Income Certificate?',
      language: 'en',
      lastMatchedSourceId: serviceId
    });
    const p3 = parseSseStream(t3.raw);
    const switchClean = p3.metadata?.serviceId === 'income_certificate' && p3.text.length > 50;

    auditResults.push({
      category: 'Multi-turn & Context',
      testCase: 'Context Retention on Follow-up Question',
      retrievalMethod: p2.metadata?.retrievalMethod || 'None',
      source: p2.metadata?.officialSource || 'None',
      details: `Retained PM Kisan context (${p2.metadata?.serviceId}) and listed exclusions`,
      status: followUpRetained ? 'PASS' : 'FAIL'
    });

    auditResults.push({
      category: 'Multi-turn & Context',
      testCase: 'Context Switching on New Topic',
      retrievalMethod: p3.metadata?.retrievalMethod || 'None',
      source: p3.metadata?.officialSource || 'None',
      details: `Cleanly switched from PM Kisan to Income Certificate (${p3.metadata?.serviceId})`,
      status: switchClean ? 'PASS' : 'FAIL'
    });
  } catch (err) {
    auditResults.push({
      category: 'Multi-turn & Context',
      testCase: 'Multi-turn Execution',
      retrievalMethod: 'error',
      source: 'None',
      details: (err as Error).message,
      status: 'FAIL'
    });
  }

  // --- 5. Sequential & Repeated Query Stress Test ---
  console.log('\n5. Auditing Sequential & Repeated Queries...');
  let repeatedSuccess = true;
  for (let i = 1; i <= 3; i++) {
    try {
      const rep = await makeHttpRequest(`${BASE_URL}/api/chat`, 'POST', {
        message: 'PM Kisan installment query ' + i,
        language: 'en'
      });
      const parsed = parseSseStream(rep.raw);
      if (!parsed.metadata || parsed.text.length === 0) {
        repeatedSuccess = false;
        break;
      }
    } catch {
      repeatedSuccess = false;
      break;
    }
  }

  auditResults.push({
    category: 'Stress & Stability',
    testCase: 'Sequential Repeated Queries (No 429 / Rejection Bug)',
    retrievalMethod: 'consecutive_check',
    source: 'PM-Kisan',
    details: `Successfully completed repeated sequential requests with zero quota errors or rejections`,
    status: repeatedSuccess ? 'PASS' : 'FAIL'
  });

  // Print Complete Matrix
  console.log('\n========================================================================');
  console.log(' FORENSIC AUDIT COMPLETE RESULTS MATRIX');
  console.log('========================================================================\n');
  console.table(auditResults.map(r => ({
    Category: r.category,
    TestCase: r.testCase.slice(0, 45),
    Method: r.retrievalMethod.slice(0, 25),
    Status: r.status
  })));

  const allPassed = auditResults.every(r => r.status === 'PASS');
  console.log(`\nFORENSIC VERIFICATION RESULT: ${allPassed ? 'ALL AUDIT CHECKS PASSED (100%)' : 'AUDIT CHECKS FAILED'}`);
}

runForensicAudit().catch(console.error);
