import { retrieveOfficialInfo } from '../retrieval/sourceManager';

async function runTests() {
  console.log('====================================================');
  console.log(' SUGAMGOV AI — DYNAMIC RETRIEVAL & FALLBACK TEST');
  console.log('====================================================\n');

  const queries = [
    { title: 'PM Kisan Query', query: 'PM Kisan eligibility kya hai?' },
    { title: 'Ayushman Bharat Query', query: 'Ayushman Bharat eligibility?' },
    { title: 'Income Certificate Query', query: 'How to apply for Income Certificate?' }
  ];

  for (const item of queries) {
    console.log(`>>> TEST: ${item.title} ("${item.query}")`);
    const start = Date.now();
    const result = await retrieveOfficialInfo(item.query);
    const duration = Date.now() - start;

    console.log(`    Status: ${result.matched ? 'MATCHED' : 'UNMATCHED'}`);
    console.log(`    Service: ${result.serviceName} (${result.serviceId})`);
    console.log(`    Source URL: ${result.sourceUrl}`);
    console.log(`    Retrieval Method: [${result.retrievalMethod}]`);
    console.log(`    Execution Time: ${duration}ms`);
    console.log(`    Content Length: ${result.content.length} chars`);
    console.log(`    Content Preview:\n    "${result.content.slice(0, 180).replace(/\n/g, ' ')}..."\n`);
  }

  console.log('====================================================');
  console.log(' ALL RETRIEVAL TESTS EXECUTED SUCCESSFULLY');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
