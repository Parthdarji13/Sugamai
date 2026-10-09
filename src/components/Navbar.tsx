'use client';

import React, { useState } from 'react';
import { Language } from '@/types/chat';

interface NavbarProps {
  title: string;
  language: Language;
  setLanguage: (lang: Language) => void;
  activeNav: string;
  scrollToSection: (id: string, navKey?: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  navText: {
    services: string;
    updates: string;
    transparency: string;
    history: string;
    signIn?: string;
    signOut?: string;
  };
  user?: { id: string; name: string; email: string; language: string } | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onToggleHistory?: () => void;
  onGoHome?: () => void;
}

export default function Navbar({
  title,
  language,
  setLanguage,
  activeNav,
  scrollToSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  navText,
  user,
  onOpenAuthModal,
  onLogout,
  onToggleHistory,
  onGoHome,
}: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      {/* 🇮🇳 Tricolor Top Bar */}
      <div className="tricolor-bar" />

      <header className="glass sticky top-0 z-40 w-full border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo — Ashoka Chakra inspired */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 focus:outline-none"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #E8590C 0%, #C2410C 100%)',
              }}
            >
              {/* Ashoka Chakra SVG */}
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <h1 className="flex items-center text-base font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
              <span
                className="ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wider"
                style={{ background: 'linear-gradient(135deg, #172554, #1E3A5F)' }}
              >
                GOV
              </span>
            </h1>
          </button>

          {/* Center Nav */}
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            {[
              { key: 'ask-ai', id: 'chatbot-anchor', label: 'Ask AI', icon: <svg className="h-4 w-4 mr-1.5" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6 4.8 2.4 7.6-6-4.8-6 4.8 2.4-7.6-6-4.8h7.6L12 2z"/></svg>, bg: 'rounded-full px-3 py-1' },
              { key: 'services', id: 'services-anchor', label: 'Schemes', icon: <svg className="h-4 w-4 mr-1.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11m-8-11v11M8 10v11m8-11v11"/></svg> },
              { key: 'updates', id: 'updates-anchor', label: 'Live Updates', icon: <svg className="h-4 w-4 mr-1.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg> },
              { key: 'helplines', id: 'helplines-anchor', label: 'Helplines', icon: <svg className="h-4 w-4 mr-1.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.id, item.key)}
                className={`nav-link flex items-center transition-colors hover:text-[var(--accent)] ${item.bg || ''} ${
                  activeNav === item.key
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-secondary)]'
                }`}
                style={
                  activeNav === item.key
                    ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                    : undefined
                }
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            {/* History quick icon */}
            <button
              aria-label={navText.history}
              className="btn-press flex h-8 w-8 items-center justify-center rounded-full border transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              onClick={onToggleHistory}
              title={navText.history}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Language selector */}
            <button
              aria-label="Switch Language"
              className="flex h-8 items-center justify-center rounded-full border px-2.5 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] gap-1.5"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onClick={() => {
                const langs: Language[] = ['en', 'hi', 'gu'];
                const idx = langs.indexOf(language);
                setLanguage(langs[(idx + 1) % langs.length]);
              }}
              title={`Language: ${language.toUpperCase()}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="text-xs font-bold uppercase">{language}</span>
              <svg className="h-3 w-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Section */}
            {!user ? (
              <button
                onClick={onOpenAuthModal}
                className="btn-cta btn-press flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
                </svg>
                <span>{navText.signIn || 'Sign In'}</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="btn-press flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  aria-expanded={userMenuOpen}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #E8590C, #C2410C)' }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline text-xs font-medium">
                    {user.name}
                  </span>
                  <svg
                    className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 z-40 w-52 overflow-hidden rounded-xl border p-1 shadow-2xl backdrop-blur-md"
                      style={{
                        background: 'linear-gradient(145deg, #0F1A3C 0%, #0A1128 100%)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,89,12,0.1)',
                      }}
                    >
                      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onToggleHistory?.();
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {navText.history}
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout?.();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
                        </svg>
                        {navText.signOut || 'Sign Out'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-[var(--text-secondary)] md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="flex flex-col gap-1 border-t px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] md:hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => scrollToSection('updates-anchor', 'updates')}
              className="border-b py-2.5 text-left hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border)' }}
            >
              {navText.updates}
            </button>
            <button
              onClick={() => scrollToSection('chatbot-anchor', 'services')}
              className="border-b py-2.5 text-left hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border)' }}
            >
              {navText.services}
            </button>
            <button
              onClick={() => scrollToSection('footer-anchor', 'transparency')}
              className="border-b py-2.5 text-left hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border)' }}
            >
              {navText.transparency}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (user) {
                  onToggleHistory?.();
                } else {
                  onOpenAuthModal?.();
                }
              }}
              className="border-b py-2.5 text-left hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border)' }}
            >
              {navText.history}
            </button>

            {/* Mobile Auth Button */}
            <div className="pt-2">
              {!user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors"
                  style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
                  </svg>
                  {navText.signIn || 'Sign In'}
                </button>
              ) : (
                <div className="flex flex-col gap-1 rounded-lg border p-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <span className="text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500 hover:underline"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
                    </svg>
                    {navText.signOut || 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
