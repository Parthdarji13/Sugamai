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
  "Is there a last date to apply for Ayushman Bharat?",
  "What is the latest Ayushman Bharat update?",
  "What changed recently in Ayushman Bharat eligibility?"
];

async function runTest() {
  await loadEnv();
  const apiKey = process.env.GEMINI_API_KEY!;
  const fullText = await fs.readFile(getCachedSourcePath('ayushman_bharat.txt'), 'utf-8');
  const genAI = new GoogleGenerativeAI(apiKey);

  console.log(`FULL AYUSHMAN BHARAT TXT LENGTH: ${fullText.length} chars\n`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const isFreshness = q.includes('latest') || q.includes('recently') || q.includes('update') || q.includes('changed');

    const freshnessRule = isFreshness
      ? `\nCRITICAL FRESHNESS RULE:
- The citizen is asking about the latest update, recent change, or new announcement for this scheme.
- However, NO fresh live official update was found in today's official government feeds.
- You MUST explicitly state that no recent official live update could be verified right now from available government sources.
- NEVER claim or present the standard guidelines below as a "latest update", "new change", or "recent announcement".
- You may summarize the verified general guidelines for reference, but clearly explain they are established baseline guidelines.`
      : '';

    const systemPrompt = `You are SugamGov AI, an intelligent government service assistant.
Your goal is to answer the citizen's question accurately using only the retrieved official government information below.

Here is the VERIFIED reference information retrieved from official government guidelines:
---
${fullText}
---

Official Source: National Health Authority - Ayushman Bharat Portal
Source Link: https://pmjay.gov.in/

Instructions:
1. Answer the user's question ONLY using the verified information provided above.
2. Do NOT invent, assume, or guess any details (dates, eligibility limits, benefit amounts, documents, or websites) that are NOT present anywhere in the retrieved text above.
3. If the retrieved text contains ANY relevant information related to the question — even if it appears in a nearby section — use it to provide a helpful answer. Do NOT refuse to answer if the information is present, even partially.
4. If a specific detail (such as mandatory document list or specific offline card generation steps) is NOT mentioned in the text above, honestly state what is verified in the guideline and note that specific unmentioned details are not in the official document summary, rather than rejecting the entire query.
5. ONLY output exactly: "I couldn't find verified information from an official government source for this query." if the retrieved text is about a completely unrelated topic or scheme. Translate this phrase to the selected language if necessary.
6. Do not mention any unofficial sites or blogs. Only refer to the provided official source and its URL.
7. Translate and answer in the user's selected language: English.
8. Keep the answer structured and clean. Use bolding and markdown lists. Cover all relevant details from the retrieved text.${freshnessRule}
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: systemPrompt
    });

    console.log(`\n========================================================`);
    console.log(`[Q${i + 1}] "${q}" (Freshness: ${isFreshness})`);
    try {
      const resp = await model.generateContent(q);
      console.log(`>>> GEMINI ANSWER:\n${resp.response.text()}\n`);
    } catch (err) {
      console.error(`ERROR: ${(err as Error).message}`);
    }
  }
}

runTest().catch(console.error);
