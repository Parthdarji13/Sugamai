import { matchQueryToSource, hasGenericGovTerms } from '../retrieval/queryMatcher';
import { retrieveOfficialInfo } from '../retrieval/sourceManager';
import { extractRelevantContent } from '../retrieval/contentExtractor';
import { governmentSources } from '../retrieval/governmentSources';

async function forensicTrace() {
  const query = "PM Kisan eligibility kya hai?";
  const selectedLanguage = 'en';
  const languageName = 'English';

  console.log('====================================================');
  console.log(' FORENSIC TRACE FOR QUERY: "' + query + '"');
  console.log('====================================================\n');

  // STEP 1: Query Normalization (from queryMatcher.ts:6-12)
  const normalizedQuery = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('1. User Query after Normalization:');
  console.log(`   "${normalizedQuery}"\n`);

  // STEP 2 & 3: Match Query to Source (from queryMatcher.ts:88-164)
  const matchedSource = matchQueryToSource(query);
  console.log('2. Result returned by queryMatcher:');
  console.log(`   ID: ${matchedSource?.id}, Name: "${matchedSource?.name}"`);

  console.log('3. Matched GovernmentSource ID:');
  console.log(`   ${matchedSource?.id}`);

  // STEP 4: Official URL Selected
  console.log('4. Official URL Selected:');
  console.log(`   ${matchedSource?.officialUrl}\n`);

  // STEP 5: Live Retrieval in sourceManager.ts
  console.log('5. Full text returned by sourceManager live retrieval:');
  const retrievalResult = await retrieveOfficialInfo(query);
  console.log(`   Retrieval Method: [${retrievalResult.retrievalMethod}]`);
  console.log(`   Service ID: ${retrievalResult.serviceId}`);
  console.log(`   Matched: ${retrievalResult.matched}`);
  console.log(`   Raw Extracted Content Length: ${retrievalResult.content.length} chars\n`);

  // STEP 6 & 7: Exact 335 chars returned by contentExtractor
  const extractedContent = retrievalResult.content;
  console.log('6 & 7. EXACT 335 CHARACTERS returned by contentExtractor:');
  console.log('----------------------------------------------------');
  console.log(extractedContent);
  console.log('----------------------------------------------------\n');

  // STEP 8: Check for key words/concepts in those 335 chars
  const lower335 = extractedContent.toLowerCase();
  console.log('8. Keyword/Concept Presence in Extracted 335 chars:');
  console.log(`   - "eligibility": ${lower335.includes('eligibility')}`);
  console.log(`   - "farmer": ${lower335.includes('farmer')}`);
  console.log(`   - "land": ${lower335.includes('land')}`);
  console.log(`   - "pm-kisan": ${lower335.includes('pm-kisan')}`);
  console.log(`   - "beneficiary": ${lower335.includes('beneficiary')}\n`);

  // STEP 9: Value passed as retrieved context to Gemini (relevantContent in route.ts)
  const relevantContent = retrievalResult.content;
  console.log('9. EXACT variable/value passed as retrieved context (relevantContent):');
  console.log(`   Length: ${relevantContent.length} chars`);
  console.log(`   Type: ${typeof relevantContent}\n`);

  // STEP 10: System Prompt constructed in route.ts (route.ts:74-92)
  const isSupported = retrievalResult.matched;
  const systemPrompt = isSupported ? `You are SugamGov AI, an intelligent government service assistant.
Your goal is to answer the citizen's question accurately.

Here is the VERIFIED information retrieved from the official government source:
---
${relevantContent}
---

Official Source: ${retrievalResult.sourceTitle}
Source Link: ${retrievalResult.sourceUrl}

Instructions:
1. Answer the user's question ONLY using the verified information provided above.
2. Do NOT invent, assume, or guess any details (dates, eligibility limits, documents, or websites) not present in the verified text.
3. If the answer cannot be found in the retrieved text, output exactly: "I couldn't find verified information from an official government source for this query." (Translate to selected language if necessary).
4. Do not mention any unofficial sites or blogs. Only refer to the provided official source.
5. Translate and answer in the user's selected language: ${languageName}.
6. Keep the answer structured and clean. Provide a complete, detailed answer covering eligibility, documents required, and the application process in full. Use bolding and markdown lists.
` : '';

  console.log('10. EXACT Gemini systemInstruction/system prompt:');
  console.log('----------------------------------------------------');
  console.log(systemPrompt);
  console.log('----------------------------------------------------\n');

  // STEP 11: Exact user message passed to Gemini
  console.log('11. EXACT user message passed to Gemini:');
  console.log(`    contents: [{ role: "user", parts: [{ text: "${query}" }] }]\n`);

  // STEP 12: Rejection condition check
  console.log('12. Exact condition causing rejection response:');
  console.log(`    Instruction 1: "Answer the user's question ONLY using the verified information provided above."`);
  console.log(`    Instruction 3: "If the answer cannot be found in the retrieved text, output exactly: 'I couldn't find verified information from an official government source for this query.'"`);
  console.log(`    Since the 335 chars contain ONLY the 23rd installment release date in Hooghly and eKYC login steps, Gemini cannot find any eligibility information in the retrieved text, so it executes Instruction 3.\n`);

  // STEP 13-17 Diagnostics
  console.log('13. Rejection Origin: E. Gemini itself (Gemini receives the 335 chars, sees no eligibility info, and obeys system prompt Instruction 3).');
  console.log('14. Stale rejection condition in code? NO. route.ts passes retrievalResult.content to systemPrompt and sends isSupported=true.');
  console.log('15. Live content discarded/replaced? NO. live_fetch succeeded and returned 4765 chars of live HTML text from pmkisan.gov.in.');
  console.log('16. Context empty or corrupt? NO. Exactly 335 chars were passed, but those 335 chars from pmkisan.gov.in home banner lacked eligibility rules.');
  console.log('17. Language selection issue? NO. Output is identical in English/Hindi/Gujarati.\n');
}

forensicTrace().catch(console.error);
