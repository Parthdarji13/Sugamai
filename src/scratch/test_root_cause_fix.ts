import { retrieveOfficialInfo } from '../retrieval/sourceManager';

async function testRootCauseFix() {
  console.log('====================================================');
  console.log(' TESTING QUERY-AWARE & SOURCE-COMPLETE RETRIEVAL FIX');
  console.log('====================================================\n');

  const testQueries = [
    { query: "PM Kisan eligibility kya hai?", note: "Crucial Bug Case" },
    { query: "PM Kisan latest installment kab aayi?", note: "Live Preference" },
    { query: "PM Kisan eKYC mandatory hai?", note: "Live eKYC Notice" },
    { query: "Ayushman Bharat eligibility?", note: "Ayushman Service" },
    { query: "ration card documents kya chahiye?", note: "NFSA Service" },
    { query: "best restaurant near me", note: "Unrelated Query" },
    { query: "pm ksan eligibility", note: "Fuzzy Typo Query" }
  ];

  for (const t of testQueries) {
    const startTime = Date.now();
    const result = await retrieveOfficialInfo(t.query);
    const duration = Date.now() - startTime;

    console.log(`[TEST] Query: "${t.query}" (${t.note})`);
    console.log(`  - Matched: ${result.matched}`);
    console.log(`  - Service Name: ${result.serviceName || 'N/A'}`);
    console.log(`  - Retrieval Method: [${result.retrievalMethod}]`);
    console.log(`  - Content Length: ${result.content.length} chars`);
    console.log(`  - Duration: ${duration}ms`);
    console.log(`  - Content Snippet:\n    "${result.content.slice(0, 220).replace(/\n/g, ' ')}..."`);
    console.log('----------------------------------------------------\n');
  }

  // Follow-up test
  console.log('[TEST] Follow-up query test:');
  console.log('First query: "PM Kisan"');
  const firstRes = await retrieveOfficialInfo("PM Kisan");
  console.log(`  First matched: ${firstRes.serviceId}`);

  console.log('Follow-up query: "documents kya chahiye?" with fallbackSourceId="pm_kisan"');
  const followUpRes = await retrieveOfficialInfo("documents kya chahiye?", firstRes.serviceId);
  console.log(`  Follow-up matched: ${followUpRes.matched}, Service: ${followUpRes.serviceId}`);
  console.log(`  Retrieval Method: [${followUpRes.retrievalMethod}]`);
  console.log('----------------------------------------------------');
}

testRootCauseFix().catch(console.error);
