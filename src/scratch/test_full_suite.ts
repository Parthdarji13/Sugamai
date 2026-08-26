import { POST } from '../app/api/chat/route';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length > 0) {
          process.env[key.trim()] = vals.join('=').trim();
        }
      }
    }
  }
} catch (e) {
  console.warn('Could not read .env.local:', e);
}

type TestResult = {
  query: string;
  language: string;
  lastMatchedSourceId?: string;
  httpStatus: number;
  serviceId?: string;
  officialSource?: string;
  sourceUrl?: string;
  retrievalMethod?: string;
  responseLength: number;
  answerSample: string;
  passed: boolean;
  error?: string;
};

const results: TestResult[] = [];

async function runQuery(
  query: string,
  language: string,
  lastMatchedSourceId?: string,
  expectSupported = true
): Promise<TestResult> {
  const separator = '─'.repeat(60);
  console.log(`\n${separator}`);
  console.log(`QUERY  : "${query}"`);
  console.log(`LANG   : ${language}  |  lastMatchedSourceId: ${lastMatchedSourceId || 'none'}`);
  console.log(separator);

  const req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, language, lastMatchedSourceId })
  });

  const res = await POST(req);
  const httpStatus = res.status;
  console.log(`HTTP Status: ${httpStatus}`);

  const result: TestResult = {
    query, language, lastMatchedSourceId, httpStatus,
    responseLength: 0, answerSample: '', passed: false
  };

  if (httpStatus !== 200) {
    const body = await res.text();
    result.error = body;
    result.passed = false;
    console.log(`❌ FAILED — Response: ${body}`);
    return result;
  }

  const reader = res.body?.getReader();
  if (!reader) { result.error = 'No stream reader'; return result; }

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'metadata') {
          result.serviceId = parsed.serviceId;
          result.officialSource = parsed.officialSource;
          result.sourceUrl = parsed.sourceUrl;
          result.retrievalMethod = parsed.retrievalMethod;
          console.log(`📋 Source   : ${parsed.officialSource}`);
          console.log(`🔗 URL      : ${parsed.sourceUrl || 'N/A'}`);
          console.log(`📡 Retrieval: ${parsed.retrievalMethod}`);
          console.log(`🆔 ServiceId: ${parsed.serviceId || 'N/A'}`);
        } else if (parsed.type === 'chunk') {
          fullText += parsed.text;
        } else if (parsed.type === 'error') {
          result.error = parsed.message;
          console.log(`❌ Stream error: ${parsed.message}`);
        }
      } catch { /* raw line */ }
    }
  }

  result.responseLength = fullText.length;
  result.answerSample = fullText.substring(0, 200).replace(/\n/g, ' ');

  const isUnsupportedQuery = !expectSupported;
  const hasAnswer = fullText.length > 10;
  const hasSource = !!result.officialSource;

  result.passed = httpStatus === 200 && hasAnswer && (isUnsupportedQuery || hasSource);

  if (result.passed) {
    console.log(`✅ PASSED — ${fullText.length} chars received`);
  } else {
    console.log(`❌ FAILED — ${fullText.length} chars, source=${result.officialSource}`);
  }
  console.log(`💬 Sample  : ${result.answerSample.substring(0, 180)}...`);

  return result;
}

async function runAllTests() {
  console.log('\n' + '═'.repeat(60));
  console.log('  SUGAMGOV AI — FULL FUNCTIONAL TEST SUITE');
  console.log('═'.repeat(60));

  // ── Test Group 1: PM Kisan multi-turn conversation ──────────
  console.log('\n📂 GROUP 1: PM Kisan multi-turn (Hindi)');
  const r1 = await runQuery('PM Kisan eligibility kya hai?', 'hi');
  results.push(r1);

  const r2 = await runQuery('PM Kisan ke liye documents kya chahiye?', 'hi', r1.serviceId);
  results.push(r2);

  const r3 = await runQuery('Iske liye apply kaise karu?', 'hi', r2.serviceId);
  results.push(r3);

  // ── Test Group 2: Ayushman Bharat ───────────────────────────
  console.log('\n📂 GROUP 2: Ayushman Bharat (English)');
  const r4 = await runQuery('Ayushman Bharat eligibility kya hai?', 'en');
  results.push(r4);

  // ── Test Group 3: English PM Kisan ─────────────────────────
  console.log('\n📂 GROUP 3: PM Kisan (English)');
  const r5 = await runQuery('What are the benefits of PM Kisan Samman Nidhi?', 'en');
  results.push(r5);

  // ── Test Group 4: Gujarati ──────────────────────────────────
  console.log('\n📂 GROUP 4: PM Kisan (Gujarati)');
  const r6 = await runQuery('PM Kisan yojana ni patrata shu chhe?', 'gu');
  results.push(r6);

  // ── Test Group 5: Unmatched query (should gracefully reject) ─
  console.log('\n📂 GROUP 5: Unmatched query (should reject gracefully)');
  const r7 = await runQuery('What is the capital of France?', 'en', undefined, false);
  results.push(r7);

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(60));

  let passed = 0;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    const source = r.officialSource ? ` [${r.officialSource}]` : '';
    const status = r.error ? ` ERROR: ${r.error.substring(0, 80)}` : ` (${r.responseLength} chars)`;
    console.log(`${icon} ${r.query.substring(0, 50).padEnd(52)}${status}${source}`);
    if (r.passed) passed++;
  }

  console.log(`\n🎯 ${passed}/${results.length} tests passed`);
  console.log('═'.repeat(60) + '\n');

  if (passed < results.length) process.exit(1);
}

runAllTests().catch(console.error);
