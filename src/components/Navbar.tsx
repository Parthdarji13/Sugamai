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
    <header className="glass sticky top-0 z-40 w-full border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 focus:outline-none"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h1 className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--accent)' }}>
            {title}
          </h1>
        </button>

        {/* Center Nav */}
        <nav className="hidden items-center gap-8 text-xs font-semibold md:flex">
          {[
            { key: 'updates', id: 'updates-anchor', label: navText.updates },
            { key: 'services', id: 'chatbot-anchor', label: navText.services },
            { key: 'transparency', id: 'footer-anchor', label: navText.transparency },
            { key: 'history', id: 'history', label: navText.history },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === 'history') {
                  if (user) {
                    onToggleHistory?.();
                  } else {
                    onOpenAuthModal?.();
                  }
                } else {
                  scrollToSection(item.id, item.key);
                }
              }}
              className={`nav-link ${activeNav === item.key ? 'active' : ''}`}
              style={{ color: activeNav === item.key ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          {/* History quick icon for authenticated user */}
          {user && (
            <button
              aria-label={navText.history}
              className="btn-press flex h-8 w-8 items-center justify-center rounded-full border transition-all hover:border-[rgba(59,130,246,0.4)] hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              onClick={onToggleHistory}
              title={navText.history}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Language selector */}
          <button
            aria-label="Switch Language"
            className="flex h-8 w-8 items-center justify-center rounded-full border transition-all hover:border-[rgba(59,130,246,0.4)] hover:text-[var(--accent)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onClick={() => {
              const langs: Language[] = ['en', 'hi', 'gu'];
              const idx = langs.indexOf(language);
              setLanguage(langs[(idx + 1) % langs.length]);
            }}
            title={`Language: ${language.toUpperCase()}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </button>

          {/* User Section (Guest Sign In vs Authenticated Avatar Dropdown) */}
          {!user ? (
            <button
              onClick={onOpenAuthModal}
              className="btn-press flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[rgba(59,130,246,0.4)] hover:text-white"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <svg className="h-3.5 w-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
              </svg>
              <span>{navText.signIn || 'Sign In'}</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="btn-press flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[rgba(59,130,246,0.4)]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                aria-expanded={userMenuOpen}
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
                    className="absolute right-0 mt-2 z-40 w-48 overflow-hidden rounded-xl border p-1 shadow-2xl backdrop-blur-md"
                    style={{
                      background: 'linear-gradient(145deg, rgba(16,19,26,0.98) 0%, rgba(12,14,21,0.99) 100%)',
                      borderColor: 'var(--border-strong)',
                      boxShadow: '0 12px 30px -5px rgba(0,0,0,0.8)',
                    }}
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onToggleHistory?.();
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <svg className="h-3.5 w-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
                </svg>
                {navText.signIn || 'Sign In'}
              </button>
            ) : (
              <div className="flex flex-col gap-1 rounded-lg border p-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <span className="text-[11px] font-bold text-white truncate">{user.name}</span>
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
