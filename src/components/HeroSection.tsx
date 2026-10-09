'use client';

import React from 'react';
import LatestGovernmentUpdates from '@/components/LatestGovernmentUpdates';
import { Language, UIText } from '@/types/chat';

interface HeroSectionProps {
  text: UIText;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  handleSend: (textToSend: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  language: Language;
  featureStats: Array<{ icon: React.ReactNode; key: 'stat1' | 'stat2' | 'stat3' }>;
}

export default function HeroSection({
  text,
  input,
  setInput,
  isLoading,
  handleSend,
  inputRef,
  language,
  featureStats,
}: HeroSectionProps) {
  return (
    <div className="flex flex-col">
      {/* ═══ HERO SECTION ═══ */}
      <section id="home-anchor" className="relative mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6">
        {/* Grid background */}
        <div className="grid-bg" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-left flex flex-col items-start">
            {/* Badge — Saffron accent */}
            <div className="anim-hero-title">
              <span
                className="feature-pill float-badge mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'var(--accent-soft)', borderColor: 'rgba(232,89,12,0.25)', color: 'var(--accent)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: 'var(--emerald)' }} />
                {text.heroBadge}
              </span>
            </div>

            {/* Hero headline — Navy + Saffron gradient */}
            <h2 className="anim-hero-title-delayed mb-2 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl" style={{ color: 'var(--navy)' }}>
              {text.heroLine1}
            </h2>
            <h2 className="anim-hero-title-delayed mb-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl heading-saffron">
              {text.heroLine2}
            </h2>

            {/* Subtitle */}
            <p className="anim-hero-sub mb-10 max-w-xl text-sm font-medium leading-relaxed text-[var(--text-secondary)] sm:text-base">
              {text.subtitle}
            </p>

        {/* Search bar with saffron animated border */}
        <div className="anim-hero-search w-full max-w-xl">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="animated-border search-focus-glow relative flex w-full items-center rounded-full p-1.5 transition-all shadow-lg bg-white"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center pl-4">
              <svg className="h-5 w-5" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    handleSend(input);
                  }
                }
              }}
              placeholder={text.placeholder}
              disabled={isLoading}
              rows={1}
              className="w-full resize-none overflow-y-auto bg-transparent py-3.5 pl-3 pr-14 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none disabled:opacity-50"
              style={{ maxHeight: '120px' }}
            />
            <button
              type="submit"
              aria-label="Send query"
              disabled={!input.trim() || isLoading}
              className="btn-cta btn-press absolute right-2 flex h-10 w-10 items-center justify-center rounded-full transition-all disabled:opacity-30"
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>

        {/* Feature stats — with tricolor accents */}
        <div className="anim-hero-features mt-8 flex flex-wrap items-center justify-start gap-4">
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border shadow-sm" style={{ borderColor: 'rgba(232,89,12,0.12)' }}>
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold" style={{ color: 'var(--navy)' }}>{text.stat1}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Trusted & reliable</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border shadow-sm" style={{ borderColor: 'rgba(23,37,84,0.08)' }}>
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--navy-soft)', color: 'var(--navy)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold" style={{ color: 'var(--navy)' }}>{text.stat2}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Multilingual</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border shadow-sm" style={{ borderColor: 'rgba(5,150,105,0.12)' }}>
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--emerald-soft)', color: 'var(--emerald)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold" style={{ color: 'var(--navy)' }}>{text.stat3}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Verified data</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column: Illustration */}
      <div className="hidden lg:flex flex-col items-center justify-center relative w-full h-[450px]">
        <div className="absolute inset-0 rounded-[40px] opacity-60 transform rotate-3" style={{ background: 'linear-gradient(135deg, rgba(232,89,12,0.08), rgba(5,150,105,0.06))' }}></div>
        <div className="absolute inset-0 bg-white rounded-[40px] shadow-xl flex flex-col items-center justify-center border overflow-hidden" style={{ borderColor: 'rgba(23,37,84,0.06)' }}>
           <div className="w-full h-full relative flex items-center justify-center">
             <img src="/hero_illustration.jpg" alt="AI Mascot & Government Building Illustration" className="w-full h-full object-cover object-center" />
           </div>
        </div>
      </div>
    </div>
  </section>

      {/* ═══ EXPLORE SERVICES ═══ */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>Explore Services</h3>
          <button
            className="text-sm font-semibold rounded-full px-4 py-1.5 border transition-colors"
            style={{ color: 'var(--accent)', borderColor: 'rgba(232,89,12,0.2)', background: 'var(--accent-soft)' }}
          >
            View All &gt;
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 — Saffron */}
          <div className="flex flex-col p-5 bg-white border rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(232,89,12,0.08)] transition-all hover:-translate-y-0.5" style={{ borderColor: 'rgba(23,37,84,0.06)' }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-soft)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-[15px] leading-tight mb-1" style={{ color: 'var(--navy)' }}>Government Schemes</h4>
                <p className="text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>Find government schemes, benefits and eligibility information.</p>
              </div>
            </div>
            <div className="mt-auto flex justify-end">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(232,89,12,0.2)', color: 'var(--accent)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>
          
          {/* Card 2 — Emerald */}
          <div className="flex flex-col p-5 bg-white border rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(5,150,105,0.08)] transition-all hover:-translate-y-0.5" style={{ borderColor: 'rgba(23,37,84,0.06)' }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--emerald-soft)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--emerald)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-[15px] leading-tight mb-1" style={{ color: 'var(--navy)' }}>Documents</h4>
                <p className="text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>Apply & download official documents.</p>
              </div>
            </div>
            <div className="mt-auto flex justify-end">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(5,150,105,0.2)', color: 'var(--emerald)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>

          {/* Card 3 — Amber */}
          <div className="flex flex-col p-5 bg-white border rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(217,119,6,0.08)] transition-all hover:-translate-y-0.5" style={{ borderColor: 'rgba(23,37,84,0.06)' }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(217,119,6,0.08)' }}>
                <svg className="w-6 h-6" style={{ color: '#D97706' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-[15px] leading-tight mb-1" style={{ color: 'var(--navy)' }}>Helplines</h4>
                <p className="text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>Get help from official helplines.</p>
              </div>
            </div>
            <div className="mt-auto flex justify-end">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(217,119,6,0.2)', color: '#D97706' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>

          {/* Card 4 — Navy */}
          <div className="flex flex-col p-5 bg-white border rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(23,37,84,0.08)] transition-all hover:-translate-y-0.5" style={{ borderColor: 'rgba(23,37,84,0.06)' }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--navy-soft)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--navy)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-[15px] leading-tight mb-1" style={{ color: 'var(--navy)' }}>Passport Services</h4>
                <p className="text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>Apply, track & check passport status.</p>
              </div>
            </div>
            <div className="mt-auto flex justify-end">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(23,37,84,0.12)', color: 'var(--navy)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider mx-auto max-w-6xl" />

      {/* ═══ LATEST GOVERNMENT UPDATES ═══ */}
      <section id="updates-anchor" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <LatestGovernmentUpdates language={language} />
      </section>

      {/* Section divider */}
      <div className="section-divider mx-auto max-w-6xl" />

      {/* ═══ CHAT ENTRY ("Ask SugamGov" AI Entry Point) ═══ */}
      <section id="chatbot-anchor" className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="anim-rise mb-8">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--emerald)' }} />
              {text.askEyebrow}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--navy)' }}>
            {text.askTitle}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs font-medium text-[var(--text-secondary)] sm:text-sm">
            {text.askSubtitle}
          </p>
        </div>

        <div
          className="group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300 sm:p-8"
          style={{
            background: 'linear-gradient(145deg, #0F1A3C 0%, #0A1128 100%)',
            borderColor: 'rgba(232,89,12,0.15)',
            boxShadow: '0 12px 40px -8px rgba(0,0,0,0.3), 0 0 0 1px rgba(232,89,12,0.05)',
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 right-1/4 h-48 w-48 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20"
            style={{ background: 'var(--accent)' }}
          />

          <div className="mb-6 flex items-start gap-3.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ background: 'rgba(232,89,12,0.12)', borderColor: 'rgba(232,89,12,0.2)', color: '#E8590C' }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight sm:text-lg">
                {text.askBoxHeadline}
              </h4>
              <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">
                {text.askBoxDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {text.suggestions.map((suggestion: string, idx: number) => {
              const tag = text.suggestionTags?.[idx] || '';
              const accentColors = ['#E8590C', '#059669', '#172554'];
              const icons = [
                <svg key="0" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>,
                <svg key="1" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>,
                <svg key="2" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>,
              ];

              return (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  className="group flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${accentColors[idx % 3]}66`;
                    (e.currentTarget as HTMLElement).style.background = `${accentColors[idx % 3]}0D`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md"
                        style={{ background: `${accentColors[idx % 3]}1A`, color: accentColors[idx % 3] }}
                      >
                        {icons[idx % icons.length]}
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500">
                        {tag}
                      </span>
                    </div>
                    <svg className="h-3.5 w-3.5 text-gray-600 transition-all duration-200 group-hover:translate-x-1" style={{ color: accentColors[idx % 3] }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>

                  <span className="mt-3 text-xs font-semibold leading-snug text-white/90 transition-colors group-hover:text-white">
                    {suggestion}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] text-[var(--text-muted)]"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
            }}
          >
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>ⓘ</span>
            <span>{text.disclaimer}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
