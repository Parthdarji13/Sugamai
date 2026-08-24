import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import { matchQueryToSource, hasGenericGovTerms } from '@/retrieval/queryMatcher';
import { governmentSources, getCachedSourcePath } from '@/retrieval/governmentSources';
import { extractRelevantContent } from '@/retrieval/contentExtractor';

// Global in-memory cache for live website verification status (cached for 1 hour)
const liveCheckCache = new Map<string, { ok: boolean; timestamp: number }>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  // Start Total Request timer
  console.time('total-request');
  const requestStart = Date.now();
  const TOTAL_BUDGET_MS = 18000;

  try {
    const { message, language, lastMatchedSourceId } = await req.json();

    if (!message || message.trim() === '') {
      console.timeEnd('total-request');
      return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const selectedLanguage = language || 'en'; // 'en', 'hi', 'gu'
    let languageName = 'English';
    if (selectedLanguage === 'hi') languageName = 'Hindi';
    if (selectedLanguage === 'gu') languageName = 'Gujarati';

    // 1. Query Matching
    console.time('query-matching');
    let source = matchQueryToSource(message);
    if (!source && lastMatchedSourceId) {
      source = governmentSources.find(s => s.id === lastMatchedSourceId) || null;
    }
    console.timeEnd('query-matching');

    // If query is unsupported or unmatched, compute rejected answer text
    let rejectedAnswer = "";
    if (!source) {
      const isGeneric = hasGenericGovTerms(message);
      if (selectedLanguage === 'hi') {
        rejectedAnswer = isGeneric
          ? "आप किस सरकारी योजना या सेवा की बात कर रहे हैं? वर्तमान में, मैं आपकी पीएम किसान, आयुष्मान भारत, या आय प्रमाण पत्र में मदद कर सकता हूँ। कृपया स्पष्ट करें।"
          : "मुझे इस प्रश्न के लिए किसी आधिकारिक सरकारी स्रोत से सत्यापित जानकारी नहीं मिल सकी।";
      } else if (selectedLanguage === 'gu') {
        rejectedAnswer = isGeneric
          ? "તમે કઈ સરકારી યોજના અથવા સેવા વિશે પૂછી રહ્યા છો? હાલમાં, હું તમને પીએમ કિસાન, આયુષ્માન ભારત, અથવા આવકનું પ્રમાણપત્ર વિશે માહિતી આપી શકું છું. કૃપા કરીને સ્પષ્ટ કરો।"
          : "મને આ પ્રશ્ન માટે કોઈ સત્તાવાર સરકારી સ્ત્રોતમાંથી ચકાસણી કરેલી માહિતી મળી શકી નથી.";
      } else {
        rejectedAnswer = isGeneric
          ? "Which government scheme or service are you referring to? Currently, I can help you with PM Kisan, Ayushman Bharat, or Income Certificate. Please specify your query."
          : "I couldn't find verified information from an official government source for this query.";
      }
    }

    // 2. Read Cached File if source matches
    let rawContent = '';
    if (source) {
      console.time('read-cached-file');
      try {
        const filePath = getCachedSourcePath(source.cachedFileName);
        rawContent = await fs.readFile(filePath, 'utf-8');
      } catch (fsError) {
        console.error(`Failed to read cached official file: ${(fsError as Error).message}`);
        rawContent = `Error: Official government document for ${source.name} is temporarily unavailable.`;
      }
      console.timeEnd('read-cached-file');

      // 3. Live website verification check (asynchronous, non-blocking, cached for 1 hour)
      const targetUrl = source.officialUrl;
      const targetName = source.name;
      const cachedStatus = liveCheckCache.get(targetUrl);
      const now = Date.now();

      if (cachedStatus && (now - cachedStatus.timestamp < CACHE_DURATION_MS)) {
        console.log(`[CACHE LOG] Skipping live connection check for ${targetName}; cached status (${cachedStatus.ok ? 'ONLINE' : 'OFFLINE'}) is still valid.`);
      } else {
        (async () => {
          console.time(`live-website-check-${targetName}`);
          let isOk = false;
          try {
            const response = await fetch(targetUrl, {
              method: 'HEAD',
              signal: AbortSignal.timeout(2500),
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SugamGovAI/1.0'
              }
            });
            isOk = response.ok;
            console.log(`[TIMING] Async live check: Connected to official portal ${targetUrl} successfully.`);
          } catch (err) {
            console.warn(`[Live Check Warning] Non-critical check failed/aborted for ${targetName} (${targetUrl}):`, (err as Error).message);
          }
          liveCheckCache.set(targetUrl, { ok: isOk, timestamp: Date.now() });
          console.timeEnd(`live-website-check-${targetName}`);
        })().catch(unhandledErr => {
          console.error('[CRITICAL ASYNC CHECK ERROR]:', unhandledErr);
        });
      }
    }

    // Extract relevant paragraphs
    const relevantContent = source ? extractRelevantContent(rawContent, message) : '';

    const apiKey = process.env.GEMINI_API_KEY;
    const runInDemoMode = !apiKey || apiKey.trim() === '' || apiKey === 'your_key_here';

    let demoAnswer = '';
    if (source && runInDemoMode) {
      console.warn('GEMINI_API_KEY is not set in environment variables. Running in Demo Mode.');
      if (selectedLanguage === 'hi') {
        demoAnswer = `**[डेमो मोड - जीमिनी API कुंजी कॉन्फ़िगर नहीं है]**\n\nयहाँ **${source.name}** के बारे में आधिकारिक जानकारी दी गई है:\n\n${relevantContent}\n\n*कृपया इस प्रोजेक्ट को चलाने के लिए \`frontend/.env.local\` में अपनी \`GEMINI_API_KEY\` जोड़ें।*`;
      } else if (selectedLanguage === 'gu') {
        demoAnswer = `**[ડેમો મોડ - જેમિની API કી સેટ નથી]**\n\nઅહીં **${source.name}** વિશેની સત્તાવાર માહિતી છે:\n\n${relevantContent}\n\n*કૃપા કરીને આ પ્રોજેક્ટ ચલાવવા માટે \`frontend/.env.local\` માં તમારી \`GEMINI_API_KEY\` ઉમેરો.*`;
      } else {
        demoAnswer = `**[Demo Mode - Gemini API Key Not Configured]**\n\nHere is the official information retrieved for **${source.name}**:\n\n${relevantContent}\n\n*Please add your \`GEMINI_API_KEY\` in \`frontend/.env.local\` to run the live AI summarizer.*`;
      }
    }

    const systemPrompt = source ? `You are SugamGov AI, an intelligent government service assistant.
Your goal is to answer the citizen's question accurately.

Here is the VERIFIED information retrieved from the official government source:
---
${relevantContent}
---

Official Source: ${source.sourceTitle}
Source Link: ${source.officialUrl}

Instructions:
1. Answer the user's question ONLY using the verified information provided above.
2. Do NOT invent, assume, or guess any details (dates, eligibility limits, documents, or websites) not present in the verified text.
3. If the answer cannot be found in the retrieved text, output exactly: "I couldn't find verified information from an official government source for this query." (Translate to selected language if necessary).
4. Do not mention any unofficial sites or blogs. Only refer to the provided official source.
5. Translate and answer in the user's selected language: ${languageName}.
6. Keep the answer structured and clean. Provide a complete, detailed answer covering eligibility, documents required, and the application process in full. Use bolding and markdown lists.
` : '';

    // 4. Strictly Timed 18-Second Cascade Handshake (No Retries or Backoffs)
    let result = null;
    if (source && !runInDemoMode) {
      const genAI = new GoogleGenerativeAI(apiKey!);
      let lastError: Error | null = null;

      const firstModelName = 'gemini-3.6-flash';
      try {
        console.log(`[STREAM LOG] Cascade Attempt 1: Trying model: ${firstModelName} with 10s timeout`);
        const model = genAI.getGenerativeModel({
          model: firstModelName,
          systemInstruction: systemPrompt
        });

        const streamPromise = model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.2
          }
        });

        result = await Promise.race([
          streamPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Connection timed out: 10 seconds of silence')), 10000)
          )
        ]);

        console.log(`[STREAM LOG] Gemini connection established successfully using model ${firstModelName}`);
      } catch (err) {
        lastError = err as Error;
        console.warn(`[STREAM LOG] Model ${firstModelName} failed: ${lastError.message}`);
      }

      // Model 2: If first model fails, try gemini-3.5-flash with remaining-time budget (min 8s)
      if (!result) {
        const secondModelName = 'gemini-3.5-flash';
        const elapsed = Date.now() - requestStart;
        const remaining = TOTAL_BUDGET_MS - elapsed;
        const timeoutForSecondModel = Math.max(remaining, 8000);

        try {
          console.log(`[STREAM LOG] Cascade Attempt 2: Trying model: ${secondModelName} with ${timeoutForSecondModel}ms timeout`);
          const model = genAI.getGenerativeModel({
            model: secondModelName,
            systemInstruction: systemPrompt
          });

          const streamPromise = model.generateContentStream({
            contents: [{ role: "user", parts: [{ text: message }] }],
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.2
            }
          });

          result = await Promise.race([
            streamPromise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Connection timed out: ${timeoutForSecondModel}ms of silence`)), timeoutForSecondModel)
            )
          ]);

          console.log(`[STREAM LOG] Gemini connection established successfully using model ${secondModelName}`);
        } catch (err) {
          lastError = err as Error;
          console.error(`[STREAM LOG] Fallback model ${secondModelName} also failed: ${lastError.message}`);
        }
      }

      // Handle final error if both primary and fallback failed
      if (!result && lastError) {
        console.error('[STREAM CASCADE ERROR] Handshake failed across all cascade models:', lastError);
        const errMsg = lastError.message;
        const isTimeout = errMsg.includes('timed out');
        const is503 = errMsg.includes('503') || errMsg.toLowerCase().includes('service unavailable') || errMsg.toLowerCase().includes('busy') || errMsg.toLowerCase().includes('overloaded');
        const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('quota');

        let errorStatus = 500;
        let errorText = "The AI assistant is temporarily unavailable. Please try asking again.";

        if (isTimeout) {
          errorStatus = 504;
          if (selectedLanguage === 'hi') {
            errorText = "एआई सहायक 18 सेकंड की निष्क्रियता के बाद समय समाप्त हो गया। कृपया फिर से प्रयास करें।";
          } else if (selectedLanguage === 'gu') {
            errorText = "AI સહાયક ૧૮ સેકન્ડની નિષ્ક્રિયતા પછી સમય સમાપ્ત થયો. કૃપા કરીને ફરીથી પ્રયાસ કરો।";
          } else {
            errorText = "The AI assistant timed out after 18 seconds of silence. Please try again.";
          }
        } else if (is503 || is429) {
          errorStatus = is503 ? 503 : 429;
          if (selectedLanguage === 'hi') {
            errorText = "एआई सहायक अत्यधिक मांग के कारण अस्थायी रूप से व्यस्त है। कृपया कुछ क्षणों में फिर से पूछने का प्रयास करें।";
          } else if (selectedLanguage === 'gu') {
            errorText = "AI સહાયક વધુ માંગને કારણે કામચલાઉ વ્યસ્ત છે. કૃપા કરીને થોડી ક્ષણો પછી ફરીથી પૂછવાનો પ્રયાસ કરો.";
          } else {
            errorText = "The AI assistant is temporarily busy due to high demand. Please try asking again in a moment.";
          }
        } else {
          if (selectedLanguage === 'hi') {
            errorText = "एआई सहायक अस्थायी रूप से अनुपलब्ध है। कृपया फिर से पूछने का प्रयास करें।";
          } else if (selectedLanguage === 'gu') {
            errorText = "AI સહાયક કામચલાઉ અનુપલબ્ધ છે. કૃપા કરીને ફરીથી પૂછવાનો પ્રયાસ કરો.";
          }
        }

        console.timeEnd('total-request');
        return new Response(JSON.stringify({ error: errorText }), {
          status: errorStatus,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Setup ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendJSON = (data: Record<string, unknown>) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
          } catch {
            // Stream may already be closed
          }
        };

        // If no source matches
        if (!source) {
          sendJSON({
            type: 'metadata',
            officialSource: 'SugamGov AI System',
            retrievalMethod: 'unmatched_default',
            isSupported: false
          });
          sendJSON({
            type: 'chunk',
            text: rejectedAnswer
          });
          controller.close();
          console.timeEnd('total-request');
          return;
        }

        // Send metadata first
        sendJSON({
          type: 'metadata',
          officialSource: source.sourceTitle,
          sourceUrl: source.officialUrl,
          retrievalMethod: 'cached_official_fallback',
          isSupported: true,
          serviceId: source.id
        });

        // If Demo Mode
        if (runInDemoMode) {
          // Simulate streaming chunks slightly to look natural
          const chunks = demoAnswer.split(' ');
          for (const word of chunks) {
            sendJSON({ type: 'chunk', text: word + ' ' });
            await new Promise(resolve => setTimeout(resolve, 20)); // brief simulated delay
          }
          controller.close();
          console.timeEnd('total-request');
          return;
        }

        // Stream Chunks directly as they arrive from Gemini
        try {
          if (!result) {
            throw new Error('No Gemini stream result initialized.');
          }

          let silenceTimeout = setTimeout(() => {
            controller.error(new Error('Connection timed out: 20 seconds of silence'));
          }, 20000);

          for await (const chunk of result.stream) {
            clearTimeout(silenceTimeout);
            const text = chunk.text();
            sendJSON({ type: 'chunk', text });

            silenceTimeout = setTimeout(() => {
              controller.error(new Error('Connection timed out: 20 seconds of silence'));
            }, 20000);
          }
          clearTimeout(silenceTimeout);
        } catch (err) {
          console.error('[STREAM CHUNK ERROR]:', err);
          const errMsg = (err as Error).message;
          const isTimeout = errMsg.includes('timed out');
          let errorText = "The AI assistant is temporarily unavailable. Please try asking again.";
          if (isTimeout) {
            errorText = "The AI assistant timed out after 20 seconds of silence. Please try again.";
          }
          sendJSON({ type: 'error', message: errorText });
        } finally {
          controller.close();
          console.timeEnd('total-request');
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error in chat API route:', error);
    try {
      console.timeEnd('total-request');
    } catch { }
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
