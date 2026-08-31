'use client';

import React from 'react';
import LatestGovernmentUpdates from '@/components/LatestGovernmentUpdates';
import { Language } from '@/types/chat';

interface HeroSectionProps {
  text: any;
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
      <section id="home-anchor" className="relative mx-auto max-w-4xl px-4 pt-20 pb-14 text-center sm:px-6">
        {/* Grid background */}
        <div className="grid-bg" />

        {/* Floating particles */}
        <div className="particle particle-1" style={{ top: '15%', left: '10%' }} />
        <div className="particle particle-2" style={{ top: '25%', right: '15%' }} />
        <div className="particle particle-3" style={{ bottom: '30%', left: '20%' }} />
        <div className="particle particle-4" style={{ top: '40%', right: '8%' }} />
        <div className="particle particle-5" style={{ bottom: '20%', right: '25%' }} />
        <div className="particle particle-6" style={{ top: '10%', left: '45%' }} />

        {/* Badge */}
        <div className="anim-hero-title">
          <span
            className="feature-pill float-badge mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'var(--accent-soft)', borderColor: 'rgba(0,230,118,0.2)', color: 'var(--accent)' }}
          >
            <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            {text.heroBadge}
          </span>
        </div>

        {/* Hero headline */}
        <h2 className="anim-hero-title-delayed mb-2 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          {text.heroLine1}
        </h2>
        <h2 className="anim-hero-title-delayed mb-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="gradient-text">{text.heroLine2}</span>
        </h2>

        {/* Subtitle */}
        <p className="anim-hero-sub mx-auto mb-10 max-w-xl text-sm font-medium leading-relaxed text-[var(--text-secondary)] sm:text-base">
          {text.subtitle}
        </p>

        {/* Search bar with animated border */}
        <div className="anim-hero-search">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="animated-border search-focus-glow relative mx-auto flex max-w-2xl items-center rounded-full p-1.5 transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center pl-4">
              <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="btn-press absolute right-2 flex h-10 w-10 items-center justify-center rounded-full transition-all disabled:opacity-30"
              style={{ background: 'var(--accent)' }}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>

        {/* Feature stats */}
        <div className="anim-hero-features mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {featureStats.map((stat, idx) => (
            <div
              key={idx}
              className="stat-value stagger flex items-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]"
              style={{ ['--d' as string]: `${700 + idx * 100}ms` }}
            >
              <span style={{ color: 'var(--accent)' }}>{stat.icon}</span>
              <span>{text[stat.key]}</span>
            </div>
          ))}
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
              <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              {text.askEyebrow}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {text.askTitle}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs font-medium text-[var(--text-secondary)] sm:text-sm">
            {text.askSubtitle}
          </p>
        </div>

        <div
          className="group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300 sm:p-8"
          style={{
            background: 'linear-gradient(145deg, rgba(16,19,26,0.95) 0%, rgba(12,14,21,0.98) 100%)',
            borderColor: 'var(--border)',
            boxShadow: '0 12px 40px -8px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 right-1/4 h-48 w-48 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20"
            style={{ background: 'var(--accent)' }}
          />

          <div className="mb-6 flex items-start gap-3.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight sm:text-lg">
                {text.askBoxHeadline}
              </h4>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)] sm:text-sm">
                {text.askBoxDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {text.suggestions.map((suggestion: string, idx: number) => {
              const tag = text.suggestionTags?.[idx] || '';
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
                  className="group flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 hover:border-[rgba(59,130,246,0.4)] hover:bg-[rgba(59,130,246,0.05)] active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {icons[idx % icons.length]}
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {tag}
                      </span>
                    </div>
                    <svg className="h-3.5 w-3.5 text-[var(--text-muted)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <span className="font-semibold text-[var(--accent)]">ⓘ</span>
            <span>{text.disclaimer}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
