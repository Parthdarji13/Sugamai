'use client';

import React, { useState, useEffect } from 'react';
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
    askAI?: string;
    schemes?: string;
    updates: string;
    helplines?: string;
    history: string;
    signIn?: string;
    signOut?: string;
    services?: string;
    transparency?: string;
  };
  user?: { id: string; name: string; email: string; language: string } | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onToggleHistory?: () => void;
  onGoHome?: () => void;
}

const LANGUAGES: { code: Language; label: string; native: string; short: string }[] = [
  { code: 'en', label: 'English', native: 'English', short: 'EN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', short: 'HI' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', short: 'GU' },
];

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
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Exactly 4 high-utility citizen navigation items (NO decorative or empty links)
  const navItems = [
    {
      key: 'chat',
      id: 'chatbot-anchor',
      label: navText.askAI || 'Ask AI',
      icon: (
        <svg className="h-3.5 w-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
    },
    {
      key: 'schemes',
      id: 'schemes-anchor',
      label: navText.schemes || 'Schemes',
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      ),
    },
    {
      key: 'updates',
      id: 'updates-anchor',
      label: navText.updates || 'Live Updates',
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.01 5.395m-1.01-5.395c-.244.38-.507.747-.788 1.1m1.798 4.295a24.12 24.12 0 010 4.96m0-4.96c-.347.07-.704.125-1.07.165m1.07 4.795a23.91 23.91 0 01-1.01 5.395m1.01-5.395c-.244-.38-.507-.747-.788-1.1m-1.01 6.495c.28-.353.544-.72.788-1.1" />
        </svg>
      ),
    },
    {
      key: 'helplines',
      id: 'helplines-anchor',
      label: navText.helplines || 'Helplines',
      icon: (
        <svg className="h-3.5 w-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      ),
    },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-all duration-250 ${
        scrolled ? 'glass-scrolled' : 'glass'
      }`}
      style={{ borderColor: scrolled ? 'rgba(59, 130, 246, 0.25)' : 'var(--border)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* ═══ 1. BRAND LOGO ═══ */}
        <button
          type="button"
          onClick={onGoHome}
          className="group flex items-center gap-2.5 text-left transition-opacity hover:opacity-95 focus:outline-none"
          title="Return to Home"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105"
            style={{
              background: 'var(--accent-soft)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              color: 'var(--accent)',
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--accent)' }}>
                {title}
              </span>
              <span
                className="hidden rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider sm:inline-block"
                style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-strong)' }}
              >
                GOV
              </span>
            </div>
          </div>
        </button>

        {/* ═══ 2. CENTER NAVIGATION (4 High-Utility Citizen Actions) ═══ */}
        <nav
          className="hidden items-center gap-1 rounded-full border px-2 py-1 backdrop-blur-md md:flex"
          style={{ borderColor: 'var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}
        >
          {navItems.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.id, item.key)}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                }`}
                style={
                  isActive
                    ? {
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                      }
                    : undefined
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ═══ 3. RIGHT ACTION HUB ═══ */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* A. SINGLE DEDICATED HISTORY BUTTON (Visible only once, high visibility) */}
          {user && (
            <button
              type="button"
              onClick={onToggleHistory}
              aria-label={navText.history}
              title={navText.history}
              className="btn-press group relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-white"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            >
              <svg
                className="h-3.5 w-3.5 text-[var(--accent)] transition-transform duration-200 group-hover:rotate-[-15deg]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{navText.history}</span>
            </button>
          )}

          {/* B. LANGUAGE SELECTOR (Interactive Dropdown with Active Indicator) */}
          <div className="relative">
            <button
              type="button"
              aria-label="Select Language"
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setUserMenuOpen(false);
              }}
              className="btn-press flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 hover:border-[rgba(59,130,246,0.4)] hover:text-white"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
              title={`Active Language: ${currentLang.label}`}
            >
              <svg className="h-3.5 w-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
              <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-primary)]">
                {currentLang.short}
              </span>
              <svg
                className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${
                  langMenuOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Language Dropdown Menu */}
            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                <div
                  className="absolute right-0 mt-2 z-40 w-44 overflow-hidden rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl"
                  style={{
                    background: 'var(--surface-popup)',
                    borderColor: 'var(--border-strong)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Language / भाषा / ભાષા
                  </div>
                  {LANGUAGES.map((langItem) => {
                    const isSelected = language === langItem.code;
                    return (
                      <button
                        key={langItem.code}
                        onClick={() => {
                          setLanguage(langItem.code);
                          setLangMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'font-bold text-[var(--accent)]'
                            : 'font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                        }`}
                        style={isSelected ? { background: 'var(--accent-soft)' } : undefined}
                      >
                        <div className="flex flex-col">
                          <span>{langItem.native}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{langItem.label}</span>
                        </div>
                        {isSelected && (
                          <svg className="h-4 w-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* C. USER AUTHENTICATION / PROFILE SECTION */}
          {!user ? (
            <button
              onClick={onOpenAuthModal}
              className="btn-press flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-white"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <svg className="h-3.5 w-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
              </svg>
              <span>{navText.signIn || 'Sign In'}</span>
            </button>
          ) : (
            <div className="relative">
              {/* Profile Avatar Button */}
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setLangMenuOpen(false);
                }}
                className="btn-press flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[rgba(59,130,246,0.4)]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                aria-expanded={userMenuOpen}
                title={user.name}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline text-xs font-medium">
                  {user.name}
                </span>
                <svg
                  className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Profile Menu (Focused only on Citizen Info & Logout - NO duplicate History) */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div
                    className="absolute right-0 mt-2 z-40 w-52 overflow-hidden rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl"
                    style={{
                      background: 'var(--surface-popup)',
                      borderColor: 'var(--border-strong)',
                      boxShadow: 'var(--card-shadow)',
                    }}
                  >
                    {/* User Identity Header */}
                    <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                        <span
                          className="rounded px-1.5 py-0.2 font-mono text-[9px] font-bold text-[var(--accent)]"
                          style={{ background: 'var(--accent-soft)' }}
                        >
                          Citizen
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
                    </div>

                    {/* Actions (Sign Out Only) */}
                    <div className="p-1 pt-1.5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout?.();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3"
                          />
                        </svg>
                        <span>{navText.signOut || 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* D. MOBILE MENU TOGGLE BUTTON */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] md:hidden"
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

      {/* ═══ 4. MOBILE DRAWER MENU ═══ */}
      {mobileMenuOpen && (
        <div
          className="flex flex-col gap-1 border-t px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] md:hidden backdrop-blur-xl"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-popup)' }}
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection(item.id, item.key);
              }}
              className="flex items-center gap-2.5 border-b py-2.5 text-left transition-colors hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          {/* Mobile Auth Section */}
          <div className="pt-2">
            {!user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal?.();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
                </svg>
                {navText.signIn || 'Sign In'}
              </button>
            ) : (
              <div
                className="flex flex-col gap-1 rounded-xl border p-3"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name}</span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--accent)]"
                    style={{ background: 'var(--accent-soft)' }}
                  >
                    Citizen
                  </span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout?.();
                  }}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-400 hover:underline"
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
  );
}
