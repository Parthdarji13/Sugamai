export interface Message {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    sourceName?: string;
    sourceUrl?: string;
    retrievalMethod?: 'live_fetch' | 'live_fetch_with_cached_context' | 'cached_official_fallback' | 'unmatched_default';
    isSupported?: boolean;
}

export type Language = 'en' | 'hi' | 'gu';

export interface UIText {
    title: string;
    heroLine1: string;
    heroLine2: string;
    subtitle: string;
    placeholder: string;
    disclaimer: string;
    sourceLinkText: string;
    badgeLive: string;
    badgeCombined: string;
    badgeCached: string;
    askEyebrow: string;
    askTitle: string;
    askSubtitle: string;
    askBoxHeadline: string;
    askBoxDesc: string;
    suggestionTags: string[];
    suggestions: string[];
    errorMsg: string;
    assistantLabel: string;
    userLabel: string;
    verifiedBadge: string;
    askAI: string;
    heroBadge: string;
    stat1: string;
    stat2: string;
    stat3: string;
    backToHome: string;
}