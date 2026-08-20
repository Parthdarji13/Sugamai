import { retrieveOfficialInfo } from '../retrieval/sourceManager';
import { matchQueryToSource } from '../retrieval/queryMatcher';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('==================================================');
  console.log('SugamGov AI Retrieval Layer Test Runner');
  console.log('==================================================\n');

  const testCases = [
    {
      id: 'TC01',
      name: 'PM Kisan Eligibility (English)',
      query: 'What is the eligibility criteria for PM Kisan scheme?',
      expectedMatch: 'pm_kisan'
    },
    {
      id: 'TC02',
      name: 'PM Kisan benefits (Hindi query)',
      query: 'पीएम किसान योजना में कितने पैसे मिलते हैं और किस्त कब आती है?',
      expectedMatch: 'pm_kisan'
    },
    {
      id: 'TC03',
      name: 'Ayushman Bharat query (Gujarati query)',
      query: 'આયુષ્માન ભારત યોજના કાર્ડ મેળવવા માટે શું પાત્રતા છે?',
      expectedMatch: 'ayushman_bharat'
    },
    {
      id: 'TC04',
      name: 'Income Certificate query (English)',
      query: 'What documents are required to apply for Income Certificate?',
      expectedMatch: 'income_certificate'
    },
    {
      id: 'TC05',
      name: 'Hindi Query Matching',
      query: 'किसान योजना अपात्र नियम',
      expectedMatch: 'pm_kisan'
    },
    {
      id: 'TC06',
      name: 'Gujarati Query Matching',
      query: 'આવકના પ્રમાણપત્ર માટે અરજી પ્રક્રિયા',
      expectedMatch: 'income_certificate'
    },
    {
      id: 'TC07',
      name: 'Unsupported query',
      query: 'How do I cook butter chicken or play football?',
      expectedMatch: null
    },
    {
      id: 'TC08',
      name: 'Source availability check',
      query: 'check sources',
      isSourceCheck: true
    }
  ];

  let passedTests = 0;

  for (const tc of testCases) {
    console.log(`[Running ${tc.id}] ${tc.name}`);
    console.log(`Query: "${tc.query}"`);

    if (tc.isSourceCheck) {
      // TC08 Source Check
      const sourcesDir = path.join(process.cwd(), 'src/retrieval/sources');
      const files = ['pm_kisan.txt', 'ayushman_bharat.txt', 'income_certificate.txt'];
      let filesCheck = true;

      for (const file of files) {
        const filePath = path.join(sourcesDir, file);
        const exists = fs.existsSync(filePath);
        console.log(` - File ${file}: ${exists ? 'EXISTS' : 'MISSING'} (${exists ? fs.statSync(filePath).size + ' bytes' : 0})`);
        if (!exists) filesCheck = false;
      }

      if (filesCheck) {
        console.log(`Result: PASS (All official source text files are present and readable)\n`);
        passedTests++;
      } else {
        console.log(`Result: FAIL (Some official source text files are missing!)\n`);
      }
      continue;
    }

    // Run Matcher
    const matchedSource = matchQueryToSource(tc.query);
    const matchedId = matchedSource ? matchedSource.id : null;

    // Run Source Manager
    const result = await retrieveOfficialInfo(tc.query);

    console.log(` - Matched Scheme ID: ${matchedId}`);
    console.log(` - Source Title: ${result.sourceTitle}`);
    console.log(` - Source URL: ${result.sourceUrl}`);
    console.log(` - Method: ${result.retrievalMethod}`);
    console.log(` - Content Size: ${result.content.length} characters`);
    
    if (result.matched) {
      console.log(` - Extracted Snippet: "${result.content.substring(0, 120).replace(/\n/g, ' ')}..."`);
    }

    const matchPass = matchedId === tc.expectedMatch;
    const retrievalPass = tc.expectedMatch ? result.matched === true : result.matched === false;

    if (matchPass && retrievalPass) {
      console.log(`Result: PASS\n`);
      passedTests++;
    } else {
      console.log(`Result: FAIL (Expected match: ${tc.expectedMatch}, Actual: ${matchedId})\n`);
    }
  }

  console.log('==================================================');
  console.log(`Test Summary: ${passedTests}/${testCases.length} Passed`);
  console.log('==================================================');
  
  if (passedTests === testCases.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
