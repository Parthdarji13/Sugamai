/**
 * ragService.ts
 * =============
 * Client service for communicating with the SugamGov RAG Backend API.
 *
 * Replaces direct Gemini API calls with grounded RAG pipeline:
 *   User Query → RAG Backend → Hybrid Retrieval + Evidence Context → Grounded Answer
 *
 * All answers are strictly grounded in retrieved government scheme evidence.
 * Gemini is used only inside the RAG backend for answer structuring — never directly.
 */

export interface RAGStreamEvent {
  /** SSE event type from RAG backend */
  eventType: 'metadata' | 'token' | 'done' | 'error';
  /** Parsed data payload */
  data: Record<string, unknown>;
}

export interface RAGHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface RAGChatRequest {
  message: string;
  session_id?: string | null;
  history?: RAGHistoryItem[];
  language?: string;
  top_k?: number;
  candidate_k?: number;
  state?: string | null;
  level?: string | null;
  category?: string | null;
}

export interface RAGChatResponse {
  session_id: string;
  message: string;
  answer: string;
  language: string;
  grounded: boolean;
  confidence: string;
  schemes: string[];
  evidence_used: Array<{
    scheme_id: string;
    scheme_name: string;
    chunk_id: string;
    field_name: string;
  }>;
  limitations: string | null;
  retrieval_method: string;
  total_results: number;
  coverage_info: Record<string, unknown>;
}

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';

/**
 * Calls the RAG backend's streaming chat endpoint.
 * Returns a ReadableStream of SSE events that can be consumed chunk by chunk.
 *
 * @throws Error if RAG backend is unreachable or returns non-200
 */
export async function streamRAGChat(
  request: RAGChatRequest,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${RAG_API_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: request.message,
        session_id: request.session_id || undefined,
        history: request.history || undefined,
        language: request.language || 'auto',
        top_k: request.top_k ?? 5,
        candidate_k: request.candidate_k ?? 25,
        state: request.state || undefined,
        level: request.level || undefined,
        category: request.category || undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = 'RAG backend returned an error.';
      try {
        const errBody = await response.json();
        if (errBody?.detail) errorDetail = errBody.detail;
      } catch {
        /* ignore parse failure */
      }
      throw new Error(`RAG API error (${response.status}): ${errorDetail}`);
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error('RAG backend request timed out. Please try again.');
    }
    throw err;
  }
}

/**
 * Calls the RAG backend's non-streaming chat endpoint (fallback).
 *
 * @throws Error if RAG backend is unreachable or returns non-200
 */
export async function callRAGChat(
  request: RAGChatRequest,
  timeoutMs: number = 30000
): Promise<RAGChatResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${RAG_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: request.message,
        session_id: request.session_id || undefined,
        history: request.history || undefined,
        language: request.language || 'auto',
        top_k: request.top_k ?? 5,
        candidate_k: request.candidate_k ?? 25,
        state: request.state || undefined,
        level: request.level || undefined,
        category: request.category || undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = 'RAG backend returned an error.';
      try {
        const errBody = await response.json();
        if (errBody?.detail) errorDetail = errBody.detail;
      } catch {
        /* ignore parse failure */
      }
      throw new Error(`RAG API error (${response.status}): ${errorDetail}`);
    }

    return (await response.json()) as RAGChatResponse;
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error('RAG backend request timed out. Please try again.');
    }
    throw err;
  }
}

/**
 * Checks if the RAG backend is healthy and reachable.
 */
export async function checkRAGHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${RAG_API_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return false;
    const data = await response.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Parses a single SSE line from the RAG streaming endpoint.
 * RAG backend sends events in the format:
 *   event: metadata\ndata: {...}\n\n
 *   event: token\ndata: {"text": "..."}\n\n
 *   event: done\ndata: {...}\n\n
 *   event: error\ndata: {"detail": "..."}\n\n
 */
export function parseSSELines(rawText: string): RAGStreamEvent[] {
  const events: RAGStreamEvent[] = [];
  const blocks = rawText.split('\n\n');

  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    let eventType = '';
    let dataStr = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataStr += line.slice(6);
      }
    }

    if (eventType && dataStr) {
      try {
        const data = JSON.parse(dataStr);
        events.push({
          eventType: eventType as RAGStreamEvent['eventType'],
          data,
        });
      } catch {
        console.warn('[RAG SSE] Failed to parse event data:', dataStr);
      }
    }
  }

  return events;
}
