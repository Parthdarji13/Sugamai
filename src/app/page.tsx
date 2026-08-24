'use client';

import React, { useState, useRef, useEffect } from 'react';
import AnimatedPage from '@/components/AnimatedPage';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import LatestGovernmentUpdates from '@/components/LatestGovernmentUpdates';
import { Message, Language } from '@/types/chat';

const UI_TEXT = {
  en: {
    title: 'SugamGov AI',
    subtitle: 'Intelligent Government Service Assistant',
    welcomeTitle: 'Government services,',
    welcomeSubTitleHighlight: 'made simple with AI.',
    welcomeSub:
      'Find government schemes, certificates and public services using simple questions. SugamGov AI retrieves official information and explains it in a clear and simple way.',
    placeholder: 'Ask SugamGov AI a question...',
    disclaimer:
      'SugamGov AI provides information assistance and users should verify important details through the linked official government source.',
    sourceLinkText: 'Access Official Portal',
    badgeLive: 'Official Live Check',
    badgeCached: 'Verified Local Copy',
    suggestions: [
      'PM Kisan eligibility kya hai?',
      'Ayushman Bharat eligibility?',
      'How to apply for Income Certificate?',
    ],
    errorMsg: 'Sorry, I encountered an error. Please try asking again.',
    assistantLabel: 'SugamGov Assistant',
    userLabel: 'Citizen Query',
  },
  hi: {
    title: 'सुगमगॉव AI',
    subtitle: 'बुद्धिमान सरकारी सेवा सहायक',
    welcomeTitle: 'सरकारी सेवाएं,',
    welcomeSubTitleHighlight: 'एआई के साथ सरल।',
    welcomeSub:
      'सरल प्रश्नों का उपयोग करके सरकारी योजनाओं, प्रमाणपत्रों और सार्वजनिक सेवाओं की खोज करें। सुगमगॉव AI आधिकारिक स्रोतों से जानकारी प्राप्त करता है और इसे स्पष्ट रूप से समझाता है।',
    placeholder: 'सुगमगॉव AI से प्रश्न पूछें...',
    disclaimer:
      'सुगमगॉव AI सूचना सहायता प्रदान करता है और उपयोगकर्ताओं को लिंक किए गए आधिकारिक सरकारी स्रोत के माध्यम से महत्वपूर्ण विवरणों की पुष्टि करनी चाहिए।',
    sourceLinkText: 'पोर्टल पर जाएं',
    badgeLive: 'आधिकारिक लाइव चेक',
    badgeCached: 'सत्यापित स्थानीय दस्तावेज़',
    suggestions: [
      'पीएम किसान पात्रता (eligibility) क्या है?',
      'आयुष्मान भारत के लिए कौन पात्र है?',
      'आय प्रमाण पत्र (Income Certificate) कैसे बनवाएं?',
    ],
    errorMsg: 'क्षमा करें, अनुरोध पूरा करने में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    assistantLabel: 'सुगमगॉव सहायक',
    userLabel: 'नागरिक प्रश्न',
  },
  gu: {
    title: 'સુગમગવ AI',
    subtitle: 'ઇન્ટેલિજન્ટ સરકારી સેવા સહાયક',
    welcomeTitle: 'સરકારી સેવાઓ,',
    welcomeSubTitleHighlight: 'એઆઈ દ્વારા સરળ.',
    welcomeSub:
      'સરળ પ્રશ્નો પૂછીને સરકારી યોજનાઓ, પ્રમાણપત્રો અને સરકારી સેવાઓ શોધો. સુગમગવ AI સત્તાવાર સ્રોતોમાંથી માહિતી મેળવે છે અને તેને સ્પષ્ટ રીતે સમજાવે છે.',
    placeholder: 'સુગમગવ AI ને પ્રશ્ન પૂછો...',
    disclaimer:
      'સુગમગવ AI માહિતી સહાય પૂરી પાડે છે અને વપરાશકર્તાઓએ લિંક કરેલ સત્તાવાર સરકારી સ્ત્રોત દ્વારા મહત્વપૂર્ણ વિગતોની ચકાસણી કરવી જોઈએ.',
    sourceLinkText: 'સત્તાવાર પોર્ટલ જુઓ',
    badgeLive: 'સત્તાવાર લાઈવ ચેક',
    badgeCached: 'ચકાસાયેલ સ્થાનિક નકલ',
    suggestions: [
      'પીએમ કિસાન યોજના માટે પાત્રતા શું છે?',
      'આયુષ્માન ભારત યોજનાના શું લાભ છે?',
      'આવકનો દાખલો (Income Certificate) કઢાવવા માટે કયા કાગળો જોઈએ?',
    ],
    errorMsg: 'ભૂલ આવી છે. કૃપા કરીને પ્રશ્ન ફરીથી સબમિટ કરો.',
    assistantLabel: 'સુગમગવ સહાયક',
    userLabel: 'નાગરિક પ્રશ્ન',
  },
};

const NAV_TEXT = {
  en: { home: 'Home', services: 'Services', howItWorks: 'How It Works', about: 'About' },
  hi: { home: 'होम', services: 'सेवाएं', howItWorks: 'कैसे काम करता है', about: 'हमारे बारे में' },
  gu: { home: 'હોમ', services: 'સેવાઓ', howItWorks: 'કેવી રીતે કામ કરે છે', about: 'અમારા વિશે' },
};

const SCHEMES = [
  {
    title: 'PM Kisan Samman Nidhi',
    desc: 'Direct cash assistance of ₹6,000 yearly for cultivable landholding farmers.',
    query: 'PM Kisan eligibility kya hai?',
    accent: 'var(--accent)',
    accentSoft: 'var(--accent-soft)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Ayushman Bharat',
    desc: 'Paperless health cover of ₹5 lakh per year for hospital and diagnostic expenses.',
    query: 'Ayushman Bharat eligibility?',
    accent: 'var(--success)',
    accentSoft: 'rgba(52,211,153,0.1)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Income Certificate',
    desc: 'Eligibility criteria, required documents and step-by-step application guidance.',
    query: 'How to apply for Income Certificate?',
    accent: 'var(--accent-2)',
    accentSoft: 'var(--accent-2-soft)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const STEPS = [
  { num: '01', name: 'ASK', desc: 'Ask your question naturally, in English, Hindi or Gujarati.', accent: 'var(--accent)' },
  { num: '02', name: 'FIND', desc: 'SugamGov identifies the relevant scheme and official source.', accent: 'var(--accent-2)' },
  { num: '03', name: 'UNDERSTAND', desc: 'AI explains the information clearly, with the source linked.', accent: 'var(--success)' },
];

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMatchedSourceId, setLastMatchedSourceId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgIdRef = useRef(0);
  const text = UI_TEXT[language];
  const nav = NAV_TEXT[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Lightweight CSS-based 3D tilt for the hero preview card — no extra deps.
  const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -8, ry: px * 10 });
  };
  const resetTilt = () => setTilt({ rx: 0, ry: 0 });

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
    let dataReceived = false;
    let clientTimeout: ReturnType<typeof setTimeout> | null = null;

    try {
      clientTimeout = setTimeout(() => {
        if (!dataReceived) {
          console.warn('Client-side safety timeout reached (20 seconds of silence).');
          setIsLoading(false);
          if (assistantMsgId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, text: text.errorMsg, isSupported: false } : m))
            );
          } else {
            setMessages((prev) => [
              ...prev,
              { id: String(++msgIdRef.current), sender: 'assistant', text: text.errorMsg, isSupported: false },
            ]);
          }
        }
      }, 20000);

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
          /* ignore parse failure, use default message */
        }
        throw new Error(errorMsgText);
      }

      const reader = response.body?.getReader();
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

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            dataReceived = true;
            if (clientTimeout) {
              clearTimeout(clientTimeout);
              clientTimeout = null;
            }

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
    } catch (error) {
      console.error('Chat interface error:', error);
      const message = (error as Error).message || text.errorMsg;
      if (assistantMsgId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, text: message, isSupported: false } : m))
        );
      } else {
        setMessages((prev) => [
          ...prev,
          { id: String(++msgIdRef.current), sender: 'assistant', text: message, isSupported: false },
        ]);
      }
    } finally {
      if (clientTimeout) clearTimeout(clientTimeout);
      setIsLoading(false);
    }
  };

  const handleCardClick = (queryText: string) => {
    setInput(queryText);
    scrollToSection('chatbot-anchor');
    setTimeout(() => inputRef.current?.focus(), 400);
  };

  const showTypingIndicator = isLoading && (messages.length === 0 || messages[messages.length - 1].sender !== 'assistant');

  return (
    <div className="flex min-h-screen flex-col text-[var(--text-primary)] selection:bg-[var(--accent)]/30">
      <div className="ambient-field" />
      <div className="grain-overlay" />

      {/* Tricolour signature strip */}
      <div className="relative z-50 flex h-[3px] w-full">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      {/* NAVBAR */}
      <header className="glass sticky top-0 z-40 w-full border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--accent)' }}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="pulse-dot absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ background: 'var(--success)' }} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight">{text.title}</h1>
              <span
                className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider"
                style={{ color: 'var(--accent-2)', background: 'var(--accent-2-soft)' }}
              >
                AI
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-xs font-bold text-[var(--text-secondary)] md:flex">
            <button onClick={() => scrollToSection('home-anchor')} className="transition-colors hover:text-[var(--text-primary)]">{nav.home}</button>
            <button onClick={() => scrollToSection('services-anchor')} className="transition-colors hover:text-[var(--text-primary)]">{nav.services}</button>
            <button onClick={() => scrollToSection('works-anchor')} className="transition-colors hover:text-[var(--text-primary)]">{nav.howItWorks}</button>
            <button onClick={() => scrollToSection('footer-anchor')} className="transition-colors hover:text-[var(--text-primary)]">{nav.about}</button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-lg border p-0.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              {(['en', 'hi', 'gu'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className="rounded px-2 py-1 text-[9px] font-extrabold tracking-wide transition-all"
                  style={
                    language === lang
                      ? { background: 'var(--accent)', color: '#12100c' }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'ગુજ'}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollToSection('chatbot-anchor')}
              className="hidden rounded-lg px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#12100c] transition-transform active:scale-95 sm:inline-flex"
              style={{ background: 'var(--accent)' }}
            >
              Ask SugamGov
            </button>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 text-[var(--text-secondary)] md:hidden">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="flex flex-col gap-1 border-t px-4 py-3 text-xs font-bold text-[var(--text-secondary)] md:hidden" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => scrollToSection('home-anchor')} className="border-b py-2.5 text-left" style={{ borderColor: 'var(--border)' }}>{nav.home}</button>
            <button onClick={() => scrollToSection('services-anchor')} className="border-b py-2.5 text-left" style={{ borderColor: 'var(--border)' }}>{nav.services}</button>
            <button onClick={() => scrollToSection('works-anchor')} className="border-b py-2.5 text-left" style={{ borderColor: 'var(--border)' }}>{nav.howItWorks}</button>
            <button onClick={() => scrollToSection('footer-anchor')} className="py-2.5 text-left">{nav.about}</button>
          </div>
        )}
      </header>

      <main className="w-full flex-1">
        {messages.length === 0 ? (
          <div id="home-anchor" className="flex flex-col">
            {/* HERO */}
            <section className="mx-auto grid min-h-[72vh] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12">
              <div className="anim-rise lg:col-span-7">
                <span
                  className="mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider"
                  style={{ background: 'var(--accent-soft)', borderColor: 'rgba(242,146,74,0.3)', color: 'var(--accent)' }}
                >
                  ● AI-Powered Government Service Assistant
                </span>

                <h2 className="mb-5 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.6rem]">
                  {text.welcomeTitle}
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {text.welcomeSubTitleHighlight}
                  </span>
                </h2>

                <p className="mb-8 max-w-lg text-sm font-medium leading-relaxed text-[var(--text-secondary)]">
                  {text.welcomeSub}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => scrollToSection('chatbot-anchor')}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-[#12100c] transition-transform active:scale-95"
                    style={{ background: 'var(--accent)' }}
                  >
                    Ask SugamGov →
                  </button>
                  <button
                    onClick={() => scrollToSection('services-anchor')}
                    className="inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 text-[10px] font-black uppercase tracking-wider transition-colors"
                    style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
                  >
                    Explore Services
                  </button>
                </div>
              </div>

              {/* 3D tilt preview card */}
              <div className="anim-rise stagger lg:col-span-5" style={{ ['--d' as string]: '150ms' }}>
                <div
                  className="tilt-card float-slow relative mx-auto max-w-sm rounded-3xl border p-5 shadow-2xl"
                  style={{
                    background: 'rgba(14,16,21,0.7)',
                    borderColor: 'rgba(242,146,74,0.2)',
                    ['--rx' as string]: `${tilt.rx}deg`,
                    ['--ry' as string]: `${tilt.ry}deg`,
                  }}
                  onMouseMove={handleTiltMove}
                  onMouseLeave={resetTilt}
                >
                  <div
                    className="pointer-events-none absolute -inset-0.5 rounded-3xl opacity-25 blur-xl"
                    style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
                  />
                  <div className="tilt-layer relative z-10">
                    <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                        <span className="ml-2 text-[9px] font-black uppercase tracking-widest">SugamGov AI</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase" style={{ color: 'var(--success)' }}>
                        <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                        Source Connected
                      </span>
                    </div>

                    <div className="flex flex-col gap-4 text-xs font-semibold">
                      <div className="flex flex-col items-end">
                        <span className="mb-1 text-[7px] font-bold uppercase text-[var(--text-muted)]">User</span>
                        <div
                          className="max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-white shadow-sm"
                          style={{ background: 'linear-gradient(135deg, var(--accent-user), #2f52d6)' }}
                        >
                          &quot;How can I check PM Kisan eligibility?&quot;
                        </div>
                      </div>

                      <div className="flex flex-col items-start">
                        <span className="mb-1 text-[7px] font-bold uppercase text-[var(--text-muted)]">SugamGov AI</span>
                        <div className="max-w-[95%] rounded-2xl border px-3.5 py-2.5 leading-relaxed" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                          Here is the information available from the official PM Kisan source…
                          <div className="mt-3.5 flex items-center justify-between border-t pt-2 text-[7px] font-black uppercase tracking-widest" style={{ borderColor: 'var(--border)' }}>
                            <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>✓ Official Source</span>
                            <span className="max-w-[130px] truncate text-[var(--text-muted)]">Ministry of Agriculture</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURE STRIP */}
            <section className="border-y py-5" style={{ borderColor: 'var(--border)', background: 'rgba(14,16,21,0.5)' }}>
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="grid grid-cols-2 gap-5 text-center md:grid-cols-4">
                  {[
                    { title: 'Official Government Sources', desc: 'Verified source content' },
                    { title: 'Source-Linked Answers', desc: 'Every reply, official links' },
                    { title: 'Multilingual Support', desc: 'English • Hindi • Gujarati' },
                    { title: 'AI-Assisted Clarity', desc: 'Complex rules, simplified' },
                  ].map((item, idx) => (
                    <div key={idx} className="anim-rise stagger flex flex-col items-center" style={{ ['--d' as string]: `${idx * 80}ms` }}>
                      <span className="text-xs font-black leading-tight">✓ {item.title}</span>
                      <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* LATEST UPDATES */}
            <section id="updates-anchor" className="mx-auto max-w-6xl border-b px-4 py-14 sm:px-6" style={{ borderColor: 'var(--border)' }}>
              <div className="mx-auto mb-9 max-w-xl text-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--accent-2)' }}>Live Broadcasts</span>
                <h3 className="mt-1 text-2xl font-black">Latest Government Updates</h3>
                <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">
                  Stay informed with important information from official government sources.
                </p>
              </div>
              <LatestGovernmentUpdates language={language} />
            </section>

            {/* CHAT ENTRY */}
            <section id="chatbot-anchor" className="mx-auto max-w-3xl border-b px-4 py-16 text-center sm:px-6" style={{ borderColor: 'var(--border)' }}>
              <div className="mb-8">
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--accent-2)' }}>Interactive Terminal</span>
                <h3 className="mt-1 text-2xl font-black sm:text-3xl">Have a government service question?</h3>
                <p className="mx-auto mt-2.5 max-w-md text-xs font-semibold leading-relaxed text-[var(--text-secondary)]">
                  Ask SugamGov AI in English, Hindi or Gujarati. Pick a suggestion or type your own.
                </p>
              </div>

              <div className="mx-auto mb-6 flex max-w-xl flex-col gap-2.5">
                {text.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="anim-rise stagger group flex items-center justify-between rounded-xl border p-3.5 text-left text-xs font-semibold tracking-wide transition-all active:scale-[0.99]"
                    style={{ ['--d' as string]: `${idx * 70}ms`, background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <span className="text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]">{suggestion}</span>
                    <svg className="h-3.5 w-3.5 text-[var(--text-muted)] transition-all group-hover:translate-x-1 group-hover:text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="relative mx-auto flex max-w-xl items-center rounded-2xl border p-1.5 shadow-2xl transition-all focus-within:border-[var(--accent)]/40"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={text.placeholder}
                  disabled={isLoading}
                  className="w-full bg-transparent py-3 pl-3.5 pr-12 text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none disabled:opacity-50 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 rounded-xl p-2 text-[#12100c] shadow-sm transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>

              <p className="mx-auto mt-4 max-w-lg px-4 text-[10px] font-semibold leading-relaxed text-[var(--text-muted)]">
                ⚠️ {text.disclaimer}
              </p>
            </section>

            {/* HOW IT WORKS */}
            <section id="works-anchor" className="mx-auto max-w-6xl border-b px-4 py-14 sm:px-6" style={{ borderColor: 'var(--border)' }}>
              <div className="mx-auto mb-9 max-w-xl text-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--accent-2)' }}>Process Blueprint</span>
                <h3 className="mt-1 text-2xl font-black">How SugamGov AI Works</h3>
              </div>

              <div className="relative mt-8 grid grid-cols-1 items-start gap-8 md:grid-cols-3">
                <div className="absolute left-[15%] right-[15%] top-7 z-0 hidden h-px md:block" style={{ background: 'var(--border-strong)' }} />
                {STEPS.map((step, idx) => (
                  <div key={idx} className="anim-rise stagger relative z-10 flex flex-col items-center px-4 text-center" style={{ ['--d' as string]: `${idx * 100}ms` }}>
                    <div
                      className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border text-base font-black"
                      style={{ borderColor: step.accent, color: step.accent, background: 'var(--surface)' }}
                    >
                      {step.num}
                    </div>
                    <h4 className="text-xs font-extrabold tracking-wider">{step.name}</h4>
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--text-secondary)]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* SERVICES */}
            <section id="services-anchor" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <div className="mx-auto mb-9 max-w-xl text-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--accent-2)' }}>Information Catalog</span>
                <h3 className="mt-1 text-2xl font-black">Government Services</h3>
                <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">
                  Explore services currently supported by SugamGov AI.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {SCHEMES.map((scheme, i) => (
                  <div
                    key={i}
                    onClick={() => handleCardClick(scheme.query)}
                    className="anim-rise stagger group flex cursor-pointer flex-col rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]"
                    style={{ ['--d' as string]: `${i * 90}ms`, background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border"
                      style={{ background: scheme.accentSoft, borderColor: 'var(--border)', color: scheme.accent }}
                    >
                      {scheme.icon}
                    </div>
                    <h4 className="text-xs font-extrabold leading-none tracking-wide transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {scheme.title}
                    </h4>
                    <p className="mt-2 flex-grow text-xs font-semibold leading-relaxed text-[var(--text-secondary)]">
                      {scheme.desc}
                    </p>
                    <span
                      className="mt-4 inline-flex items-center gap-1.5 border-t pt-3 text-[9px] font-black uppercase tracking-widest transition-colors"
                      style={{ borderColor: 'var(--border)', color: scheme.accent }}
                    >
                      Ask SugamGov →
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* ACTIVE CHAT VIEW */
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
                className="relative flex w-full items-center rounded-2xl border p-1.5 shadow-2xl transition-all focus-within:border-[var(--accent)]/40"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={text.placeholder}
                  disabled={isLoading}
                  className="w-full bg-transparent py-3 pl-3.5 pr-12 text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none disabled:opacity-50 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 rounded-xl p-2 text-[#12100c] shadow-sm transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
              <p className="mt-3 px-4 text-center text-[9px] font-semibold leading-relaxed text-[var(--text-muted)]">
                ⚠️ {text.disclaimer}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer id="footer-anchor" className="mt-auto border-t py-12 text-left" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h4 className="text-base font-black">{text.title}</h4>
            </div>
            <p className="max-w-xs text-xs font-semibold leading-relaxed text-[var(--text-secondary)]">
              AI-powered access to official government information. Sourced and verified dynamically.
            </p>
          </div>

          <div className="md:col-span-2">
            <h5 className="mb-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Services</h5>
            <div className="flex flex-col gap-2.5 text-xs font-semibold text-[var(--text-secondary)]">
              {SCHEMES.map((s) => (
                <button key={s.title} onClick={() => handleCardClick(s.query)} className="text-left transition-colors hover:text-[var(--text-primary)]">
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <h5 className="mb-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Navigation</h5>
            <div className="flex flex-col gap-2.5 text-xs font-semibold text-[var(--text-secondary)]">
              <button onClick={() => scrollToSection('home-anchor')} className="text-left transition-colors hover:text-[var(--text-primary)]">{nav.home}</button>
              <button onClick={() => scrollToSection('services-anchor')} className="text-left transition-colors hover:text-[var(--text-primary)]">{nav.services}</button>
              <button onClick={() => scrollToSection('works-anchor')} className="text-left transition-colors hover:text-[var(--text-primary)]">{nav.howItWorks}</button>
            </div>
          </div>

          <div className="md:col-span-2">
            <h5 className="mb-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Official Sources</h5>
            <div className="flex flex-col gap-2.5 text-xs font-semibold text-[var(--text-secondary)]">
              <a href="https://pmkisan.gov.in/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--text-primary)]">PM Kisan</a>
              <a href="https://pmjay.gov.in/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--text-primary)]">Ayushman Bharat</a>
              <a href="https://services.india.gov.in/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--text-primary)]">National Portal</a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t px-4 pt-6 text-center sm:px-6" style={{ borderColor: 'var(--border)' }}>
          <p className="mx-auto max-w-2xl text-[10px] font-semibold leading-relaxed text-[var(--text-muted)]">
            Disclaimer: {text.disclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}