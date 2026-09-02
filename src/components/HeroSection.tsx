'use client';

import React from 'react';
import LatestGovernmentUpdates from '@/components/LatestGovernmentUpdates';
import SchemesDirectory from '@/components/SchemesDirectory';
import HelplineDirectory from '@/components/HelplineDirectory';
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

      {/* ═══ POPULAR CITIZEN SCHEMES DIRECTORY ═══ */}
      <section id="schemes-anchor" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SchemesDirectory language={language} onSelectScheme={(query) => handleSend(query)} />
      </section>

      {/* Section divider */}
      <div className="section-divider mx-auto max-w-6xl" />

      {/* ═══ LATEST GOVERNMENT UPDATES ═══ */}
      <section id="updates-anchor" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <LatestGovernmentUpdates language={language} />
      </section>

      {/* Section divider */}
      <div className="section-divider mx-auto max-w-6xl" />

      {/* ═══ VERIFIED CITIZEN HELPLINES ═══ */}
      <section id="helplines-anchor" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <HelplineDirectory language={language} />
      </section>
    </div>
  );
}
