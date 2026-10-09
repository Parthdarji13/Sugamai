export interface EvidenceCitation {
    scheme_id: string;
    scheme_name: string;
    chunk_id: string;
    field_name: string;
}

export interface Message {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    sourceName?: string;
    sourceUrl?: string;
    schemeName?: string;
    lastVerifiedAt?: string | Date;
    sourceType?: 'official_api' | 'verified_database' | 'rag_grounded';
    retrievalMethod?: string;
    isSupported?: boolean;
    /** RAG-specific metadata */
    grounded?: boolean;
    confidence?: 'high' | 'medium' | 'low' | string;
    schemes?: string[];
    evidenceUsed?: EvidenceCitation[];
    ragSessionId?: string;
    totalResults?: number;
    limitations?: string;
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
    newChat: string;
}