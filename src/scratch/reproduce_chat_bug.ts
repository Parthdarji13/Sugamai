import fs from 'fs/promises';
import path from 'path';

async function loadEnv() {
  try {
    const envContent = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  } catch {}
}
import { retrieveOfficialInfo } from '../retrieval/sourceManager';
import { extractRelevantContent } from '../retrieval/contentExtractor';
import { getCachedSourcePath } from '../retrieval/governmentSources';
import { GoogleGenerativeAI } from '@google/generative-ai';

const questions = [
  "What is Ayushman Bharat PM-JAY?",
  "Who is eligible for Ayushman Bharat?",
  "What are the benefits of Ayushman Bharat?",
  "How can I get an Ayushman card?",
  "What documents are required for Ayushman Bharat?",
  "Is Aadhaar mandatory for Ayushman Bharat?",
  "Is there any age limit for Ayushman Bharat?",
  "Is there a last date to apply for Ayushman Bharat?"
];

async function testExtractionAndGemini() {
  await loadEnv();
  const cachedFilePath = getCachedSourcePath('ayushman_bharat.txt');
  const fullText = await fs.readFile(cachedFilePath, 'utf-8');
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`GEMINI_API_KEY present: ${!!apiKey}`);

  let lastMatchedSourceId: string | undefined = undefined;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n========================================================`);
    console.log(`[Q${i + 1}] "${q}"`);
    console.log(`lastMatchedSourceId before: ${lastMatchedSourceId}`);

    const ret = await retrieveOfficialInfo(q, lastMatchedSourceId);
    if (ret.matched && ret.serviceId) {
      lastMatchedSourceId = ret.serviceId;
    }

    console.log(`matched source: ${ret.serviceName}`);
    console.log(`retrievalMethod: ${ret.retrievalMethod}`);
    console.log(`liveCharCount: ${ret.liveCharCount}`);
    console.log(`cachedCharCount: ${ret.cachedCharCount}`);
    console.log(`isFreshnessQuery: ${ret.isFreshnessQuery}`);
    console.log(`freshDataAvailable: ${ret.freshDataAvailable}`);
    console.log(`final context length: ${ret.content.length}`);
    console.log(`--- EXTRACTED CONTENT SENT TO GEMINI ---`);
    console.log(ret.content);
    console.log(`----------------------------------------`);

    // Let's call Gemini with the exact prompt from route.ts
    const sourceHeading = ret.retrievalMethod === 'live_fetch_with_cached_context'
      ? 'Here is the VERIFIED information retrieved from official government sources (combining live portal updates and verified official guidelines):'
      : (ret.retrievalMethod === 'live_fetch'
        ? 'Here is the LIVE VERIFIED information retrieved from the official government portal:'
        : 'Here is the VERIFIED reference information retrieved from official government guidelines:');

    const isFreshnessUnverified = ret.isFreshnessQuery && !ret.freshDataAvailable;
    const freshnessGroundingRule = isFreshnessUnverified
      ? `\nCRITICAL FRESHNESS RULE:
- The citizen is asking about the latest update, recent change, or new announcement for this scheme.
- However, NO fresh live official update was found in today's official government feeds.
- You MUST explicitly state that no recent official live update could be verified right now from available government sources.
- NEVER claim or present the standard guidelines below as a "latest update", "new change", or "recent announcement".
- You may summarize the verified general guidelines for reference, but clearly explain they are established baseline guidelines.`
      : '';

    const systemPrompt = `You are SugamGov AI, an intelligent government service assistant.
Your goal is to answer the citizen's question accurately using only the retrieved official government information below.

${sourceHeading}
---
${ret.content}
---

Official Source: ${ret.sourceTitle}
Source Link: ${ret.sourceUrl}

Instructions:
1. Answer the user's question ONLY using the verified information provided above.
2. Do NOT invent, assume, or guess any details (dates, eligibility limits, benefit amounts, documents, or websites) that are NOT present anywhere in the retrieved text above.
3. If the retrieved text contains ANY relevant information related to the question — even if it appears in a nearby section — use it to provide a helpful answer. Do NOT refuse to answer if the information is present, even partially.
4. ONLY output exactly: "I couldn't find verified information from an official government source for this query." if the retrieved text contains absolutely NO information relevant to the question. Translate this phrase to the selected language if necessary.
5. Do not mention any unofficial sites or blogs. Only refer to the provided official source and its URL.
6. Translate and answer in the user's selected language: English.
7. Keep the answer structured and clean. Use bolding and markdown lists. Cover all relevant details from the retrieved text: eligibility, benefit amount, documents required, and application process.${freshnessGroundingRule}
`;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.6-flash',
          systemInstruction: systemPrompt
        });
        const resp = await model.generateContent(q);
        const ans = resp.response.text();
        console.log(`>>> GEMINI ANSWER:\n${ans}`);
      } catch (err) {
        console.error(`GEMINI ERROR: ${(err as Error).message}`);
      }
    }
  }
}

testExtractionAndGemini().catch(console.error);
