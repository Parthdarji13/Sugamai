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

async function runTestQuery(message: string, lastMatchedSourceId?: string) {
  console.log(`\n======================================================`);
  console.log(`TESTING QUERY: "${message}" (lastMatchedSourceId: ${lastMatchedSourceId || 'none'})`);
  console.log(`======================================================`);

  const req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      language: 'en',
      lastMatchedSourceId
    })
  });

  const res = await POST(req);
  console.log(`HTTP Status: ${res.status}`);

  if (res.status !== 200) {
    const errorBody = await res.text();
    console.log(`Response Body: ${errorBody}`);
    return { serviceId: undefined };
  }

  const reader = res.body?.getReader();
  if (!reader) return { serviceId: undefined };

  const decoder = new TextDecoder();
  let returnedServiceId: string | undefined = undefined;
  let responseText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkStr = decoder.decode(value);
    const lines = chunkStr.split('\n').filter(l => l.trim() !== '');

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'metadata') {
          returnedServiceId = parsed.serviceId;
          console.log(`[METADATA] Source: ${parsed.officialSource} | ServiceId: ${parsed.serviceId}`);
        } else if (parsed.type === 'chunk') {
          responseText += parsed.text;
        } else if (parsed.type === 'error') {
          console.error(`[STREAM ERROR]: ${parsed.message}`);
        }
      } catch {
        // Raw line
      }
    }
  }

  console.log(`[ANSWER SAMPLE]: ${responseText.substring(0, 150)}...`);
  return { serviceId: returnedServiceId };
}

async function runAllTests() {
  console.log('STARTING END-TO-END MODEL CASCADE QUOTA TEST');

  // Query 1
  const res1 = await runTestQuery('PM Kisan eligibility kya hai?');

  // Query 2 (Follow-up using lastMatchedSourceId)
  const res2 = await runTestQuery('PM Kisan ke liye documents kya chahiye?', res1.serviceId);

  // Query 3 (Follow-up using lastMatchedSourceId)
  await runTestQuery('Iske liye apply kaise karu?', res2.serviceId);

  // Query 4 (Different service)
  await runTestQuery('Ayushman Bharat eligibility kya hai?');

  console.log(`\n======================================================`);
  console.log(`ALL TEST QUERIES COMPLETED SUCCESSFULLY`);
  console.log(`======================================================`);
}

runAllTests().catch(console.error);
