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
        if (key && vals.length > 0) process.env[key.trim()] = vals.join('=').trim();
      }
    }
  }
} catch { /* ignore */ }

async function runQuery(query: string, lang: string, lastMatchedSourceId?: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`QUERY: "${query}" | lang=${lang} | session=${lastMatchedSourceId || 'none'}`);
  console.log('─'.repeat(60));

  const req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, language: lang, lastMatchedSourceId })
  });

  const res = await POST(req);
  if (res.status !== 200) {
    const body = await res.text();
    console.log(`❌ HTTP ${res.status}: ${body}`);
    return { serviceId: undefined };
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let serviceId: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n').filter(l => l.trim())) {
      try {
        const p = JSON.parse(line);
        if (p.type === 'metadata') { serviceId = p.serviceId; }
        else if (p.type === 'chunk') { fullText += p.text; }
      } catch { /* raw */ }
    }
  }

  const truncated = fullText.replace(/\n/g, ' ').substring(0, 220);
  const refused = fullText.includes("I couldn't find verified information");
  const icon = refused ? '⚠️ REFUSED' : '✅ ANSWERED';
  console.log(`${icon} — ${fullText.length} chars`);
  console.log(`RESPONSE: ${truncated}...`);
  return { serviceId };
}

async function main() {
  console.log('\n═══════ REGRESSION TEST: Previously Failing Queries ═══════\n');

  const r1 = await runQuery('PM Kisan eligibility kya hai?', 'hi');
  const r2 = await runQuery('PM Kisan ka benefit kitna hai?', 'hi', r1.serviceId);
  const r3 = await runQuery('iske liye documents kya chahiye?', 'hi', r2.serviceId);
  const r4 = await runQuery('iske liye apply kaise karu?', 'hi', r3.serviceId);
  await runQuery('Ayushman Bharat ke liye kya documents chahiye?', 'hi');

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
