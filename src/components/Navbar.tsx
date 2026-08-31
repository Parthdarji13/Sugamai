'use client';

import React from 'react';
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
  };
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
}: NavbarProps) {
  return (
    <header className="glass sticky top-0 z-40 w-full border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
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
        </div>

        {/* Center Nav */}
        <nav className="hidden items-center gap-8 text-xs font-semibold md:flex">
          {[
            { key: 'updates', id: 'updates-anchor', label: navText.updates },
            { key: 'services', id: 'chatbot-anchor', label: navText.services },
            { key: 'transparency', id: 'footer-anchor', label: navText.transparency },
            { key: 'history', id: 'footer-anchor', label: navText.history },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => scrollToSection(item.id, item.key)}
              className={`nav-link ${activeNav === item.key ? 'active' : ''}`}
              style={{ color: activeNav === item.key ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <button
            aria-label="Switch Language"
            className="flex h-8 w-8 items-center justify-center rounded-full border transition-all hover:border-[rgba(0,230,118,0.3)] hover:text-[var(--accent)]"
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

          {/* User avatar */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>

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
            onClick={() => scrollToSection('footer-anchor', 'history')}
            className="py-2.5 text-left hover:text-[var(--accent)]"
          >
            {navText.history}
          </button>
        </div>
      )}
    </header>
  );
}
