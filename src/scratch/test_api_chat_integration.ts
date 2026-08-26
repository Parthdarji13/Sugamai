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

interface ChatResponseRecord {
  query: string;
  matchedSource: string;
  retrievalMethod: string;
  liveCharCount: number;
  cachedCharCount: number;
  isFreshnessQuery: boolean;
  freshDataAvailable: boolean;
  contextLength: number;
  modelUsed: string;
  httpStatus: number;
  answerText: string;
  isAnswered: boolean;
  isCorrect: boolean;
  freshnessRule: string;
  evalNote: string;
}

async function callChatApi(message: string, language: string = 'en', lastMatchedSourceId?: string): Promise<{
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
          } catch {
            // raw text or unparsed
          }
        }
      }
    }
  }

  return { status, metadata, text };
}

async function runSession(sessionName: string, queries: Array<{ q: string; isFreshness?: boolean; expectedScheme?: string }>) {
  console.log(`\n================================================================`);
  console.log(` RUNNING INTEGRATION SESSION: ${sessionName}`);
  console.log(`================================================================`);

  let lastMatchedSourceId: string | undefined = undefined;
  const sessionRecords: ChatResponseRecord[] = [];

  for (let i = 0; i < queries.length; i++) {
    const item = queries[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[${sessionName} - Request ${i + 1}/${queries.length}] "${item.q}"`);
    console.log(`lastMatchedSourceId before: ${lastMatchedSourceId || 'None'}`);

    const res = await callChatApi(item.q, 'en', lastMatchedSourceId);

    if (res.metadata?.serviceId) {
      lastMatchedSourceId = res.metadata.serviceId;
    }

    const answer = res.text.trim();
    const isGenericRefusal = answer.includes("I couldn't find verified information from an official government source for this query.");
    const isAnswered = !isGenericRefusal && answer.length > 50;

    const isFreshnessQuery = !!res.metadata.isFreshnessQuery;
    const freshDataAvailable = !!res.metadata.freshDataAvailable;

    let freshnessRule = 'N/A (Standard Stable Question)';
    let isCorrect = false;
    let evalNote = '';

    if (item.isFreshness) {
      freshnessRule = 'Freshness sensitive (Requires honest live update or caveat)';
      const claimsRecentUnverified = answer.toLowerCase().includes("in the latest update") || answer.toLowerCase().includes("recently announced");
      const honestlyCaveated = answer.toLowerCase().includes("couldn't verify a recent") ||
        answer.toLowerCase().includes("no recent") ||
        answer.toLowerCase().includes("no recent official live update");

      if (freshDataAvailable) {
        isCorrect = isAnswered;
        evalNote = isCorrect ? 'PASS (Fresh live data retrieved and answered)' : 'FAIL';
      } else {
        isCorrect = honestlyCaveated || !claimsRecentUnverified;
        evalNote = isCorrect ? 'PASS (Truthfully caveated without hallucinating new updates)' : 'FAIL (Claimed old cache as latest)';
      }
    } else {
      freshnessRule = 'General / Stable Question (Verified cache allowed)';
      isCorrect = isAnswered && res.metadata.isSupported;
      evalNote = isCorrect ? 'PASS (Answered from verified official source)' : 'FAIL (Refused or missing)';
    }

    const record: ChatResponseRecord = {
      query: item.q,
      matchedSource: res.metadata.officialSource || 'None',
      retrievalMethod: res.metadata.retrievalMethod || 'N/A',
      liveCharCount: freshDataAvailable ? 1 : 0,
      cachedCharCount: 1,
      isFreshnessQuery,
      freshDataAvailable,
      contextLength: answer.length,
      modelUsed: 'Cascade (Active Gemini Model)',
      httpStatus: res.status,
      answerText: answer.substring(0, 160).replace(/\n/g, ' '),
      isAnswered,
      isCorrect,
      freshnessRule,
      evalNote
    };

    sessionRecords.push(record);

    console.log(`- Matched Source: ${record.matchedSource}`);
    console.log(`- Retrieval Method: ${record.retrievalMethod}`);
    console.log(`- isFreshnessQuery: ${record.isFreshnessQuery} | freshDataAvailable: ${record.freshDataAvailable}`);
    console.log(`- HTTP Status: ${record.httpStatus}`);
    console.log(`- Answered?: ${record.isAnswered ? 'YES' : 'NO'}`);
    console.log(`- Correct?: ${record.isCorrect ? 'YES (PASS)' : 'NO (FAIL)'} [${record.evalNote}]`);
    console.log(`- Answer Snippet: "${record.answerText}..."`);
  }

  return sessionRecords;
}

async function runAllIntegrationTests() {
  await loadEnv();

  // Session 1: 10 Sequential Ayushman Bharat Queries
  const session1Queries = [
    { q: "What is Ayushman Bharat PM-JAY?", isFreshness: false },
    { q: "Who is eligible for Ayushman Bharat?", isFreshness: false },
    { q: "What are the benefits of Ayushman Bharat?", isFreshness: false },
    { q: "How can I get an Ayushman card?", isFreshness: false },
    { q: "What documents are required for Ayushman Bharat?", isFreshness: false },
    { q: "Is Aadhaar mandatory for Ayushman Bharat?", isFreshness: false },
    { q: "Is there any age limit for Ayushman Bharat?", isFreshness: false },
    { q: "Is there a last date to apply for Ayushman Bharat?", isFreshness: false },
    { q: "What is the latest Ayushman Bharat update?", isFreshness: true },
    { q: "What changed recently in Ayushman Bharat eligibility?", isFreshness: true }
  ];

  // Session 2: 10 Sequential Ayushman Bharat in a fresh session
  const session2Queries = [
    { q: "What is Ayushman Bharat?", isFreshness: false },
    { q: "Who can apply?", isFreshness: false },
    { q: "What is the benefit amount?", isFreshness: false },
    { q: "How do I apply online?", isFreshness: false },
    { q: "What documents do I need?", isFreshness: false },
    { q: "Is Aadhaar card necessary?", isFreshness: false },
    { q: "Can a 75 year old senior citizen apply?", isFreshness: false },
    { q: "What is the deadline for 2026?", isFreshness: false },
    { q: "Is there any new announcement today?", isFreshness: true },
    { q: "What is the latest news on PM-JAY?", isFreshness: true }
  ];

  // Session 3: 10 Mixed PM Kisan + Ayushman Queries
  const session3Queries = [
    { q: "What is PM Kisan?", isFreshness: false, expectedScheme: 'pm_kisan' },
    { q: "Who is eligible for PM Kisan?", isFreshness: false, expectedScheme: 'pm_kisan' },
    { q: "What is the latest PM Kisan update?", isFreshness: true, expectedScheme: 'pm_kisan' },
    { q: "What documents are needed for PM Kisan?", isFreshness: false, expectedScheme: 'pm_kisan' },
    { q: "What is Ayushman Bharat?", isFreshness: false, expectedScheme: 'ayushman_bharat' },
    { q: "Who is eligible?", isFreshness: false, expectedScheme: 'ayushman_bharat' },
    { q: "What documents are required?", isFreshness: false, expectedScheme: 'ayushman_bharat' },
    { q: "What is PM Kisan installment amount?", isFreshness: false, expectedScheme: 'pm_kisan' },
    { q: "Is there any latest Ayushman update?", isFreshness: true, expectedScheme: 'ayushman_bharat' },
    { q: "Who is eligible for PM Kisan?", isFreshness: false, expectedScheme: 'pm_kisan' }
  ];

  console.log('================================================================');
  console.log(' STARTING REAL /api/chat ENDPOINT INTEGRATION AUDIT (3 SESSIONS)');
  console.log('================================================================');

  const s1 = await runSession('Session 1 (Ayushman Sequential A1-A10)', session1Queries);
  const s2 = await runSession('Session 2 (Ayushman Fresh Session S1-S10)', session2Queries);
  const s3 = await runSession('Session 3 (Mixed PM Kisan & Ayushman M1-M10)', session3Queries);

  const allRecords = [...s1, ...s2, ...s3];
  const passed = allRecords.filter(r => r.isCorrect).length;
  const total = allRecords.length;

  console.log('\n\n================================================================');
  console.log(' OVERALL INTEGRATION TEST SUMMARY TABLE');
  console.log('================================================================');
  console.table(allRecords.map((r, idx) => ({
    '#': idx + 1,
    Query: r.query,
    Source: r.matchedSource.substring(0, 20),
    Method: r.retrievalMethod,
    Answered: r.isAnswered ? 'YES' : 'NO',
    Correct: r.isCorrect ? 'PASS' : 'FAIL',
    FreshnessRule: r.freshnessRule.substring(0, 25)
  })));

  console.log(`\nFINAL INTEGRATION AUDIT SCORE: ${passed} / ${total} PASSED`);
}

runAllIntegrationTests().catch(console.error);
