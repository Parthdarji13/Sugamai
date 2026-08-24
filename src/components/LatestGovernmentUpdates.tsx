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
    empty: 'No updates available at the moment.'
  },
  hi: {
    deptLabel: 'विभाग:',
    pubLabel: 'प्रकाशित:',
    btnLabel: 'सत्यापित स्रोत देखें →',
    loading: 'घोषणाएं लोड हो रही हैं...',
    error: 'अपडेट लोड करने में विफल। कृपया कनेक्शन जांचें।',
    empty: 'इस समय कोई अपडेट उपलब्ध नहीं है।'
  },
  gu: {
    deptLabel: 'વિભાગ:',
    pubLabel: 'પ્રકાશિત:',
    btnLabel: 'સત્તાવાર સ્ત્રોત જુઓ →',
    loading: 'જાહેરાતો લોડ થઈ રહી છે...',
    error: 'અપડેટ લોડ કરવામાં નિષ્ફળ. કૃપા કરીને કનેક્શન તપાસો.',
    empty: 'આ સમયે કોઈ અપડેટ ઉપલબ્ધ નથી.'
  }
};

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

  // Render Shimmer Skeletons during Loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        {[1, 2, 3].map(n => (
          <div key={n} className="rounded-2xl border border-slate-900 bg-[#0c1220] p-5.5 flex flex-col gap-3 shadow-md">
            <div className="h-3 w-1/3 bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4.5 w-3/4 bg-slate-800 rounded animate-pulse mt-2"></div>
            <div className="h-3.5 w-5/6 bg-slate-800 rounded animate-pulse"></div>
            <div className="h-3.5 w-1/2 bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-slate-800 rounded animate-pulse mt-4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Render Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-xs tracking-wide text-red-400 font-semibold max-w-lg mx-auto">
        <svg className="mx-auto h-7 w-7 text-red-500/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  // Render Empty state
  if (updates.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-900 bg-[#0c1220] p-6 text-center text-xs tracking-wide text-slate-500 max-w-lg mx-auto">
        <span>{text.empty}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
      {updates.map(update => {
        const title = update.title[language] || update.title.en;
        const summary = update.summary[language] || update.summary.en;
        const dept = update.department[language] || update.department.en;

        return (
          <div
            key={update.id}
            className="flex flex-col rounded-2xl border border-slate-900 bg-[#0c1220] p-5.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)]"
          >
            {/* Category Badge & Date */}
            <div className="flex items-center justify-between mb-3 text-[9px] font-black tracking-wider uppercase text-slate-500">
              <span className={`px-2 py-0.5 rounded ${
                update.category === 'pm_kisan' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                update.category === 'ayushman_bharat' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {update.category.replace('_', ' ')}
              </span>
              <span>
                {update.date}
              </span>
            </div>

            {/* Title */}
            <h4 className="font-extrabold text-white tracking-wide text-xs sm:text-sm leading-snug">
              {title}
            </h4>

            {/* Summary */}
            <p className="mt-2 text-xs leading-relaxed text-slate-400 font-semibold flex-grow">
              {summary}
            </p>

            {/* Department and Source Link Footer */}
            <div className="mt-5 pt-3.5 border-t border-slate-900/60 flex flex-col gap-3 justify-between">
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase">
                  {text.deptLabel}
                </span>
                <span className="text-[10px] text-slate-400 font-bold truncate leading-tight mt-0.5">
                  {dept}
                </span>
              </div>

              <a
                href={update.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-black text-blue-400 hover:text-cyan-400 hover:underline transition-colors select-none active:scale-[0.98] w-fit cursor-pointer"
              >
                <span>{text.btnLabel}</span>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
