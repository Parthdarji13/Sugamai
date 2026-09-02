import { GoogleGenerativeAI } from '@google/generative-ai';
import { retrieveHybridOfficialInfo } from '@/retrieval/hybrid';
import { isQuotaExceededError, isAuthConfigError, isTimeoutError, isTemporaryModelError, classifyModelError } from '@/utils/gemini';
import type { Message } from '@/types/chat';
import { ObjectId } from 'mongodb';
import { getSessionUser } from '@/lib/auth';
import { getConversationsCollection, getChatMessagesCollection, ConversationDocument, ChatMessageDocument } from '@/lib/dbCollections';

export async function POST(req: Request) {
  // Start Total Request timer
  console.time('total-request');
  const requestStart = Date.now();
  const TOTAL_BUDGET_MS = 25000;

  try {
    const { message, language, lastMatchedSourceId, history, conversationId } = await req.json();

    if (!message || message.trim() === '') {
      console.timeEnd('total-request');
      return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Authenticated Session Resolution (Guest if null)
    const sessionUser = await getSessionUser();
    let targetConversationId: ObjectId | null = null;
    let conversationsCollection: Awaited<ReturnType<typeof getConversationsCollection>> | null = null;
    let chatMessagesCollection: Awaited<ReturnType<typeof getChatMessagesCollection>> | null = null;

    if (sessionUser) {
      conversationsCollection = await getConversationsCollection();
      chatMessagesCollection = await getChatMessagesCollection();
      const userObjectId = new ObjectId(sessionUser.id);

      if (conversationId) {
        if (!ObjectId.isValid(conversationId)) {
          console.timeEnd('total-request');
          return new Response(JSON.stringify({ error: 'Invalid conversationId format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const convObjectId = new ObjectId(conversationId);
        const existingConv = await conversationsCollection.findOne({
          _id: convObjectId,
          userId: userObjectId,
        });
        if (!existingConv) {
          console.timeEnd('total-request');
          return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        targetConversationId = convObjectId;
      } else {
        const titleSnippet = message.trim().replace(/\s+/g, ' ').slice(0, 50);
        const now = new Date();
        const newConv = await conversationsCollection.insertOne({
          userId: userObjectId,
          title: titleSnippet || 'New conversation',
          createdAt: now,
          updatedAt: now,
        } as ConversationDocument);
        targetConversationId = newConv.insertedId;
      }

      // Persist user query to database
      await chatMessagesCollection.insertOne({
        conversationId: targetConversationId,
        sender: 'user',
        text: message.trim(),
        createdAt: new Date(),
      } as ChatMessageDocument);

      await conversationsCollection.updateOne(
        { _id: targetConversationId },
        { $set: { updatedAt: new Date() } }
      );
    }

    const selectedLanguage = language || 'en'; // 'en', 'hi', 'gu'
    let languageName = 'English';
    if (selectedLanguage === 'hi') languageName = 'Hindi';
    if (selectedLanguage === 'gu') languageName = 'Gujarati';

    // 1. Centralized Hybrid Retrieval (Lexical + Semantic Vector + Live Fetch Priority)
    console.time('retrieval-layer');
    const retrievalResult = await retrieveHybridOfficialInfo(message, lastMatchedSourceId);
    console.timeEnd('retrieval-layer');

    const isSupported = retrievalResult.matched;
    const relevantContent = retrievalResult.combinedPromptContext || retrievalResult.primaryContent;

    const apiKey = process.env.GEMINI_API_KEY;
    const runInDemoMode = !apiKey || apiKey.trim() === '' || apiKey === 'your_key_here';

    const isFreshnessUnverified = retrievalResult.isFreshnessQuery && !retrievalResult.freshDataAvailable;

    let demoAnswer = '';
    if (runInDemoMode) {
      console.warn('GEMINI_API_KEY is not set in environment variables. Running in Demo Mode.');
      if (isSupported) {
        if (isFreshnessUnverified) {
          if (selectedLanguage === 'hi') {
            demoAnswer = `**[डेमो मोड - जीमिनी API कुंजी कॉन्फ़िगर नहीं है]**\n\nमुझे वर्तमान में आधिकारिक सरकारी स्रोतों से **${retrievalResult.serviceName || 'सरकारी योजना'}** के लिए किसी हालिया आधिकारिक अपडेट की पुष्टि नहीं हो सकी। मैं सत्यापित सामान्य दिशानिर्देश प्रदान कर सकता हूँ, लेकिन पुरानी जानकारी को नवीनतम अपडेट के रूप में प्रस्तुत नहीं करना चाहता:\n\n${relevantContent}\n\n*कृपया इस प्रोजेक्ट को चलाने के लिए \`frontend/.env.local\` में अपनी \`GEMINI_API_KEY\` जोड़ें।*`;
          } else if (selectedLanguage === 'gu') {
            demoAnswer = `**[ડેમો મોડ - જેમિની API કી સેટ નથી]**\n\nમને હાલમાં સત્તાવાર સરકારી સ્ત્રોતોમાંથી **${retrievalResult.serviceName || 'સરકારી યોજના'}** માટે કોઈ તાજા સત્તાવાર અપડેટની ચકાસણી મળી શકી નથી. હું ચકાસાયેલ સામાન્ય માર્ગદર્શિકા પ્રદાન કરી શકું છું, પરંતુ જૂની માહિતીને તાજા અપડેટ તરીકે રજૂ કરવા માંગતો નથી:\n\n${relevantContent}\n\n*કૃપા કરીને આ પ્રોજેક્ટ ચલાવવા માટે \`frontend/.env.local\` માં તમારી \`GEMINI_API_KEY\` ઉમેરો.*`;
          } else {
            demoAnswer = `**[Demo Mode - Gemini API Key Not Configured]**\n\nI couldn't verify a recent official update for **${retrievalResult.serviceName || 'Government Scheme'}** from available government sources right now. I can provide the verified general guideline information, but I don't want to present older information as the latest update:\n\n${relevantContent}\n\n*Please add your \`GEMINI_API_KEY\` in \`frontend/.env.local\` to run the live AI summarizer.*`;
          }
        } else {
          if (selectedLanguage === 'hi') {
            demoAnswer = `**[डेमो मोड - जीमिनी API कुंजी कॉन्फ़िगर नहीं है]**\n\nयहाँ **${retrievalResult.serviceName || 'सरकारी योजना'}** के बारे में आधिकारिक जानकारी दी गई है:\n\n${relevantContent}\n\n*कृपया इस प्रोजेक्ट को चलाने के लिए \`frontend/.env.local\` में अपनी \`GEMINI_API_KEY\` जोड़ें।*`;
          } else if (selectedLanguage === 'gu') {
            demoAnswer = `**[ડેમો મોડ - જેમિની API કી સેટ નથી]**\n\nઅહીં **${retrievalResult.serviceName || 'સરકારી યોજના'}** વિશેની સત્તાવાર માહિતી છે:\n\n${relevantContent}\n\n*કૃપા કરીને આ પ્રોજેક્ટ ચલાવવા માટે \`frontend/.env.local\` માં તમારી \`GEMINI_API_KEY\` ઉમેરો.*`;
          } else {
            demoAnswer = `**[Demo Mode - Gemini API Key Not Configured]**\n\nHere is the official information retrieved for **${retrievalResult.serviceName || 'Government Scheme'}**:\n\n${relevantContent}\n\n*Please add your \`GEMINI_API_KEY\` in \`frontend/.env.local\` to run the live AI summarizer.*`;
          }
        }
      } else {
        if (selectedLanguage === 'hi') {
          demoAnswer = `**[डेमो मोड]**\n\nमुझे इस प्रश्न के लिए आधिकारिक सरकारी स्रोतों से सत्यापित जानकारी नहीं मिल सकी। लाइव AI काम नहीं कर रहा है।`;
        } else if (selectedLanguage === 'gu') {
          demoAnswer = `**[ડેમો મોડ]**\n\nમને આ પ્રશ્ન માટે સત્તાવાર સરકારી સ્ત્રોતોમાંથી ચકાસાયેલ માહિતી મળી શકી નથી. લાઈવ AI કામ કરી રહ્યું નથી.`;
        } else {
          demoAnswer = `**[Demo Mode]**\n\nI couldn't find verified information from an official government source for this query. Live AI is disabled without an API key.`;
        }
      }
    }

    const sourceHeading = retrievalResult.retrievalMethod === 'live_fetch_with_cached_context'
      ? 'Here is the VERIFIED information retrieved from official government sources (combining live portal updates and verified official guidelines):'
      : (retrievalResult.retrievalMethod === 'live_fetch'
        ? 'Here is the LIVE VERIFIED information retrieved from the official government portal:'
        : (retrievalResult.retrievalMethod === 'semantic_hybrid_rag'
          ? 'Here is the VERIFIED information retrieved via hybrid official semantic retrieval:'
          : 'Here is the VERIFIED reference information retrieved from official government guidelines:'));

    const freshnessGroundingRule = isFreshnessUnverified
      ? `\nCRITICAL FRESHNESS RULE:
- The citizen is asking about the latest update, recent change, or new announcement for this scheme.
- However, NO fresh live official update was found in today's official government feeds.
- You MUST explicitly state that no recent official live update could be verified right now from available government sources.
- NEVER claim or present the standard guidelines below as a "latest update", "new change", or "recent announcement".
- You may summarize the verified general guidelines for reference, but clearly explain they are established baseline guidelines.`
      : '';

    const systemPrompt = isSupported ? `You are SugamGov AI, an intelligent government service assistant.
Your goal is to answer the citizen's question accurately using only the retrieved official government information below.

${sourceHeading}
---
${relevantContent}
---

Official Source: ${retrievalResult.sourceTitle}
Source Link: ${retrievalResult.sourceUrl}

Instructions:
1. Answer the user's question ONLY using the verified information provided above.
2. Do NOT invent, assume, or guess any details (dates, eligibility limits, benefit amounts, documents, or websites) that are NOT present anywhere in the retrieved text above.
3. If the retrieved text contains relevant information related to the question — even if it appears across different sections — use it to provide a thorough, structured, and helpful answer.
4. If a specific point or sub-detail is not explicitly listed in the text, state what the verified guideline specifies for that service rather than giving a blanket refusal.
5. ONLY output exactly: "I couldn't find verified information from an official government source for this query." if the user query is asking about a completely unrelated topic or scheme not covered in the text above. Translate this phrase to the selected language if necessary.
6. Do not mention any unofficial sites or blogs. Only refer to the provided official source and its URL.
7. Translate and answer in the user's selected language: ${languageName}.
8. Structure your answer using "## Section Title" for major topics (e.g. "## Eligibility Criteria", "## Required Documents", "## Application Process", "## Key Benefits"). Use bolding ("**key term**") for important numbers, amounts, ages, and document names so they stand out clearly for the citizen. Keep the tone helpful, polite, and clear.${freshnessGroundingRule}
` : `You are SugamGov AI, an intelligent government service assistant for citizens of India.
The citizen has asked a question, but no specific local official government document was retrieved for it.
Please answer the question accurately and politely using your general knowledge about government schemes, documents, and public services.
If the question is completely unrelated to government services, public schemes, or citizen rights, politely guide the user back to government-related topics.
Translate and answer in the user's selected language: ${languageName}.
Structure your response using "## Section Title" for major topics (e.g. "## Scheme Overview", "## Eligibility", "## How to Apply"). Use bolding ("**key term**") for important numbers, fees, and requirements so they stand out clearly.`;

    // Quota-Aware & Resilient Gemini Cascade (No Retries on 429 or 503)
    let result = null;
    if (!runInDemoMode) {
      const genAI = new GoogleGenerativeAI(apiKey!);
      let lastError: Error | null = null;
      // Ordered cascade: newest/fastest first → resilient fallbacks
      const CASCADE_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

      for (let i = 0; i < CASCADE_MODELS.length; i++) {
        const modelName = CASCADE_MODELS[i];
        const attemptNum = i + 1;

        const elapsed = Date.now() - requestStart;
        const remaining = TOTAL_BUDGET_MS - elapsed;
        if (remaining <= 0) {
          console.warn(`[STREAM LOG] Total budget of ${TOTAL_BUDGET_MS}ms exceeded before attempting model ${modelName}`);
          break;
        }

        // Predictable per-model timeouts:
        // - 3.6-flash & 3.5-flash capped at 6s so timeouts never consume the entire budget
        // - 3.5-flash-lite gets the remaining global budget (minimum 8s) to guarantee execution
        const timeoutMs = (i === 0 || i === 1) ? Math.min(6000, remaining) : Math.max(remaining - 500, 8000);

        try {
          console.log(`[STREAM LOG] Cascade Attempt ${attemptNum}: Trying model: ${modelName}`);
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
          });

          const recentHistory = (history || []).slice(-6);
          const streamPromise = model.generateContentStream({
            contents: [
              ...recentHistory.map((msg: Message) => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
              })),
              { role: "user", parts: [{ text: message }] }
            ],
            generationConfig: {
              // Note: temperature is deprecated in Gemini 3.x and silently ignored.
              // Removed to avoid future HTTP 400 INVALID_ARGUMENT errors.
              maxOutputTokens: 2048
            }
          });

          // Race the stream connection against a per-model timeout.
          // IMPORTANT: capture the timeout handle so we can clear it when
          // streamPromise wins the race. Without clearTimeout the orphaned
          // setTimeout fires ~timeoutMs later and calls reject() on an
          // already-settled Promise — an unhandled rejection that crashes
          // Node.js 15+ processes.
          let connectionTimeoutId: ReturnType<typeof setTimeout>;
          const connectionTimeoutPromise = new Promise<never>((_, reject) => {
            connectionTimeoutId = setTimeout(
              () => reject(new Error(`Connection timed out: ${timeoutMs}ms of silence`)),
              timeoutMs
            );
          });

          result = await Promise.race([streamPromise, connectionTimeoutPromise]);

          // Stream won — kill the pending timer before it becomes an unhandled rejection.
          clearTimeout(connectionTimeoutId!);

          console.log(`[STREAM LOG] Gemini connection established successfully using model ${modelName}`);
          break;
        } catch (err) {
          lastError = err as Error;
          const errCategory = classifyModelError(err);
          if (errCategory === 'quota') {
            console.warn(`[STREAM LOG] Model ${modelName} quota exhausted (429). Skipping without retry.`);
          } else if (errCategory === 'auth') {
            console.error(`[STREAM LOG] Model ${modelName} failed due to authentication/configuration error: ${lastError.message}`);
            break; // Stop cascade — auth failure affects all models equally
          } else if (errCategory === 'temporary') {
            console.warn(`[STREAM LOG] Model ${modelName} temporarily unavailable (503). Skipping to fallback.`);
          } else if (errCategory === 'timeout') {
            console.warn(`[STREAM LOG] Model ${modelName} timed out (${timeoutMs}ms). Skipping to fallback model.`);
          } else {
            console.warn(`[STREAM LOG] Model ${modelName} failed: ${lastError.message}`);
          }
        }
      }

      // Handle final error — all cascade models exhausted
      if (!result && lastError) {
        const finalCategory = classifyModelError(lastError);
        const isQuota = isQuotaExceededError(lastError);
        const isAuth = isAuthConfigError(lastError);
        const isTimeout = isTimeoutError(lastError);
        const isTemporary = isTemporaryModelError(lastError);

        // Note: retrieval succeeded — this is a generation/model-layer failure only
        console.error('[STREAM CASCADE ERROR] All Gemini models unavailable.');
        if (isQuota && isTemporary) {
          console.error('[STREAM CASCADE ERROR] Reason: mixed quota and temporary service exhaustion.');
        } else if (isQuota) {
          console.error('[STREAM CASCADE ERROR] Reason: quota exhaustion across all cascade models.');
        } else if (isTemporary) {
          console.error('[STREAM CASCADE ERROR] Reason: temporary service unavailability (503/502) across all cascade models.');
        } else if (isAuth) {
          console.error('[STREAM CASCADE ERROR] Reason: authentication/configuration error — cascade stopped early.');
        } else if (isTimeout) {
          console.error('[STREAM CASCADE ERROR] Reason: timeout across all cascade models.');
        } else {
          console.error(`[STREAM CASCADE ERROR] Reason: unknown (${finalCategory}). Last error: ${lastError.message}`);
        }

        let errorStatus = 500;
        let errorText = "The AI assistant is temporarily unavailable. Please try asking again.";

        if (isAuth) {
          errorStatus = 401;
          errorText = "AI service configuration issue (Invalid API Key). Please check your server environment.";
        } else if (isTimeout) {
          errorStatus = 504;
          if (selectedLanguage === 'hi') {
            errorText = "एआई सहायक 18 सेकंड की निष्क्रियता के बाद समय समाप्त हो गया। कृपया फिर से प्रयास करें।";
          } else if (selectedLanguage === 'gu') {
            errorText = "AI સહાયક ૧૮ સેકન્ડની નિષ્ક્રિયતા પછી સમય સમાપ્ત થયો. કૃપા કરીને ફરીથી પ્રયાસ કરો।";
          } else {
            errorText = "The AI assistant timed out after 18 seconds of silence. Please try again.";
          }
        } else if (isTemporary || isQuota) {
          // Always surface a user-friendly 503 for any temporary/quota failure
          errorStatus = 503;
          if (selectedLanguage === 'hi') {
            errorText = "एआई सहायक अत्यधिक मांग के कारण अस्थायी रूप से व्यस्त है। कृपया कुछ क्षणों में फिर से पूछने का प्रयास करें।";
          } else if (selectedLanguage === 'gu') {
            errorText = "AI સહાયક વધુ માંગને કારણે કામચલાઉ વ્યસ્ત છે. કૃપા કરીને થોડી ક્ષણો પછી ફરીથી પૂછવાનો પ્રયાસ કરો।";
          } else {
            errorText = "The AI service is temporarily unavailable. Please try again in a moment.";
          }
        } else {
          if (selectedLanguage === 'hi') {
            errorText = "एआई सहायक अस्थायी रूप से अनुपलब्ध है। कृपया फिर से पूछने का प्रयास करें।";
          } else if (selectedLanguage === 'gu') {
            errorText = "AI સહાયક કામચલાઉ અનુપલબ્ધ છે. કૃપા કરીને ફરીથી પૂછવાનો પ્રયાસ કરો।";
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

        // Send metadata first
        if (isSupported) {
          sendJSON({
            type: 'metadata',
            officialSource: retrievalResult.sourceTitle,
            sourceUrl: retrievalResult.sourceUrl,
            retrievalMethod: retrievalResult.retrievalMethod,
            isSupported: true,
            serviceId: retrievalResult.serviceId,
            isFreshnessQuery: retrievalResult.isFreshnessQuery,
            freshDataAvailable: retrievalResult.freshDataAvailable,
            conversationId: targetConversationId ? targetConversationId.toHexString() : undefined,
          });
        } else {
          sendJSON({
            type: 'metadata',
            officialSource: 'SugamGov AI System',
            retrievalMethod: 'unmatched_default',
            isSupported: false,
            conversationId: targetConversationId ? targetConversationId.toHexString() : undefined,
          });
        }

        // Persistence Helper for Completed Assistant Response
        const persistAssistantMessage = async (fullText: string) => {
          if (!targetConversationId || !chatMessagesCollection || !conversationsCollection) return;
          if (!fullText || fullText.trim() === '') return;
          try {
            await chatMessagesCollection.insertOne({
              conversationId: targetConversationId,
              sender: 'assistant',
              text: fullText,
              sourceName: isSupported ? retrievalResult.sourceTitle : undefined,
              sourceUrl: isSupported ? retrievalResult.sourceUrl : undefined,
              retrievalMethod: retrievalResult.retrievalMethod,
              isSupported: isSupported,
              serviceId: retrievalResult.serviceId,
              createdAt: new Date(),
            } as ChatMessageDocument);

            await conversationsCollection.updateOne(
              { _id: targetConversationId },
              { $set: { updatedAt: new Date() } }
            );
          } catch (dbErr) {
            console.error('[DB PERSISTENCE ERROR] Failed to save assistant message:', (dbErr as Error).message);
          }
        };

        // If Demo Mode
        if (runInDemoMode) {
          // Simulate streaming chunks slightly to look natural
          const chunks = demoAnswer.split(' ');
          for (const word of chunks) {
            sendJSON({ type: 'chunk', text: word + ' ' });
            await new Promise(resolve => setTimeout(resolve, 20)); // brief simulated delay
          }
          await persistAssistantMessage(demoAnswer);
          controller.close();
          console.timeEnd('total-request');
          return;
        }

        let fullAssistantResponse = '';
        let streamCompletedSuccessfully = false;

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
            fullAssistantResponse += text;
            sendJSON({ type: 'chunk', text });

            silenceTimeout = setTimeout(() => {
              controller.error(new Error('Connection timed out: 20 seconds of silence'));
            }, 20000);
          }
          clearTimeout(silenceTimeout);
          streamCompletedSuccessfully = true;
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
          if (streamCompletedSuccessfully && fullAssistantResponse.trim()) {
            await persistAssistantMessage(fullAssistantResponse);
          }
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
