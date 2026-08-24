export interface Message {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    sourceName?: string;
    sourceUrl?: string;
    retrievalMethod?: 'live_fetch' | 'cached_official_fallback' | 'unmatched_default';
    isSupported?: boolean;
}

export type Language = 'en' | 'hi' | 'gu';