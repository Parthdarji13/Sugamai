import { retrieveOfficialInfo } from '../retrieval/sourceManager';

async function verifyAllCriticalTestCases() {
  console.log('====================================================');
  console.log(' FINAL VERIFICATION OF PRIORITY 1 ROOT-CAUSE FIX');
  console.log('====================================================\n');

  const testCases = [
    { query: "PM Kisan eligibility kya hai?", expectedMethod: "live_fetch_with_cached_context" },
    { query: "PM Kisan latest installment kab aayi?", expectedMethod: "live_fetch" },
    { query: "PM Kisan eKYC mandatory hai?", expectedMethod: "live_fetch" },
    { query: "Ayushman Bharat eligibility?", expectedMethod: "cached_official_fallback" },
    { query: "ration card documents kya chahiye?", expectedMethod: "live_fetch_with_cached_context" },
    { query: "best restaurant near me", expectedMethod: "unmatched_default" },
    { query: "pm ksan eligibility", expectedMethod: "live_fetch_with_cached_context" }
  ];

  for (const tc of testCases) {
    const start = Date.now();
    const result = await retrieveOfficialInfo(tc.query);
    const duration = Date.now() - start;

    console.log(`Query: "${tc.query}"`);
    console.log(`  Matched Source: ${result.serviceName || 'N/A'}`);
    console.log(`  Retrieval Method: [${result.retrievalMethod}]`);
    console.log(`  Combined Context Length: ${result.content.length} chars`);
    console.log(`  Response Time: ${duration}ms`);
    console.log(`  Context Preview:\n  "${result.content.slice(0, 180).replace(/\n/g, ' ')}..."`);
    console.log('----------------------------------------------------\n');
  }

  // Follow-up test
  console.log('Follow-up Session Continuity Test:');
  const step1 = await retrieveOfficialInfo("PM Kisan");
  console.log(`Step 1 Query: "PM Kisan" -> Service: ${step1.serviceId}, Method: ${step1.retrievalMethod}`);

  const step2 = await retrieveOfficialInfo("documents kya chahiye?", step1.serviceId);
  console.log(`Step 2 Query: "documents kya chahiye?" -> Service: ${step2.serviceId}, Method: ${step2.retrievalMethod}`);
  console.log('====================================================');
}

verifyAllCriticalTestCases().catch(console.error);
