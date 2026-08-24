import { matchQueryToSource } from '../retrieval/queryMatcher';
import { retrieveOfficialInfo } from '../retrieval/sourceManager';
import { governmentSources } from '../retrieval/governmentSources';

async function testPriority3() {
  console.log('====================================================');
  console.log(' SUGAMGOV AI — PRIORITY 3 TEST SUITE');
  console.log('====================================================\n');

  console.log(`Total Services Configured: ${governmentSources.length}\n`);

  const testCases = [
    // PM Kisan
    { category: 'PM Kisan', query: 'PM Kisan eligibility', expectedId: 'pm_kisan' },
    { category: 'PM Kisan (Hinglish)', query: 'pm kisan ka paisa kab milega', expectedId: 'pm_kisan' },
    { category: 'PM Kisan (Typo)', query: 'pm ksan eligibility', expectedId: 'pm_kisan' },
    { category: 'PM Kisan (Hindi)', query: 'प्रधानमंत्री किसान योजना के लिए कौन पात्र है?', expectedId: 'pm_kisan' },
    { category: 'PM Kisan (Gujarati)', query: 'પીએમ કિસાન માટે કોણ પાત્ર છે?', expectedId: 'pm_kisan' },
    { category: 'PM Kisan (Mixed)', query: 'PM Kisan mate eligibility shu che?', expectedId: 'pm_kisan' },

    // Ayushman Bharat
    { category: 'Ayushman', query: 'Ayushman Bharat eligibility', expectedId: 'ayushman_bharat' },
    { category: 'Ayushman (Intent)', query: 'health card 5 lakh', expectedId: 'ayushman_bharat' },
    { category: 'Ayushman (Typo)', query: 'ayushman bharat eligiblity', expectedId: 'ayushman_bharat' },

    // Income Certificate
    { category: 'Income Cert', query: 'income certificate documents', expectedId: 'income_certificate' },
    { category: 'Income Cert (Hindi)', query: 'आय प्रमाण पत्र कैसे बनवाएं?', expectedId: 'income_certificate' },
    { category: 'Income Cert (Gujarati)', query: 'આવક પ્રમાણપત્ર કેવી રીતે બનાવવું?', expectedId: 'income_certificate' },

    // Ration Card / NFSA
    { category: 'Ration Card', query: 'ration card documents', expectedId: 'nfsa_ration_card' },
    { category: 'Ration Card (Hinglish)', query: 'rashan card kaise banaye', expectedId: 'nfsa_ration_card' },
    { category: 'Ration Card (Gujarati)', query: 'રેશન કાર્ડ માટે શું જોઈએ?', expectedId: 'nfsa_ration_card' },

    // PM Awas Yojana
    { category: 'PM Awas (Intent)', query: 'ghar ke liye government scheme', expectedId: 'pm_awas_yojana' },
    { category: 'PM Awas', query: 'pm awas eligibility', expectedId: 'pm_awas_yojana' },
    { category: 'PM Awas (Hindi)', query: 'प्रधानमंत्री आवास योजना', expectedId: 'pm_awas_yojana' },

    // e-Shram
    { category: 'e-Shram', query: 'labour card', expectedId: 'eshram_card' },
    { category: 'e-Shram', query: 'e shram card', expectedId: 'eshram_card' },
    { category: 'e-Shram (Hindi)', query: 'ई श्रम कार्ड', expectedId: 'eshram_card' },

    // Passport Seva
    { category: 'Passport', query: 'passport documents', expectedId: 'passport_seva' },
    { category: 'Passport (Hinglish)', query: 'passport renew kaise kare', expectedId: 'passport_seva' },

    // Mudra Loan
    { category: 'Mudra', query: 'business loan government', expectedId: 'pm_mudra_yojana' },
    { category: 'Mudra', query: 'mudra loan eligibility', expectedId: 'pm_mudra_yojana' },

    // Scholarships
    { category: 'Scholarship', query: 'student scholarship', expectedId: 'national_scholarships' },
    { category: 'Scholarship', query: 'nsp scholarship', expectedId: 'national_scholarships' },
    { category: 'Scholarship (Hindi)', query: 'स्कॉलरशिप कैसे मिलेगी?', expectedId: 'national_scholarships' },

    // Unrelated queries (Should be UNMATCHED / null)
    { category: 'Unrelated', query: 'weather today', expectedId: null },
    { category: 'Unrelated', query: 'best restaurant', expectedId: null },
    { category: 'Unrelated', query: 'write me a poem', expectedId: null }
  ];

  let passed = 0;

  for (const tc of testCases) {
    const matched = matchQueryToSource(tc.query);
    const matchedId = matched ? matched.id : null;
    const isCorrect = matchedId === tc.expectedId;

    if (isCorrect) passed++;

    const statusStr = isCorrect ? '✓ PASS' : '✗ FAIL';
    console.log(`[${statusStr}] ${tc.category} | Query: "${tc.query}"`);
    console.log(`        Result: ${matchedId || 'UNMATCHED'} (Expected: ${tc.expectedId || 'UNMATCHED'})\n`);
  }

  console.log('----------------------------------------------------');
  console.log(`SUMMARY: Passed ${passed}/${testCases.length} (${((passed / testCases.length) * 100).toFixed(1)}%)`);
  console.log('----------------------------------------------------');

  console.log('\nTesting End-to-End Retrieval Pipeline on New Service (PM Awas Yojana)...');
  const e2eResult = await retrieveOfficialInfo('pm awas eligibility');
  console.log(`- Matched Service: ${e2eResult.serviceName}`);
  console.log(`- Retrieval Method: [${e2eResult.retrievalMethod}]`);
  console.log(`- Official URL: ${e2eResult.sourceUrl}`);
  console.log(`- Extracted Content Snippet:\n"${e2eResult.content.slice(0, 200).replace(/\n/g, ' ')}..."\n`);
}

testPriority3().catch(console.error);
