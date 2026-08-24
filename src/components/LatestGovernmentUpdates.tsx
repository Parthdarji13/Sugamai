'use client';

import React, { useState, useEffect } from 'react';
import { GovernmentUpdate } from '@/retrieval/updatesData';

interface LatestGovernmentUpdatesProps {
  language: 'en' | 'hi' | 'gu';
}

const LOCAL_TEXT = {
  en: {
    deptLabel: 'Department:',
    pubLabel: 'Published:',
    btnLabel: 'View Official Source →',
    loading: 'Loading announcements...',
    error: 'Failed to load updates. Please check connection.',
    empty: 'No updates available at the moment.',
    title: 'Latest Updates',
  },
  hi: {
    deptLabel: 'विभाग:',
    pubLabel: 'प्रकाशित:',
    btnLabel: 'सत्यापित स्रोत देखें →',
    loading: 'घोषणाएं लोड हो रही हैं...',
    error: 'अपडेट लोड करने में विफल। कृपया कनेक्शन जांचें।',
    empty: 'इस समय कोई अपडेट उपलब्ध नहीं है।',
    title: 'ताज़ा अपडेट',
  },
  gu: {
    deptLabel: 'વિભાગ:',
    pubLabel: 'પ્રકાશિત:',
    btnLabel: 'સત્તાવાર સ્ત્રોત જુઓ →',
    loading: 'જાહેરાતો લોડ થઈ રહી છે...',
    error: 'અપડેટ લોડ કરવામાં નિષ્ફળ. કૃપા કરીને કનેક્શન તપાસો.',
    empty: 'આ સમયે કોઈ અપડેટ ઉપલબ્ધ નથી.',
    title: 'તાજેતરના અપડેટ',
  },
};

/**
 * Converts a date string (e.g. "2024-11-01") to a human-friendly relative label.
 */
function getRelativeDate(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  // Format as "Mon DD" for older dates
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LatestGovernmentUpdates({ language }: LatestGovernmentUpdatesProps) {
  const [updates, setUpdates] = useState<GovernmentUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const text = LOCAL_TEXT[language] || LOCAL_TEXT.en;

  useEffect(() => {
    async function fetchUpdates() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/updates');
        if (!res.ok) {
          throw new Error('Failed to fetch government updates');
        }
        const data = await res.json();
        setUpdates(data);
      } catch (err) {
        console.error('Error fetching updates:', err);
        setError(text.error);
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, [text.error]);

  // Loading state — simple shimmer lines
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-4 w-28 rounded bg-white/5 animate-pulse" />
        {[1, 2, 3].map(n => (
          <div key={n} className="flex flex-col gap-1.5 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <div className="h-3 w-14 rounded bg-white/5 animate-pulse" />
            <div className="h-3.5 w-4/5 rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center text-xs font-medium text-red-400 py-6">
        <span>{error}</span>
      </div>
    );
  }

  // Empty state
  if (updates.length === 0) {
    return (
      <div className="text-center text-xs font-medium text-[var(--text-muted)] py-6">
        <span>{text.empty}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Section heading — no top padding since the parent card handles it */}

      <div className="flex flex-col gap-0">
        {updates.map((update, idx) => {
          const title = update.title[language] || update.title.en;
          const relDate = getRelativeDate(update.date);

          return (
            <a
              key={update.id}
              href={update.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`anim-slide-right stagger group flex flex-col gap-1 py-3.5 transition-colors ${idx < updates.length - 1 ? 'border-b' : ''
                }`}
              style={{
                ['--d' as string]: `${idx * 80}ms`,
                borderColor: 'var(--border)',
              }}
            >
              {/* Date label */}
              <span
                className="text-[10px] font-bold"
                style={{ color: 'var(--accent)' }}
              >
                {relDate}
              </span>

              {/* Title */}
              <span className="text-xs font-medium leading-snug text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
                {title}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
