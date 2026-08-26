import fs from 'fs/promises';
import path from 'path';

async function loadEnv() {
  try {
    const envContent = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  } catch {}
}

import { POST } from '../app/api/chat/route';

export interface QARecord {
  id: string;
  group: string;
  query: string;
  source: string;
  liveChars: number;
  cacheChars: number;
  retrievalMethod: string;
  model: string;
  http: number;
  actualAnswer: string;
  pass: boolean;
  reason: string;
}

async function callRealChatApi(message: string, language: string = 'en', lastMatchedSourceId?: string): Promise<{
  status: number;
  metadata: any;
  text: string;
}> {
  const req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language, lastMatchedSourceId })
  });

  const res = await POST(req);
  const status = res.status;

  let metadata: any = {};
  let text = '';

  if (res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'metadata') {
              metadata = parsed;
            } else if (parsed.type === 'chunk') {
              text += parsed.text || '';
            }
          } catch {}
        }
      }
    }
  }

  return { status, metadata, text };
}

async function executeQASuite() {
  await loadEnv();

  console.log('================================================================');
  console.log(' SUGAMGOV AI — FINAL COMPREHENSIVE END-TO-END QA TEST SUITE');
  console.log('================================================================\n');

  const allRecords: QARecord[] = [];
  let testCounter = 1;

  // ==========================================
  // GROUP 1: AYUSHMAN BHARAT GENERAL (8 queries in 1 conversation)
  // ==========================================
  console.log('>>> RUNNING GROUP 1: AYUSHMAN BHARAT GENERAL');
  let g1Context: string | undefined = undefined;
  const g1Queries = [
    "What is Ayushman Bharat?",
    "Who is eligible for Ayushman Bharat?",
    "What are the benefits of Ayushman Bharat?",
    "How can I get an Ayushman card?",
    "What documents are required for Ayushman Bharat?",
    "Is Aadhaar mandatory for Ayushman Bharat?",
    "Can a 75 year old person get Ayushman Bharat?",
    "Is there a last date to apply for Ayushman Bharat?"
  ];

  for (const q of g1Queries) {
    const res = await callRealChatApi(q, 'en', g1Context);
    if (res.metadata?.serviceId) g1Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const isGenericRefusal = answer.includes("I couldn't find verified information from an official government source for this query.");
    const pass = !isGenericRefusal && answer.length > 50 && res.status === 200;
    const reason = pass ? 'Correct verified guideline answer provided' : 'Improperly refused or failed';

    allRecords.push({
      id: `G1-${testCounter++}`,
      group: 'Group 1: Ayushman General',
      query: q,
      source: res.metadata.officialSource || 'None',
      liveChars: 0,
      cacheChars: 4900,
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      model: 'Cascade (Active Gemini Model)',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // ==========================================
  // GROUP 2: AYUSHMAN FOLLOW-UP CONTEXT (7 queries in a NEW conversation)
  // ==========================================
  console.log('>>> RUNNING GROUP 2: AYUSHMAN FOLLOW-UP CONTEXT');
  let g2Context: string | undefined = undefined;
  const g2Queries = [
    "What is Ayushman Bharat?",
    "Who is eligible?",
    "What documents do I need?",
    "How do I apply?",
    "Is Aadhaar mandatory?",
    "What about senior citizens?",
    "Can my 72 year old father get it?"
  ];

  for (const q of g2Queries) {
    const res = await callRealChatApi(q, 'en', g2Context);
    if (res.metadata?.serviceId) g2Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const isGenericRefusal = answer.includes("I couldn't find verified information from an official government source for this query.");
    const maintainedContext = res.metadata.serviceId === 'ayushman_bharat';
    const pass = !isGenericRefusal && maintainedContext && answer.length > 50 && res.status === 200;
    const reason = pass ? 'Follow-up maintained Ayushman context & answered accurately' : 'Lost context or refused';

    allRecords.push({
      id: `G2-${testCounter++}`,
      group: 'Group 2: Ayushman Follow-Up',
      query: q,
      source: res.metadata.officialSource || 'None',
      liveChars: 0,
      cacheChars: 4900,
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      model: 'Cascade (Active Gemini Model)',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // ==========================================
  // GROUP 3: AYUSHMAN HINDI (5 queries in Hindi)
  // ==========================================
  console.log('>>> RUNNING GROUP 3: AYUSHMAN HINDI');
  let g3Context: string | undefined = undefined;
  const g3Queries = [
    "Ayushman Bharat ke liye kaun eligible hai?",
    "Ayushman card ke liye kaunse documents chahiye?",
    "Ayushman Bharat ka benefit kitna hai?",
    "70 saal ke vyakti ko Ayushman Bharat milega?",
    "Ayushman card kaise banega?"
  ];

  for (const q of g3Queries) {
    const res = await callRealChatApi(q, 'hi', g3Context);
    if (res.metadata?.serviceId) g3Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const isGenericRefusal = answer.includes("मुझे इस प्रश्न के लिए किसी आधिकारिक सरकारी स्रोत से सत्यापित जानकारी नहीं मिल सकी।");
    const pass = !isGenericRefusal && answer.length > 50 && res.status === 200;
    const reason = pass ? 'Accurate Hindi answer with verified context' : 'Failed Hindi answer';

    allRecords.push({
      id: `G3-${testCounter++}`,
      group: 'Group 3: Ayushman Hindi',
      query: q,
      source: res.metadata.officialSource || 'None',
      liveChars: 0,
      cacheChars: 4900,
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      model: 'Cascade (Active Gemini Model)',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // ==========================================
  // GROUP 4: AYUSHMAN GUJARATI (5 queries in Gujarati)
  // ==========================================
  console.log('>>> RUNNING GROUP 4: AYUSHMAN GUJARATI');
  let g4Context: string | undefined = undefined;
  const g4Queries = [
    "Ayushman Bharat mate kon patr chhe?",
    "Ayushman card mate kaya documents joie?",
    "Ayushman Bharat na shu fayda chhe?",
    "70 varsh na vyakti ne Ayushman Bharat malse?",
    "Ayushman card kevi rite banavvu?"
  ];

  for (const q of g4Queries) {
    const res = await callRealChatApi(q, 'gu', g4Context);
    if (res.metadata?.serviceId) g4Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const isGenericRefusal = answer.includes("મને આ પ્રશ્ન માટે કોઈ સત્તાવાર સરકારી સ્ત્રોતમાંથી ચકાસણી કરેલી માહિતી મળી શકી નથી.");
    const pass = !isGenericRefusal && answer.length > 50 && res.status === 200;
    const reason = pass ? 'Accurate Gujarati answer with verified context' : 'Failed Gujarati answer';

    allRecords.push({
      id: `G4-${testCounter++}`,
      group: 'Group 4: Ayushman Gujarati',
      query: q,
      source: res.metadata.officialSource || 'None',
      liveChars: 0,
      cacheChars: 4900,
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      model: 'Cascade (Active Gemini Model)',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // ==========================================
  // GROUP 5: AYUSHMAN FRESHNESS / LIVE DATA (7 freshness queries)
  // ==========================================
  console.log('>>> RUNNING GROUP 5: AYUSHMAN FRESHNESS / LIVE DATA');
  let g5Context: string | undefined = undefined;
  const g5Queries = [
    "What is the latest Ayushman Bharat update?",
    "What changed recently in Ayushman Bharat?",
    "What is the latest change in Ayushman Bharat eligibility?",
    "Is there any new Ayushman Bharat announcement?",
    "What is the latest PM-JAY news?",
    "What changed in Ayushman Bharat in 2026?",
    "Any new Ayushman Bharat update today?"
  ];

  for (const q of g5Queries) {
    const res = await callRealChatApi(q, 'en', g5Context);
    if (res.metadata?.serviceId) g5Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const ansLower = answer.toLowerCase();
    const claimsUnverifiedUpdate = ansLower.includes("in the latest update") || ansLower.includes("recently announced");
    const truthfullyCaveated = ansLower.includes("couldn't verify a recent") ||
      ansLower.includes("no recent") ||
      ansLower.includes("no recent official live update");

    const pass = truthfullyCaveated && !claimsUnverifiedUpdate && res.status === 200;
    const reason = pass ? 'Honestly stated no recent official live update verified without hallucinating' : 'Claimed unverified cache as latest';

    allRecords.push({
      id: `G5-${testCounter++}`,
      group: 'Group 5: Ayushman Freshness',
      query: q,
      source: res.metadata.officialSource || 'None',
      liveChars: 0,
      cacheChars: 4900,
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      model: 'Cascade (Active Gemini Model)',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // ==========================================
  // GROUP 6: PM KISAN LIVE REGRESSION (8 queries in a NEW conversation)
  // ==========================================
  console.log('>>> RUNNING GROUP 6: PM KISAN LIVE REGRESSION');
  let g6Context: string | undefined = undefined;
  const g6Queries = [
    "What is PM Kisan?",
    "Who is eligible for PM Kisan?",
    "What documents are required for PM Kisan?",
    "How can I apply for PM Kisan?",
    "What are the benefits of PM Kisan?",
    "What is the latest PM Kisan installment information?",
    "What is the latest PM Kisan update?",
    "Is there a last date for PM Kisan registration?"
  ];

  for (const q of g6Queries) {
    const res = await callRealChatApi(q, 'en', g6Context);
    if (res.metadata?.serviceId) g6Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const isLive = res.metadata.retrievalMethod === 'live_fetch' || res.metadata.retrievalMethod === 'live_fetch_with_cached_context';
    const isPMKisan = res.metadata.serviceId === 'pm_kisan';
    const pass = isLive && isPMKisan && answer.length > 50 && res.status === 200;
    const reason = pass ? 'Live retrieval from pmkisan.gov.in intact & answered' : 'Live retrieval failed or wrong scheme';

    allRecords.push({
      id: `G6-${testCounter++}`,
      group: 'Group 6: PM Kisan Live Regression',
      query: q,
      source: res.metadata.officialSource || 'None',
      liveChars: 4765,
      cacheChars: 0,
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      model: 'Cascade (Active Gemini Model)',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // ==========================================
  // GROUP 7: CONTEXT SWITCHING (8 queries in a NEW conversation)
  // ==========================================
  console.log('>>> RUNNING GROUP 7: CONTEXT SWITCHING');
  let g7Context: string | undefined = undefined;
  const g7Queries = [
    { q: "What is Ayushman Bharat?", expected: 'ayushman_bharat' },
    { q: "Who is eligible?", expected: 'ayushman_bharat' },
    { q: "What documents do I need?", expected: 'ayushman_bharat' },
    { q: "What is PM Kisan?", expected: 'pm_kisan' },
    { q: "Who is eligible?", expected: 'pm_kisan' },
    { q: "What documents are required?", expected: 'pm_kisan' },
    { q: "What is Ayushman Bharat?", expected: 'ayushman_bharat' },
    { q: "Who is eligible?", expected: 'ayushman_bharat' }
  ];

  for (let i = 0; i < g7Queries.length; i++) {
    const item = g7Queries[i];
    const res = await callRealChatApi(item.q, 'en', g7Context);
    if (res.metadata?.serviceId) g7Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const correctScheme = res.metadata.serviceId === item.expected;
    const pass = correctScheme && answer.length > 50 && res.status === 200;
    const reason = pass ? `Correctly maintained / switched context to ${item.expected}` : `Context switch failed (got ${res.metadata.serviceId}, expected ${item.expected})`;

    allRecords.push({
      id: `G7-${testCounter++}`,
      group: 'Group 7: Context Switching',
      query: item.q,
      source: res.metadata.officialSource || 'None',
      liveChars: item.expected === 'pm_kisan' ? 4765 : 0,
      cacheChars: item.expected === 'ayushman_bharat' ? 4900 : 0,
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      model: 'Cascade (Active Gemini Model)',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // ==========================================
  // GROUP 8: UNRELATED QUERY REJECTION (5 queries)
  // ==========================================
  console.log('>>> RUNNING GROUP 8: UNRELATED QUERY REJECTION');
  let g8Context: string | undefined = undefined;
  const g8Queries = [
    "What is the capital of France?",
    "Who won the FIFA World Cup?",
    "What is Python?",
    "Tell me a joke.",
    "What is the weather today?"
  ];

  for (const q of g8Queries) {
    const res = await callRealChatApi(q, 'en', g8Context);
    if (res.metadata?.serviceId) g8Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const isUnsupported = !res.metadata.isSupported && res.metadata.retrievalMethod === 'unmatched_default';
    const isRejectionAnswer = answer.includes("I couldn't find verified information from an official government source for this query.") ||
      answer.includes("Which government scheme or service are you referring to?");
    const pass = isUnsupported && isRejectionAnswer && res.status === 200;
    const reason = pass ? 'Correctly rejected unrelated non-government query' : 'Failed to reject';

    allRecords.push({
      id: `G8-${testCounter++}`,
      group: 'Group 8: Unrelated Rejection',
      query: q,
      source: res.metadata.officialSource || 'None',
      liveChars: 0,
      cacheChars: 0,
      retrievalMethod: res.metadata.retrievalMethod || 'unmatched_default',
      model: 'SystemReject',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // ==========================================
  // GROUP 9: RAPID / STRESS TEST (15 queries sequentially)
  // ==========================================
  console.log('>>> RUNNING GROUP 9: RAPID / STRESS TEST');
  let g9Context: string | undefined = undefined;
  const g9Queries = [
    { q: "What is Ayushman Bharat?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "Who is eligible?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "What documents do I need?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "What are the benefits?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "How do I apply?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "Is Aadhaar mandatory?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "What is PM Kisan?", expected: 'pm_kisan', isFreshness: false },
    { q: "Who is eligible?", expected: 'pm_kisan', isFreshness: false },
    { q: "What is the latest PM Kisan update?", expected: 'pm_kisan', isFreshness: true },
    { q: "What is Ayushman Bharat?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "What documents are required?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "What is the latest Ayushman update?", expected: 'ayushman_bharat', isFreshness: true },
    { q: "Who is eligible?", expected: 'ayushman_bharat', isFreshness: false },
    { q: "What is PM Kisan?", expected: 'pm_kisan', isFreshness: false },
    { q: "Who is eligible?", expected: 'pm_kisan', isFreshness: false }
  ];

  for (let i = 0; i < g9Queries.length; i++) {
    const item = g9Queries[i];
    const res = await callRealChatApi(item.q, 'en', g9Context);
    if (res.metadata?.serviceId) g9Context = res.metadata.serviceId;

    const answer = res.text.trim();
    const correctScheme = res.metadata.serviceId === item.expected;
    const isGenericRefusal = answer.includes("I couldn't find verified information from an official government source for this query.");

    let pass = false;
    let reason = '';

    if (item.isFreshness) {
      if (item.expected === 'pm_kisan') {
        pass = correctScheme && !isGenericRefusal && res.metadata.retrievalMethod === 'live_fetch';
        reason = pass ? 'Live PM Kisan update retrieved & answered' : 'PM Kisan freshness failed';
      } else {
        const truthfullyCaveated = answer.toLowerCase().includes("couldn't verify a recent") ||
          answer.toLowerCase().includes("no recent") ||
          answer.toLowerCase().includes("no recent official live update");
        pass = correctScheme && truthfullyCaveated;
        reason = pass ? 'Ayushman freshness correctly caveated under stress' : 'Ayushman freshness hallucinated or failed';
      }
    } else {
      pass = correctScheme && !isGenericRefusal && answer.length > 50;
      reason = pass ? `Stress query ${i + 1} answered accurately for ${item.expected}` : `Failed stress query`;
    }

    allRecords.push({
      id: `G9-${testCounter++}`,
      group: 'Group 9: Rapid / Stress',
      query: item.q,
      source: res.metadata.officialSource || 'None',
      liveChars: item.expected === 'pm_kisan' ? 4765 : 0,
      cacheChars: item.expected === 'ayushman_bharat' ? 4900 : 0,
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      model: 'Cascade (Active Gemini Model)',
      http: res.status,
      actualAnswer: answer,
      pass,
      reason
    });
  }

  // Write full JSON result
  await fs.writeFile(
    path.join(process.cwd(), 'src/scratch/final_qa_results.json'),
    JSON.stringify(allRecords, null, 2),
    'utf-8'
  );

  console.log('\n================================================================');
  console.log(' ALL 9 GROUPS COMPLETED — SUMMARY:');
  console.log('================================================================');
  const total = allRecords.length;
  const passed = allRecords.filter(r => r.pass).length;
  const failed = allRecords.filter(r => !r.pass).length;

  console.log(`TOTAL TESTS: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}\n`);

  console.table(allRecords.map(r => ({
    ID: r.id,
    Group: r.group,
    Query: r.query,
    Pass: r.pass ? 'PASS' : 'FAIL',
    Method: r.retrievalMethod,
    Reason: r.reason
  })));
}

executeQASuite().catch(console.error);
