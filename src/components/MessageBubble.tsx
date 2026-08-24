'use client';

import React from 'react';
import { Message } from '@/types/chat';

interface MessageBubbleProps {
    message: Message;
    text: {
        sourceLinkText: string;
        badgeLive: string;
        badgeCached: string;
    };
    assistantLabel: string;
    userLabel: string;
}

function formatAnswer(raw: string): string {
    return raw
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br />');
}

export default function MessageBubble({ message, text, assistantLabel, userLabel }: MessageBubbleProps) {
    const isAI = message.sender === 'assistant';

    return (
        <div className={`anim-bubble flex w-full flex-col ${isAI ? 'items-start' : 'items-end'}`}>
            <div className="mb-1.5 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {isAI ? (
                    <>
                        <span style={{ color: 'var(--accent-2)' }}>{assistantLabel}</span>
                        {message.text && (
                            <>
                                <span className="opacity-40">•</span>
                                <span>Verified Response</span>
                            </>
                        )}
                    </>
                ) : (
                    <span>{userLabel}</span>
                )}
            </div>

            <div
                className={`relative max-w-[88%] rounded-2xl border p-4 text-sm shadow-sm sm:max-w-[85%] ${isAI ? 'text-[var(--text-primary)]' : 'text-white'
                    }`}
                style={
                    isAI
                        ? { background: 'var(--surface)', borderColor: 'var(--border)' }
                        : {
                            background: 'linear-gradient(135deg, var(--accent-user) 0%, #2f52d6 100%)',
                            borderColor: 'rgba(63,107,255,0.4)',
                        }
                }
            >
                {message.text ? (
                    <div
                        className="prose-answer text-xs font-medium leading-relaxed tracking-wide sm:text-sm"
                        dangerouslySetInnerHTML={{ __html: `<p>${formatAnswer(message.text)}</p>` }}
                    />
                ) : (
                    <div className="flex items-center gap-1.5 py-0.5">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="typing-dot h-1.5 w-1.5 rounded-full"
                                style={{ background: 'var(--accent-2)', animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                )}

                {isAI && message.sourceUrl && (
                    <div
                        className="-mx-4 -mb-4 mt-4 flex flex-col gap-2 rounded-b-2xl border-t px-4 py-3 pt-3.5"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            {message.retrievalMethod === 'live_fetch' ? (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                                    style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--success)', borderColor: 'rgba(52,211,153,0.25)' }}
                                >
                                    <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                                    {text.badgeLive}
                                </span>
                            ) : (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'rgba(242,146,74,0.25)' }}
                                >
                                    {text.badgeCached}
                                </span>
                            )}

                            <a
                                href={message.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                                style={{ color: 'var(--accent-2)' }}
                            >
                                <span>{text.sourceLinkText}</span>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>

                        <div className="flex items-center gap-1.5 truncate text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="truncate">{message.sourceName}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}