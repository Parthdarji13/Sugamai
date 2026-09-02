'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language } from '@/types/chat';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; name: string; email: string; language: string }) => void;
  language: Language;
}

const MODAL_TEXT = {
  en: {
    signInTitle: 'Welcome back',
    signInSubtitle: 'Sign in to access your saved conversations & preferences.',
    signUpTitle: 'Create an account',
    signUpSubtitle: 'Register to automatically save your queries & chat history.',
    nameLabel: 'Full Name',
    namePlaceholder: 'e.g. Ramesh Patel',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    signInButton: 'Sign In',
    signUpButton: 'Create Account',
    submitting: 'Please wait...',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    signUpLink: 'Sign Up',
    signInLink: 'Sign In',
    nameRequired: 'Please enter your name',
    emailRequired: 'Please enter a valid email address',
    passwordLength: 'Password must be at least 8 characters long',
    generalError: 'Authentication failed. Please try again.',
  },
  hi: {
    signInTitle: 'पुनः स्वागत है',
    signInSubtitle: 'अपनी सहेजी गई बातचीत और प्राथमिकताओं के लिए साइन इन करें।',
    signUpTitle: 'नया खाता बनाएं',
    signUpSubtitle: 'अपने प्रश्न और चैट इतिहास को सहेजने के लिए पंजीकरण करें।',
    nameLabel: 'पूरा नाम',
    namePlaceholder: 'जैसे रमेश पटेल',
    emailLabel: 'ईमेल पता',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'कम से कम 8 वर्ण',
    signInButton: 'साइन इन करें',
    signUpButton: 'खाता बनाएं',
    submitting: 'कृपया प्रतीक्षा करें...',
    noAccount: 'क्या आपके पास खाता नहीं है?',
    hasAccount: 'पहले से खाता है?',
    signUpLink: 'साइन अप करें',
    signInLink: 'साइन इन करें',
    nameRequired: 'कृपया अपना नाम दर्ज करें',
    emailRequired: 'कृपया एक मान्य ईमेल पता दर्ज करें',
    passwordLength: 'पासवर्ड कम से कम 8 वर्णों का होना चाहिए',
    generalError: 'प्रमाणीकरण विफल रहा। कृपया पुनः प्रयास करें।',
  },
  gu: {
    signInTitle: 'સ્વાગત છે',
    signInSubtitle: 'તમારી સાચવેલી વાતચીત અને પસંદગીઓ માટે સાઇન ઇન કરો.',
    signUpTitle: 'નવું ખાતું બનાવો',
    signUpSubtitle: 'તમારા પ્રશ્નો અને ચેટ ઇતિહાસ સાચવવા માટે નોંધણી કરો.',
    nameLabel: 'પૂરું નામ',
    namePlaceholder: 'દા.ત. રમેશ પટેલ',
    emailLabel: 'ઈમેલ એડ્રેસ',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'પાસવર્ડ',
    passwordPlaceholder: 'ઓછામાં ઓછા 8 અક્ષરો',
    signInButton: 'સાઇન ઇન કરો',
    signUpButton: 'ખાતું બનાવો',
    submitting: 'કૃપા કરીને રાહ જુઓ...',
    noAccount: 'ખાતું નથી?',
    hasAccount: 'પહેલેથી ખાતું છે?',
    signUpLink: 'સાઇન અપ કરો',
    signInLink: 'સાઇન ઇન કરો',
    nameRequired: 'કૃપા કરીને તમારું નામ દાખલ કરો',
    emailRequired: 'કૃપા કરીને માન્ય ઈમેલ સરનામું દાખલ કરો',
    passwordLength: 'પાસવર્ડ ઓછામાં ઓછો 8 અક્ષરોનો હોવો જોઈએ',
    generalError: 'પ્રમાણીકરણ નિષ્ફળ ગયું. ફરી પ્રયાસ કરો.',
  },
};

export default function AuthModal({ isOpen, onClose, onAuthSuccess, language }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const t = MODAL_TEXT[language] || MODAL_TEXT.en;

  // Focus input on open or mode switch
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (mode === 'signup') {
          nameInputRef.current?.focus();
        } else {
          emailInputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (mode === 'signup' && !name.trim()) {
      setError(t.nameRequired);
      nameInputRef.current?.focus();
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError(t.emailRequired);
      emailInputRef.current?.focus();
      return;
    }

    if (!password || password.length < 8) {
      setError(t.passwordLength);
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload = mode === 'signup'
        ? { name: name.trim(), email: trimmedEmail, password }
        : { email: trimmedEmail, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || t.generalError);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        onAuthSuccess(data.user);
        setName('');
        setEmail('');
        setPassword('');
      } else {
        setError(t.generalError);
      }
    } catch (err) {
      console.error('Auth request failed:', err);
      setError(t.generalError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-2xl transition-all sm:p-8"
        style={{
          background: 'linear-gradient(145deg, rgba(16,19,26,0.98) 0%, rgba(12,14,21,0.99) 100%)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8), 0 0 30px -5px rgba(59,130,246,0.15)',
        }}
      >
        {/* Glow accent */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full opacity-20 blur-2xl"
          style={{ background: 'var(--accent)' }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-1 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
              SugamGov AI
            </span>
          </div>

          <h3 id="auth-modal-title" className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            {mode === 'login' ? t.signInTitle : t.signUpTitle}
          </h3>
          <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
            {mode === 'login' ? t.signInSubtitle : t.signUpSubtitle}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="mb-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
              color: '#f87171',
            }}
          >
            <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                {t.nameLabel}
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                disabled={isLoading}
                maxLength={100}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
              {t.emailLabel}
            </label>
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              disabled={isLoading}
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:outline-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
              {t.passwordLabel}
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                disabled={isLoading}
                className="w-full rounded-xl border py-2.5 pl-3.5 pr-10 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-press mt-2 flex w-full items-center justify-center rounded-xl py-3 text-xs font-bold text-white transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #2563EB 100%)',
              boxShadow: '0 4px 15px -2px rgba(59,130,246,0.4)',
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{t.submitting}</span>
              </div>
            ) : mode === 'login' ? (
              t.signInButton
            ) : (
              t.signUpButton
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="mt-6 border-t pt-4 text-center text-xs text-[var(--text-secondary)]" style={{ borderColor: 'var(--border)' }}>
          {mode === 'login' ? (
            <p>
              {t.noAccount}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="font-bold text-[var(--accent)] hover:underline"
              >
                {t.signUpLink}
              </button>
            </p>
          ) : (
            <p>
              {t.hasAccount}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-[var(--accent)] hover:underline"
              >
                {t.signInLink}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
