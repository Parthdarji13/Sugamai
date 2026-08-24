'use client';

import React from 'react';

interface TypingIndicatorProps {
    label: string;
}

export default function TypingIndicator({ label }: TypingIndicatorProps) {
    return (
        <div className="flex w-full flex-col items-start anim-bubble">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <span
                    className="pulse-dot h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                />
                <span style={{ color: 'var(--accent)' }}>{label}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border px-4 py-3.5"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
                <span className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="typing-dot h-1.5 w-1.5 rounded-full"
                            style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </span>
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    retrieving &amp; verifying official information…
                </span>
            </div>
        </div>
    );
}