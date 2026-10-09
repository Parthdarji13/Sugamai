import { ObjectId } from 'mongodb';
import { getSessionUser } from '@/lib/auth';
import {
  getConversationsCollection,
  getChatMessagesCollection,
  ConversationDocument,
  ChatMessageDocument,
} from '@/lib/dbCollections';
import { streamRAGChat, parseSSELines } from '@/services/ragService';

export async function POST(req: Request) {
  try {
    const { message, language, conversationId, ragSessionId, history: clientHistory } = await req.json();

    if (!message || message.trim() === '') {
      return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ──────────────────────────────────────────────
    // Authenticated Session Resolution (Guest if null)
    // ──────────────────────────────────────────────
    const sessionUser = await getSessionUser();
    let targetConversationId: ObjectId | null = null;
    let conversationsCollection: Awaited<ReturnType<typeof getConversationsCollection>> | null = null;
    let chatMessagesCollection: Awaited<ReturnType<typeof getChatMessagesCollection>> | null = null;
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (sessionUser) {
      conversationsCollection = await getConversationsCollection();
      chatMessagesCollection = await getChatMessagesCollection();
      const userObjectId = new ObjectId(sessionUser.id);

      if (conversationId) {
        if (!ObjectId.isValid(conversationId)) {
          return new Response(JSON.stringify({ error: 'Invalid conversationId format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const convObjectId = new ObjectId(conversationId);
        const existingConv = await conversationsCollection.findOne({
          _id: convObjectId,
          userId: userObjectId,
        });
        if (!existingConv) {
          return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        targetConversationId = convObjectId;

        // Fetch recent messages (up to 8) to feed to RAG context
        const priorDocs = await chatMessagesCollection
          .find({ conversationId: targetConversationId })
          .sort({ createdAt: -1 })
          .limit(8)
          .toArray();

        conversationHistory = priorDocs
          .reverse()
          .map((doc) => ({
            role: doc.sender as 'user' | 'assistant',
            content: doc.text,
          }));
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
    } else if (Array.isArray(clientHistory)) {
      // Guest user session history passed from client
      conversationHistory = clientHistory.slice(-8).map((m: any) => ({
        role: (m.sender === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.text || '',
      }));
    }

    // ──────────────────────────────────────────────
    // Map language for RAG backend
    // ──────────────────────────────────────────────
    const selectedLanguage = language || 'auto';
    const activeSessionId = targetConversationId
      ? targetConversationId.toHexString()
      : (ragSessionId || undefined);

    // ──────────────────────────────────────────────
    // Call RAG Backend (Streaming)
    // ──────────────────────────────────────────────
    let ragResponse: Response;
    try {
      ragResponse = await streamRAGChat({
        message: message.trim(),
        language: selectedLanguage,
        top_k: 5,
        candidate_k: 25,
        session_id: activeSessionId,
        history: conversationHistory.length > 0 ? conversationHistory : undefined,
      });
    } catch (err) {
      const ragError = (err as Error).message || 'RAG backend is unreachable.';
      console.error('[RAG CONNECTION ERROR]:', ragError);

      // Return a meaningful error to the frontend
      const errorStatus = ragError.includes('timed out') ? 504 : 503;
      return new Response(
        JSON.stringify({
          error: 'The AI knowledge base service is currently unavailable. Please ensure the RAG backend is running and try again.',
        }),
        {
          status: errorStatus,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // ──────────────────────────────────────────────
    // Re-stream RAG SSE events → Frontend SSE format
    // ──────────────────────────────────────────────
    const ragReader = ragResponse.body?.getReader();
    if (!ragReader) {
      return new Response(
        JSON.stringify({ error: 'Failed to establish streaming connection with RAG backend.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const sendJSON = (data: Record<string, unknown>) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
          } catch {
            /* stream closed */
          }
        };

        let ragSessionId: string | undefined;
        let primaryScheme: string | undefined;
        let schemesFound: string[] = [];
        let evidenceUsed: Array<Record<string, string>> = [];
        let isGrounded = false;
        let ragConfidence = 'low';
        let retrievalMethod = 'hybrid_rrf';
        let totalResults = 0;
        let limitations: string | undefined;
        let fullAssistantResponse = '';
        let metadataSent = false;
        let buffer = '';

        // Persist completed message helper
        const persistAssistantMessage = async (fullText: string) => {
          if (!targetConversationId || !chatMessagesCollection || !conversationsCollection) return;
          if (!fullText || fullText.trim() === '') return;
          try {
            await chatMessagesCollection.insertOne({
              conversationId: targetConversationId,
              sender: 'assistant',
              text: fullText,
              sourceName: primaryScheme || 'SugamGov RAG',
              sourceUrl: 'https://www.myscheme.gov.in',
              schemeName: primaryScheme,
              sourceType: 'rag_grounded',
              confidence: ragConfidence,
              grounded: isGrounded,
              retrievalMethod: 'rag_grounded',
              isSupported: isGrounded,
              createdAt: new Date(),
            } as ChatMessageDocument);

            await conversationsCollection.updateOne(
              { _id: targetConversationId },
              { $set: { updatedAt: new Date() } }
            );

            // Automatically upgrade generic titles to primary scheme name or fallback
            const currentConv = await conversationsCollection.findOne({ _id: targetConversationId });
            if (currentConv) {
              const currentTitle = (currentConv.title || '').trim().toLowerCase();
              const isGenericTitle = ['new conversation', 'hi', 'hello', 'hey', 'namaste', 'kem cho'].includes(currentTitle) || currentTitle.length <= 4;
              
              if (isGenericTitle) {
                let newTitle = '';
                if (primaryScheme) {
                  newTitle = primaryScheme.slice(0, 80);
                } else {
                  const userConvCount = await conversationsCollection.countDocuments({ userId: currentConv.userId });
                  newTitle = `Conversation ${userConvCount}`;
                }
                
                await conversationsCollection.updateOne(
                  { _id: targetConversationId },
                  { $set: { title: newTitle } }
                );
              }
            }
          } catch (dbErr) {
            console.error('[DB PERSISTENCE ERROR]:', dbErr);
          }
        };

        try {
          while (true) {
            const { done, value } = await ragReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse complete SSE event blocks (separated by \n\n)
            const events = parseSSELines(buffer);

            // Keep any incomplete trailing data in the buffer
            const lastDoubleNewline = buffer.lastIndexOf('\n\n');
            if (lastDoubleNewline >= 0) {
              buffer = buffer.slice(lastDoubleNewline + 2);
            }

            for (const event of events) {
              switch (event.eventType) {
                case 'metadata': {
                  ragSessionId = event.data.session_id as string | undefined;
                  isGrounded = event.data.grounded as boolean || false;
                  ragConfidence = (event.data.confidence as string) || 'low';
                  retrievalMethod = (event.data.retrieval_method as string) || 'hybrid_rrf';
                  totalResults = (event.data.total_results as number) || 0;
                  schemesFound = (event.data.schemes as string[]) || [];
                  evidenceUsed = (event.data.evidence_used as Array<Record<string, string>>) || [];
                  limitations = event.data.limitations as string | undefined;

                  // Determine primary scheme name for display
                  primaryScheme = evidenceUsed.length > 0
                    ? evidenceUsed[0].scheme_name
                    : undefined;

                  // Send metadata in the format the frontend expects
                  sendJSON({
                    type: 'metadata',
                    officialSource: 'SugamGov RAG Knowledge Base',
                    sourceUrl: 'https://www.myscheme.gov.in',
                    schemeName: primaryScheme,
                    sourceType: 'rag_grounded',
                    retrievalMethod: retrievalMethod,
                    isSupported: isGrounded,
                    conversationId: targetConversationId ? targetConversationId.toHexString() : undefined,
                    // RAG-specific metadata
                    grounded: isGrounded,
                    confidence: ragConfidence,
                    schemes: schemesFound,
                    evidenceUsed: evidenceUsed,
                    totalResults: totalResults,
                    ragSessionId: ragSessionId,
                    limitations: limitations,
                  });
                  metadataSent = true;
                  break;
                }

                case 'token': {
                  // If metadata wasn't sent yet, send a minimal one first
                  if (!metadataSent) {
                    sendJSON({
                      type: 'metadata',
                      officialSource: 'SugamGov RAG Knowledge Base',
                      sourceUrl: 'https://www.myscheme.gov.in',
                      sourceType: 'rag_grounded',
                      retrievalMethod: 'hybrid_rrf',
                      isSupported: true,
                      conversationId: targetConversationId ? targetConversationId.toHexString() : undefined,
                      grounded: true,
                      confidence: 'medium',
                    });
                    metadataSent = true;
                  }

                  const tokenText = (event.data.text as string) || '';
                  fullAssistantResponse += tokenText;
                  // Send as 'chunk' — the format the frontend already expects
                  sendJSON({ type: 'chunk', text: tokenText });
                  break;
                }

                case 'done': {
                  // Update grounding status from the final event
                  if (event.data.grounded !== undefined) {
                    isGrounded = event.data.grounded as boolean;
                  }
                  if (event.data.confidence) {
                    ragConfidence = event.data.confidence as string;
                  }
                  break;
                }

                case 'error': {
                  const errorDetail = (event.data.detail as string) || 'An error occurred in the RAG pipeline.';
                  console.error('[RAG STREAM ERROR]:', errorDetail);
                  sendJSON({ type: 'error', message: errorDetail });
                  break;
                }
              }
            }
          }

          // Persist the completed assistant response (cleaned of any technical citations)
          if (fullAssistantResponse.trim()) {
            const cleanedAssistantResponse = fullAssistantResponse
              .replace(/\[\s*(?:S\d+|LMS_)[A-Za-z0-9_\-]*(?:\s*(?:\/|-)\s*[A-Za-z0-9_\-]+)*\s*\]/gi, '')
              .replace(/[ \t]{2,}/g, ' ')
              .replace(/ +([.,!?:;])/g, '$1')
              .trim();
            await persistAssistantMessage(cleanedAssistantResponse);
          }
        } catch (err) {
          console.error('[STREAM RELAY ERROR]:', err);
          sendJSON({
            type: 'error',
            message: 'The AI knowledge base connection was interrupted. Please try asking again.',
          });
        } finally {
          try {
            ragReader.releaseLock();
          } catch {
            /* ignore release lock error */
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
