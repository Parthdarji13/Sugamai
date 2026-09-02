'use client';

import React, { useState, useEffect } from 'react';
import { GovernmentUpdate } from '@/retrieval/updatesData';

interface LatestGovernmentUpdatesProps {
  language: 'en' | 'hi' | 'gu';
}

const LOCAL_TEXT = {
  en: {
    sectionTag: 'INTELLIGENCE FEED',
    sectionTitle: 'Latest Government Updates',
    sectionSubtitle: "What's happening across Government",
    liveBadge: 'SAMPLE UPDATES',
    liveStatus: 'Examples',
    featuredBadge: 'FEATURED DISPATCH',
    streamBadge: 'RECENT BULLETINS',
    deptLabel: 'Department',
    pubLabel: 'Published',
    btnLabel: 'View Official Source',
    verifiedNotice: 'Verified Official Release',
    loading: 'Loading official dispatches...',
    error: 'Unable to stream live updates. Showing verified registry.',
    empty: 'No dispatches recorded at this time.',
    today: 'Today',
    yesterday: 'Yesterday',
    exampleNote: 'OFFICIAL GOVERNMENT DISPATCHES',
  },
  hi: {
    sectionTag: 'सूचना तंत्र',
    sectionTitle: 'ताज़ा सरकारी अपडेट',
    sectionSubtitle: 'सरकार भर में क्या हो रहा है',
    liveBadge: 'सत्यापित अपडेट',
    liveStatus: 'लाइव / आधिकारिक',
    featuredBadge: 'मुख्य विज्ञप्ति',
    streamBadge: 'हालिया बुलेटिन',
    deptLabel: 'विभाग',
    pubLabel: 'प्रकाशित',
    btnLabel: 'आधिकारिक स्रोत देखें',
    verifiedNotice: 'सत्यापित सरकारी विज्ञप्ति',
    loading: 'सरकारी विज्ञप्तियां लोड हो रही हैं...',
    error: 'लाइव अपडेट लोड करने में असमर्थ। सत्यापित रजिस्ट्री दिखाई जा रही है।',
    empty: 'इस समय कोई सरकारी अपडेट उपलब्ध नहीं है।',
    today: 'आज',
    yesterday: 'कल',
    exampleNote: 'आधिकारिक सरकारी विज्ञप्ति और अपडेट',
  },
  gu: {
    sectionTag: 'માહિતી પ્રવાહ',
    sectionTitle: 'તાજેતરના સરકારી અપડેટ',
    sectionSubtitle: 'સરકારભરમાં શું થઈ રહ્યું છે',
    liveBadge: 'ચકાસાયેલ અપડેટ્સ',
    liveStatus: 'લાઈવ / સત્તાવાર',
    featuredBadge: 'મુખ્ય જાહેરાત',
    streamBadge: 'તાજેતરના બુલેટિન',
    deptLabel: 'વિભાગ',
    pubLabel: 'પ્રકાશિત',
    btnLabel: 'સત્તાવાર સ્ત્રોત જુઓ',
    verifiedNotice: 'સત્તાવાર સરકારી જાહેરાત',
    loading: 'સરકારી જાહેરાતો લોડ થઈ રહી છે...',
    error: 'લાઇવ અપડેટ લોડ કરવામાં અસમર્થ. ચકાસાયેલ રજિસ્ટ્રી દર્શાવવામાં આવી રહી છે.',
    empty: 'આ સમયે કોઈ સરકારી અપડેટ ઉપલબ્ધ નથી.',
    today: 'આજે',
    yesterday: 'ગઈકાલે',
    exampleNote: 'સત્તાવાર સરકારી જાહેરાતો અને અપડેટ્સ',
  },
};

function formatUpdateDate(dateStr: string, text: typeof LOCAL_TEXT['en'], language: 'en' | 'hi' | 'gu'): { relative: string; formatted: string } {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    let relative = text.today;
    if (diffDays === 1) relative = text.yesterday;
    else if (diffDays > 1) {
      relative = language === 'hi' ? `${diffDays} दिन पहले` : language === 'gu' ? `${diffDays} દિવસ પહેલાં` : `${diffDays}d ago`;
    }

    const locale = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
    const formatted = d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    return { relative, formatted };
  } catch {
    return { relative: text.today, formatted: dateStr };
  }
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

  // Loading skeleton state
  if (loading) {
    return (
      <div className="w-full">
        {/* Header Skeleton */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border)' }}>
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-white/5 animate-pulse" />
            <div className="h-7 w-64 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-48 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="h-8 w-36 rounded-full bg-white/5 animate-pulse" />
        </div>

        {/* Dashboard Skeleton Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Featured Skeleton */}
          <div className="rounded-2xl border p-6 lg:col-span-7" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 rounded-full bg-white/5 animate-pulse" />
                <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="h-7 w-5/6 rounded bg-white/5 animate-pulse" />
              <div className="h-7 w-4/6 rounded bg-white/5 animate-pulse" />
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-11/12 rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="h-10 w-44 rounded-xl bg-white/5 animate-pulse pt-4" />
            </div>
          </div>

          {/* List Skeleton */}
          <div className="space-y-3 rounded-2xl border p-6 lg:col-span-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-3 border-b pb-3.5 last:border-0" style={{ borderColor: 'var(--border)' }}>
                <div className="h-6 w-6 rounded-md bg-white/5 animate-pulse shrink-0" />
                <div className="w-full space-y-2">
                  <div className="h-3 w-28 rounded bg-white/5 animate-pulse" />
                  <div className="h-4 w-4/5 rounded bg-white/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', background: 'var(--surface)' }}>
        <p className="text-sm font-medium text-red-400">{error}</p>
      </div>
    );
  }

  // Empty state
  if (updates.length === 0) {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <p className="text-sm font-medium text-[var(--text-muted)]">{text.empty}</p>
      </div>
    );
  }

  const featured = updates[0];
  const sideUpdates = updates.slice(1, 5);

  const featuredTitle = featured?.title[language] || featured?.title.en;
  const featuredSummary = featured?.summary[language] || featured?.summary.en;
  const featuredDept = featured?.department[language] || featured?.department.en;
  const featuredDate = featured ? formatUpdateDate(featured.date, text, language) : { relative: '', formatted: '' };

  return (
    <div className="w-full">
      {/* ─── SECTION HEADER ─── */}
      <div
        className="mb-8 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              {text.sectionTag}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {text.sectionTitle}
          </h3>
          <p className="mt-1 text-xs font-medium text-[var(--text-secondary)] sm:text-sm">
            {text.sectionSubtitle}
          </p>
        </div>

        {/* Live Feed Status Badge */}
        <div
          className="flex items-center gap-3 self-start rounded-full border px-4 py-1.5 sm:self-auto"
          style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--text-muted)' }} />
          </span>
          <div className="flex flex-col text-left">
            <span className="font-mono text-[10px] font-bold tracking-wider text-white">
              {text.liveBadge}
            </span>
            <span className="text-[9px] font-medium text-[var(--text-muted)]">
              {text.liveStatus}
            </span>
          </div>
        </div>
      </div>

      {/* ─── ASYMMETRIC INTELLIGENCE DASHBOARD ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* ═══ 1. FEATURED DOMINANT DISPATCH (Left / 7 cols) ═══ */}
        {featured && (
          <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:border-[rgba(59,130,246,0.3)] lg:col-span-7 sm:p-8"
            style={{
              background: 'linear-gradient(145deg, rgba(16,19,26,0.95) 0%, rgba(12,14,21,0.95) 100%)',
              borderColor: 'var(--border)',
              boxShadow: '0 8px 32px -4px rgba(0,0,0,0.5)',
            }}
          >
            {/* Subtle top ambient glow */}
            <div
              className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full opacity-15 blur-3xl transition-opacity group-hover:opacity-25"
              style={{ background: 'var(--accent)' }}
            />

            {/* Corner Tech Watermark */}
            <div className="pointer-events-none absolute top-4 right-4 font-mono text-[10px] font-bold tracking-widest text-[var(--text-muted)] opacity-40">
              [DISPATCH.01]
            </div>

            <div>
              {/* Meta Pill: Department + Date */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                  </svg>
                  {featuredDept}
                </span>

                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  {featuredDate.relative} • {featuredDate.formatted}
                </span>
              </div>

              {/* Dominant Headline */}
              <h4 className="text-lg font-bold leading-snug tracking-tight text-white transition-colors duration-200 group-hover:text-[var(--accent-strong)] sm:text-xl md:text-2xl">
                {featuredTitle}
              </h4>

              {/* Short Summary */}
              {featuredSummary && (
                <p className="mt-3.5 text-xs font-normal leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                  {featuredSummary}
                </p>
              )}
            </div>

            {/* Bottom Actions & Verification Seal */}
            <div
              className="mt-8 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: 'var(--border)' }}
            >
              <a
                href={featured.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, #2563eb 100%)',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                }}
              >
                <span>{text.btnLabel}</span>
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>

              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-muted)]">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--accent)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {text.verifiedNotice}
              </span>
            </div>
          </div>
        )}

        {/* ═══ 2. STREAM / OTHER UPDATES (Right / 5 cols) ═══ */}
        <div
          className="flex flex-col justify-between rounded-2xl border p-5 sm:p-6 lg:col-span-5"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.4)',
          }}
        >
          <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
              {text.streamBadge}
            </span>
            <span className="font-mono text-[10px] font-medium text-[var(--text-muted)]">
              {sideUpdates.length + 1} TOTAL
            </span>
          </div>

          <div className="flex flex-col gap-0 divide-y" style={{ borderColor: 'var(--border)' }}>
            {sideUpdates.map((update, index) => {
              const itemNum = String(index + 2).padStart(2, '0');
              const itemTitle = update.title[language] || update.title.en;
              const itemDept = update.department[language] || update.department.en;
              const itemDate = formatUpdateDate(update.date, text, language);

              return (
                <a
                  key={update.id}
                  href={update.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3.5 py-3.5 transition-all duration-200 hover:pl-1"
                >
                  {/* Monospace Number Node */}
                  <span
                    className="font-mono text-xs font-bold transition-colors group-hover:text-[var(--accent)] shrink-0 pt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {itemNum}
                  </span>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold leading-snug text-white/90 transition-colors duration-150 group-hover:text-[var(--accent-strong)] line-clamp-2">
                      {itemTitle}
                    </h5>

                    {/* Metadata line */}
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                      <span className="truncate max-w-[150px] font-medium text-[var(--text-secondary)]" title={itemDept}>
                        {itemDept}
                      </span>
                      <span>•</span>
                      <span>{itemDate.relative}</span>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--accent)] pt-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-4 border-t pt-3 text-right" style={{ borderColor: 'var(--border)' }}>
            <span className="font-mono text-[9px] text-[var(--text-muted)]">
              {text.exampleNote}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
