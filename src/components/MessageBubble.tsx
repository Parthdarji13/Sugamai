'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/chat';

interface MessageBubbleProps {
    message: Message;
    text: {
        sourceLinkText: string;
        badgeLive: string;
        badgeCombined?: string;
        badgeCached: string;
    };
    assistantLabel: string;
    userLabel: string;
    isStreaming?: boolean;
}

// Strip internal database/chunk bracket tags like [S2080 / S2080_scheme_name_0] or [S2080_eligibility_0]
const CITATION_REGEX = /\[\s*(?:S\d+|LMS_)[A-Za-z0-9_\-]*(?:\s*(?:\/|-)\s*[A-Za-z0-9_\-]+)*\s*\]/gi;

function cleanMessageText(text: string): string {
    if (!text) return '';
    return text
        .replace(CITATION_REGEX, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/ +([.,!?:;])/g, '$1')
        .trim();
}



export default function MessageBubble({ message, text, assistantLabel, userLabel, isStreaming }: MessageBubbleProps) {
    const isAI = message.sender === 'assistant';

    return (
        <div className={`anim-bubble flex w-full flex-col ${isAI ? 'items-start' : 'items-end'}`}>
            <div className="mb-1.5 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {isAI ? (
                    <>
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                            <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                            {assistantLabel}
                        </span>
                        {message.text && (
                            <>
                                <span className="opacity-30">•</span>
                                <span>Verified Response</span>
                            </>
                        )}
                    </>
                ) : (
                    <span>{userLabel}</span>
                )}
            </div>

            <div
                className={`relative max-w-[88%] rounded-2xl border p-4 text-sm shadow-sm sm:max-w-[85%] ${isAI ? 'text-[var(--text-secondary)]' : 'text-white'
                    }`}
                style={
                    isAI
                        ? { background: 'var(--surface)', borderColor: 'var(--border)' }
                        : {
                            background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 100%)',
                            borderColor: 'rgba(30, 58, 138, 0.3)',
                        }
                }
            >
                {message.text ? (
                    <div className="flex items-baseline inline">
                        <div className={`prose-answer text-xs font-normal leading-relaxed tracking-wide sm:text-sm inline ${isStreaming ? 'streaming-text' : ''}`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ children }) => <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight mt-5 mb-2 flex items-center gap-2 border-b border-gray-200 pb-1.5">{children}</h2>,
                                    h2: ({ children }) => <h3 className="text-sm sm:text-base font-bold text-[var(--accent-strong)] tracking-tight mt-4 mb-2 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"></span>{children}</h3>,
                                    h3: ({ children }) => <h4 className="text-xs sm:text-sm font-bold text-gray-800 tracking-wide mt-3 mb-1 uppercase text-[var(--accent)]">{children}</h4>,
                                    strong: ({ children }) => <strong className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[12px] sm:text-[13px] border border-gray-200">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    hr: () => <div className="my-3.5 h-[1px] w-full bg-[var(--border-strong)]" />,
                                    p: ({ children }) => <p className="mb-3 text-xs sm:text-sm leading-relaxed last:mb-0 inline-block w-full">{children}</p>,
                                    ul: ({ children }) => <ul className="my-2 space-y-1.5 list-none pl-0">{children}</ul>,
                                    ol: ({ children }) => <ol className="my-2 space-y-1.5 list-decimal pl-4">{children}</ol>,
                                    li: ({ children }) => <li className="text-xs sm:text-sm my-1 leading-relaxed relative">{children}</li>,
                                    a: ({ href, children }) => <a href={href} className="text-[var(--accent)] underline hover:text-[var(--accent-strong)]" target="_blank" rel="noopener noreferrer">{children}</a>
                                }}
                        >
                            {cleanMessageText(message.text)}
                        </ReactMarkdown>
                        </div>
                        {isStreaming && (
                            <span className="inline-block h-3.5 w-1.5 ml-1 bg-[var(--accent)] animate-pulse rounded-sm align-middle shadow-[0_0_8px_var(--accent)]" />
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 py-0.5">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="typing-dot h-1.5 w-1.5 rounded-full"
                                style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                )}

                {isAI && (message.sourceUrl || message.sourceType === 'rag_grounded') && (
                    <div
                        className="-mx-4 -mb-4 mt-4 flex flex-col gap-2 rounded-b-2xl border-t px-4 py-3 pt-3.5"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            {message.sourceType === 'rag_grounded' ? (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider"
                                    style={{
                                        background: message.confidence === 'high'
                                            ? 'rgba(16, 185, 129, 0.08)'
                                            : message.confidence === 'medium'
                                            ? 'rgba(245, 158, 11, 0.08)'
                                            : 'rgba(239, 68, 68, 0.08)',
                                        color: message.confidence === 'high'
                                            ? '#10B981'
                                            : message.confidence === 'medium'
                                            ? '#F59E0B'
                                            : '#EF4444',
                                        borderColor: message.confidence === 'high'
                                            ? 'rgba(16, 185, 129, 0.2)'
                                            : message.confidence === 'medium'
                                            ? 'rgba(245, 158, 11, 0.2)'
                                            : 'rgba(239, 68, 68, 0.2)',
                                    }}
                                >
                                    <span
                                        className="pulse-dot h-1.5 w-1.5 rounded-full"
                                        style={{
                                            background: message.confidence === 'high'
                                                ? '#10B981'
                                                : message.confidence === 'medium'
                                                ? '#F59E0B'
                                                : '#EF4444',
                                        }}
                                    />
                                    {message.grounded
                                        ? `RAG Grounded • ${message.confidence || 'medium'} confidence`
                                        : 'No matching evidence found'}
                                </span>
                            ) : (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider"
                                    style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                                >
                                    <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: '#10B981' }} />
                                    {message.sourceType === 'official_api'
                                        ? 'Official Government API'
                                        : message.isSupported
                                        ? (text.badgeCombined || 'Verified Official Scheme')
                                        : (text.badgeCached || 'Official Registry')}
                                </span>
                            )}

                            {message.sourceUrl && (
                                <a
                                    href={message.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                                    style={{ color: 'var(--accent)' }}
                                >
                                    <span>{text.sourceLinkText}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[9px] font-semibold text-[var(--text-muted)]">
                            <div className="flex items-center gap-1.5 truncate uppercase tracking-wider">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span className="truncate">
                                    {message.sourceType === 'rag_grounded'
                                        ? `${message.schemeName ? `${message.schemeName} • ` : ''}SugamGov RAG${message.totalResults ? ` • ${message.totalResults} schemes found` : ''}`
                                        : message.schemeName
                                        ? `${message.schemeName} • ${message.sourceName}`
                                        : message.sourceName}
                                </span>
                            </div>
                            {message.lastVerifiedAt && (
                                <span className="flex-shrink-0 opacity-80">
                                    Verified: {typeof message.lastVerifiedAt === 'string' ? message.lastVerifiedAt : new Date(message.lastVerifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}