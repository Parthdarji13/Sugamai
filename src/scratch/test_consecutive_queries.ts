import { retrieveOfficialInfo } from '../retrieval/sourceManager';

async function testConsecutiveQueries() {
  console.log('====================================================');
  console.log(' TESTING CONSECUTIVE CHAT QUESTIONS (PAGE LIFECYCLE)');
  console.log('====================================================\n');

  console.log('Question 1: "PM Kisan eligibility kya hai?"');
  const res1 = await retrieveOfficialInfo("PM Kisan eligibility kya hai?");
  console.log(`- Matched: ${res1.matched}`);
  console.log(`- Service: ${res1.serviceName}`);
  console.log(`- Retrieval Method: [${res1.retrievalMethod}]`);
  console.log(`- Output Length: ${res1.content.length} chars`);

  console.log('\nQuestion 2 (Immediately Consecutive): "Ayushman Bharat eligibility?"');
  const res2 = await retrieveOfficialInfo("Ayushman Bharat eligibility?");
  console.log(`- Matched: ${res2.matched}`);
  console.log(`- Service: ${res2.serviceName}`);
  console.log(`- Retrieval Method: [${res2.retrievalMethod}]`);
  console.log(`- Output Length: ${res2.content.length} chars`);

  console.log('\n====================================================');
  console.log(' BOTH CONSECUTIVE QUESTIONS PROCESSED SUCCESSFULLY');
  console.log('====================================================');
}

testConsecutiveQueries().catch(console.error);
