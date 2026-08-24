'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import AnimatedPage from '@/components/AnimatedPage';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import LatestGovernmentUpdates from '@/components/LatestGovernmentUpdates';
import { Message, Language } from '@/types/chat';

/* ═══════════════════════════════════════════
   UI TEXT — multi-language
   ═══════════════════════════════════════════ */
const UI_TEXT = {
  en: {
    title: 'SugamGov AI',
    heroLine1: 'Government Services,',
    heroLine2: 'Simplified with AI.',
    subtitle: 'Your trusted, official AI assistant for navigating public services. Ask a question, get verified answers instantly.',
    placeholder: 'Ask about PM Kisan eligibility, passports...',
    disclaimer:
      'SugamGov AI provides information assistance and users should verify important details through the linked official government source.',
    sourceLinkText: 'Access Official Portal',
    badgeLive: 'Verified Real Source',
    badgeCombined: 'Verified Official Sources',
    badgeCached: 'Verified Local Copy',
    suggestions: [
      'PM Kisan eligibility kya hai?',
      'Ayushman Bharat eligibility?',
      'How to apply for Income Certificate?',
    ],
    errorMsg: 'Sorry, I encountered an error. Please try asking again.',
    assistantLabel: 'SugamGov Assistant',
    userLabel: 'Citizen Query',
    verifiedBadge: 'Verified Govt Source',
    askAI: 'Ask AI Details',
    heroBadge: 'AI-Powered Government Assistant',
    stat1: 'Official Sources',
    stat2: 'Multilingual',
    stat3: 'AI Verified',
  },
  hi: {
    title: 'सुगमगॉव AI',
    heroLine1: 'सरकारी सेवाएं,',
    heroLine2: 'एआई के साथ सरल।',
    subtitle: 'सार्वजनिक सेवाओं के लिए आपका विश्वसनीय, आधिकारिक AI सहायक। प्रश्न पूछें, तुरंत सत्यापित उत्तर प्राप्त करें।',
    placeholder: 'पीएम किसान पात्रता, पासपोर्ट के बारे में पूछें...',
    disclaimer:
      'सुगमगॉव AI सूचना सहायता प्रदान करता है और उपयोगकर्ताओं को लिंक किए गए आधिकारिक सरकारी स्रोत के माध्यम से महत्वपूर्ण विवरणों की पुष्टि करनी चाहिए।',
    sourceLinkText: 'पोर्टल पर जाएं',
    badgeLive: 'आधिकारिक लाइव चेक',
    badgeCombined: 'सत्यापित आधिकारिक स्रोत',
    badgeCached: 'सत्यापित स्थानीय दस्तावेज़',
    suggestions: [
      'पीएम किसान पात्रता (eligibility) क्या है?',
      'आयुष्मान भारत के लिए कौन पात्र है?',
      'आय प्रमाण पत्र (Income Certificate) कैसे बनवाएं?',
    ],
    errorMsg: 'क्षमा करें, अनुरोध पूरा करने में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    assistantLabel: 'सुगमगॉव सहायक',
    userLabel: 'नागरिक प्रश्न',
    verifiedBadge: 'सत्यापित सरकारी स्रोत',
    askAI: 'AI से पूछें',
    heroBadge: 'एआई-संचालित सरकारी सहायक',
    stat1: 'आधिकारिक स्रोत',
    stat2: 'बहुभाषी',
    stat3: 'AI सत्यापित',
  },
  gu: {
    title: 'સુગમગવ AI',
    heroLine1: 'સરકારી સેવાઓ,',
    heroLine2: 'AI દ્વારા સરળ.',
    subtitle: 'સાર્વજનિક સેવાઓ માટે તમારો વિશ્વસનીય, સત્તાવાર AI સહાયક. પ્રશ્ન પૂછો, તરત જ ચકાસાયેલ જવાબો મેળવો.',
    placeholder: 'પીએમ કિસાન પાત્રતા, પાસપોર્ટ વિશે પૂછો...',
    disclaimer:
      'સુગમગવ AI માહિતી સહાય પૂરી પાડે છે અને વપરાશકર્તાઓએ લિંક કરેલ સત્તાવાર સરકારી સ્ત્રોત દ્વારા મહત્વપૂર્ણ વિગતોની ચકાસણી કરવી જોઈએ.',
    sourceLinkText: 'સત્તાવાર પોર્ટલ જુઓ',
    badgeLive: 'સત્તાવાર લાઈવ ચેક',
    badgeCombined: 'ખરાઈ કરેલ સત્તાવાર સ્ત્રોત',
    badgeCached: 'ચકાસાયેલ સ્થાનિક નકલ',
    suggestions: [
      'પીએમ કિસાન યોજના માટે પાત્રતા શું છે?',
      'આયુષ્માન ભારત યોજનાના શું લાભ છે?',
      'આવકનો દાખલો (Income Certificate) કઢાવવા માટે કયા કાગળો જોઈએ?',
    ],
    errorMsg: 'ભૂલ આવી છે. કૃપા કરીને પ્રશ્ન ફરીથી સબમિટ કરો.',
    assistantLabel: 'સુગમગવ સહાયક',
    userLabel: 'નાગરિક પ્રશ્ન',
    verifiedBadge: 'ચકાસાયેલ સરકારી સ્ત્રોત',
    askAI: 'AI ને પૂછો',
    heroBadge: 'AI-સંચાલિત સરકારી સહાયક',
    stat1: 'સત્તાવાર સ્ત્રોત',
    stat2: 'બહુભાષી',
    stat3: 'AI ચકાસાયેલ',
  },
};

const NAV_TEXT = {
  en: { services: 'Services', updates: 'Updates', transparency: 'Transparency', history: 'History' },
  hi: { services: 'सेवाएं', updates: 'अपडेट', transparency: 'पारदर्शिता', history: 'इतिहास' },
  gu: { services: 'સેવાઓ', updates: 'અપડેટ', transparency: 'પારદર્શિતા', history: 'ઇતિહાસ' },
};

/* ═══════════════════════════════════════════
   SERVICE CARDS DATA
   ═══════════════════════════════════════════ */
const SCHEMES = [
  {
    title: 'PM Kisan Samman Nidhi',
    desc: 'Check eligibility, beneficiary status, and installment details for the PM Kisan scheme.',
    query: 'PM Kisan eligibility kya hai?',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Ayushman Bharat Yojana',
    desc: 'Access health coverage details, find empaneled hospitals, and apply for the ABHA card.',
    query: 'Ayushman Bharat eligibility?',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

/* ═══════════════════════════════════════════
   FEATURE STATS
   ═══════════════════════════════════════════ */
const FEATURE_STATS = [
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    key: 'stat1' as const,
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    key: 'stat2' as const,
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    key: 'stat3' as const,
  },
];

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMatchedSourceId, setLastMatchedSourceId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('services');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgIdRef = useRef(0);
  const text = UI_TEXT[language];
  const nav = NAV_TEXT[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const scrollToSection = (id: string, navKey?: string) => {
    setMobileMenuOpen(false);
    if (navKey) setActiveNav(navKey);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ═══ 3D TILT HANDLER ═══ */
  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--rx', `${py * -10}deg`);
    el.style.setProperty('--ry', `${px * 12}deg`);
  }, []);

  const handleTiltLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  /* ═══════════════════════════════════════════
     CHAT HANDLER (preserved logic with stream lifecycle fix)
     ═══════════════════════════════════════════ */
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: String(++msgIdRef.current),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantMsgId = '';
    let clientTimeout: ReturnType<typeof setTimeout> | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined = undefined;

    const resetTimeout = () => {
      if (clientTimeout) clearTimeout(clientTimeout);
      clientTimeout = setTimeout(() => {
        console.warn('Client-side stream timeout reached (15 seconds of silence).');
        if (reader) {
          try {
            reader.cancel();
          } catch {
            /* ignore cancel error */
          }
        }
      }, 15000);
    };

    try {
      resetTimeout();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, language, lastMatchedSourceId }),
      });

      if (!response.ok) {
        let errorMsgText = text.errorMsg;
        try {
          const errData = await response.json();
          if (errData?.error) errorMsgText = errData.error;
        } catch {
          /* ignore parse failure */
        }
        throw new Error(errorMsgText);
      }

      reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      assistantMsgId = String(++msgIdRef.current);
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, sender: 'assistant', text: '', sourceName: '', sourceUrl: '', isSupported: true },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resetTimeout();

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.type === 'metadata') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                      ...m,
                      sourceName: data.officialSource,
                      sourceUrl: data.sourceUrl,
                      retrievalMethod: data.retrievalMethod,
                      isSupported: data.isSupported !== false,
                    }
                    : m
                )
              );
              if (data.serviceId) setLastMatchedSourceId(data.serviceId);
              else if (data.isSupported === false) setLastMatchedSourceId(null);
            } else if (data.type === 'chunk') {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, text: m.text + data.text } : m))
              );
            } else if (data.type === 'error') {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, text: data.message, isSupported: false } : m))
              );
            }
          } catch (jsonErr) {
            console.error('Error parsing stream line:', jsonErr);
          }
        }
      }

      // Parse any remaining trailing line in buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer.trim());
          if (data.type === 'chunk') {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, text: m.text + data.text } : m))
            );
          } else if (data.type === 'error') {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, text: data.message, isSupported: false } : m))
            );
          }
        } catch {
          /* ignore trailing line parse errors */
        }
      }
    } catch (error) {
      console.error('Chat interface error:', error);
      const message = (error as Error).message || text.errorMsg;
      if (assistantMsgId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, text: m.text || message, isSupported: false } : m))
        );
      } else {
        setMessages((prev) => [
          ...prev,
          { id: String(++msgIdRef.current), sender: 'assistant', text: message, isSupported: false },
        ]);
      }
    } finally {
      if (clientTimeout) clearTimeout(clientTimeout);
      if (reader) {
        try {
          reader.releaseLock();
        } catch {
          /* ignore release lock error */
        }
      }
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCardClick = (queryText: string) => {
    setInput(queryText);
    scrollToSection('chatbot-anchor');
    setTimeout(() => inputRef.current?.focus(), 400);
  };

  const showTypingIndicator = isLoading && (messages.length === 0 || messages[messages.length - 1].sender !== 'assistant');

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen flex-col text-[var(--text-primary)] selection:bg-[var(--accent)]/20">

      {/* Ambient background */}
      <div className="ambient-bg" />
      <div className="grain-overlay" />

      {/* ─── NAVBAR ─── */}
      <header className="glass sticky top-0 z-40 w-full border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--accent)' }}>
              {text.title}
            </h1>
          </div>

          {/* Center Nav */}
          <nav className="hidden items-center gap-8 text-xs font-semibold md:flex">
            {[
              { key: 'services', id: 'services-anchor', label: nav.services },
              { key: 'updates', id: 'updates-anchor', label: nav.updates },
              { key: 'transparency', id: 'footer-anchor', label: nav.transparency },
              { key: 'history', id: 'footer-anchor', label: nav.history },
            ].map(item => (
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </button>

            {/* User avatar */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>

            {/* Mobile menu */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 text-[var(--text-secondary)] md:hidden">
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
          <div className="flex flex-col gap-1 border-t px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] md:hidden" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => scrollToSection('services-anchor', 'services')} className="border-b py-2.5 text-left hover:text-[var(--accent)]" style={{ borderColor: 'var(--border)' }}>{nav.services}</button>
            <button onClick={() => scrollToSection('updates-anchor', 'updates')} className="border-b py-2.5 text-left hover:text-[var(--accent)]" style={{ borderColor: 'var(--border)' }}>{nav.updates}</button>
            <button onClick={() => scrollToSection('footer-anchor', 'transparency')} className="border-b py-2.5 text-left hover:text-[var(--accent)]" style={{ borderColor: 'var(--border)' }}>{nav.transparency}</button>
            <button onClick={() => scrollToSection('footer-anchor', 'history')} className="py-2.5 text-left hover:text-[var(--accent)]">{nav.history}</button>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="w-full flex-1">
        {messages.length === 0 ? (
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
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={text.placeholder}
                    disabled={isLoading}
                    className="w-full bg-transparent py-3.5 pl-3 pr-14 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
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
                {FEATURE_STATS.map((stat, idx) => (
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

            {/* ═══ SERVICES + UPDATES ROW ═══ */}
            <section id="services-anchor" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* 3D Tilt Service Cards */}
                {SCHEMES.map((scheme, i) => (
                  <div
                    key={i}
                    onClick={() => handleCardClick(scheme.query)}
                    onMouseMove={handleTiltMove}
                    onMouseLeave={handleTiltLeave}
                    className="tilt-card-3d card-hover anim-rise stagger group flex cursor-pointer flex-col rounded-2xl border p-6"
                    style={{ ['--d' as string]: `${i * 120}ms`, background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="tilt-inner">
                      {/* Icon with glow */}
                      <div
                        className="icon-glow mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {scheme.icon}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold leading-tight tracking-wide transition-colors group-hover:text-[var(--accent)]">
                        {scheme.title}
                      </h4>

                      {/* Description */}
                      <p className="mt-2.5 flex-grow text-xs font-medium leading-relaxed text-[var(--text-secondary)]">
                        {scheme.desc}
                      </p>

                      {/* Verified badge */}
                      <div className="mt-5 flex items-center justify-between">
                        <span className="verified-badge">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {text.verifiedBadge}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Latest Updates Column */}
                <div
                  id="updates-anchor"
                  className="anim-rise stagger flex flex-col rounded-2xl border p-6"
                  style={{ ['--d' as string]: '250ms', background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <LatestGovernmentUpdates language={language} />
                </div>
              </div>
            </section>

            {/* Section divider */}
            <div className="section-divider mx-auto max-w-6xl" />

            {/* ═══ CHAT ENTRY (suggestion buttons) ═══ */}
            <section id="chatbot-anchor" className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
              <div className="anim-rise mb-8">
                <h3 className="text-xl font-bold sm:text-2xl">
                  Have a <span className="gradient-text">government service</span> question?
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs font-medium text-[var(--text-secondary)]">
                  Pick a suggestion below or type your own question.
                </p>
              </div>

              <div className="mx-auto mb-6 flex max-w-xl flex-col gap-3">
                {text.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="suggestion-card card-hover anim-rise stagger group flex items-center justify-between rounded-xl border p-4 text-left text-xs font-semibold tracking-wide transition-all active:scale-[0.99]"
                    style={{ ['--d' as string]: `${idx * 80}ms`, background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <span className="text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]">{suggestion}</span>
                    <svg className="h-4 w-4 text-[var(--text-muted)] transition-all group-hover:translate-x-1.5 group-hover:text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                ))}
              </div>

              <p className="mx-auto mt-4 max-w-lg px-4 text-[10px] font-medium leading-relaxed text-[var(--text-muted)]">
                ⚠️ {text.disclaimer}
              </p>
            </section>
          </div>
        ) : (
          /* ═══ ACTIVE CHAT VIEW ═══ */
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center p-4 sm:p-6">
            <AnimatedPage>
              <div className="flex flex-col gap-6 py-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    text={text}
                    assistantLabel={text.assistantLabel}
                    userLabel={text.userLabel}
                  />
                ))}
                {showTypingIndicator && <TypingIndicator label={text.assistantLabel} />}
                <div ref={messagesEndRef} />
              </div>
            </AnimatedPage>

            <div className="mt-auto w-full border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="animated-border search-focus-glow relative flex w-full items-center rounded-full p-1.5 transition-all"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center pl-4">
                  <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={text.placeholder}
                  disabled={isLoading}
                  className="w-full bg-transparent py-3 pl-3 pr-14 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="btn-press absolute right-2 flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:opacity-30"
                  style={{ background: 'var(--accent)' }}
                >
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
              <p className="mt-3 px-4 text-center text-[9px] font-medium leading-relaxed text-[var(--text-muted)]">
                ⚠️ {text.disclaimer}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer id="footer-anchor" className="mt-auto border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{text.title}</span>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              © 2026 Digital Government Services. Verified Official Source.
            </span>
          </div>
          <div className="flex items-center gap-5 text-[11px] font-medium text-[var(--text-secondary)]">
            <a href="#" className="transition-colors hover:text-[var(--accent)]">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-[var(--accent)]">Terms of Service</a>
            <a href="#" className="transition-colors hover:text-[var(--accent)]">Accessibility</a>
            <a href="#" className="transition-colors hover:text-[var(--accent)]">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}