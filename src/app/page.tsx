'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ChatSection from '@/components/ChatSection';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import ConversationHistory from '@/components/ConversationHistory';
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
      'SugamGov AI provides information assistance. Verify important details through official government sources.',
    sourceLinkText: 'Access Official Portal',
    badgeLive: 'Verified Real Source',
    badgeCombined: 'Verified Official Sources',
    badgeCached: 'Verified Local Copy',
    askEyebrow: 'AI ASSISTANT',
    askTitle: 'Ask SugamGov',
    askSubtitle: 'Government information, simplified.',
    askBoxHeadline: 'What can I help you with today?',
    askBoxDesc: 'Ask about public schemes, eligibility criteria, required documents, or government services.',
    suggestionTags: ['Agriculture & Farmers', 'Healthcare & Protection', 'Certificates & Revenue'],
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
    backToHome: 'Back to Home',
  },
  hi: {
    title: 'सुगमगॉव AI',
    heroLine1: 'सरकारी सेवाएं,',
    heroLine2: 'एआई के साथ सरल।',
    subtitle: 'सार्वजनिक सेवाओं के लिए आपका विश्वसनीय, आधिकारिक AI सहायक। प्रश्न पूछें, तुरंत सत्यापित उत्तर प्राप्त करें।',
    placeholder: 'पीएम किसान पात्रता, पासपोर्ट के बारे में पूछें...',
    disclaimer:
      'सुगमगॉव AI सूचना सहायता प्रदान करता है। महत्वपूर्ण विवरणों की पुष्टि आधिकारिक सरकारी स्रोतों से करें।',
    sourceLinkText: 'पोर्टल पर जाएं',
    badgeLive: 'आधिकारिक लाइव चेक',
    badgeCombined: 'सत्यापित आधिकारिक स्रोत',
    badgeCached: 'सत्यापित स्थानीय दस्तावेज़',
    askEyebrow: 'एआई सहायक',
    askTitle: 'सुगमगॉव से पूछें',
    askSubtitle: 'सरकारी जानकारी, अब सरल और स्पष्ट।',
    askBoxHeadline: 'आज मैं आपकी क्या सहायता कर सकता हूँ?',
    askBoxDesc: 'सरकारी योजनाओं, पात्रता नियमों, आवश्यक दस्तावेज़ों या नागरिक सेवाओं के बारे में पूछें।',
    suggestionTags: ['कृषि एवं किसान', 'स्वास्थ्य एवं सुरक्षा', 'प्रमाण पत्र एवं राजस्व'],
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
    backToHome: 'मुख्य पृष्ठ पर वापस',
  },
  gu: {
    title: 'સુગમગવ AI',
    heroLine1: 'સરકારી સેવાઓ,',
    heroLine2: 'AI દ્વારા સરળ.',
    subtitle: 'સાર્વજનિક સેવાઓ માટે તમારો વિશ્વસનીય, સત્તાવાર AI સહાયક. પ્રશ્ન પૂછો, તરત જ ચકાસાયેલ જવાબો મેળવો.',
    placeholder: 'પીએમ કિસાન પાત્રતા, પાસપોર્ટ વિશે પૂછો...',
    disclaimer:
      'સુગમગવ AI માહિતી સહાય પૂરી પાડે છે. મહત્વપૂર્ણ વિગતોની ચકાસણી સત્તાવાર સરકારી સ્ત્રોતો દ્વારા કરો.',
    sourceLinkText: 'સત્તાવાર પોર્ટલ જુઓ',
    badgeLive: 'સત્તાવાર લાઈવ ચેક',
    badgeCombined: 'ખરાઈ કરેલ સત્તાવાર સ્ત્રોત',
    badgeCached: 'ચકાસાયેલ સ્થાનિક નકલ',
    askEyebrow: 'AI સહાયક',
    askTitle: 'સુગમગવને પૂછો',
    askSubtitle: 'સરકારી માહિતી, હવે સરળ અને સ્પષ્ટ.',
    askBoxHeadline: 'આજે હું તમને શું મદદ કરી શકું?',
    askBoxDesc: 'સરકારી યોજનાઓ, પાત્રતા માપદંડો, જરૂરી કાગળો અથવા સરકારી સેવાઓ વિશે પૂછો.',
    suggestionTags: ['કૃષિ અને ખેડૂત', 'આરોગ્ય અને રક્ષણ', 'દાખલા અને મહેસૂલ'],
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
    backToHome: 'મુખ્ય પૃષ્ઠ પર પાછા',
  },
};

const NAV_TEXT = {
  en: { services: 'Services', updates: 'Updates', transparency: 'Transparency', history: 'History', signIn: 'Sign In', signOut: 'Sign Out' },
  hi: { services: 'सेवाएं', updates: 'अपडेट', transparency: 'पारदर्शिता', history: 'इतिहास', signIn: 'साइन इन', signOut: 'साइन आउट' },
  gu: { services: 'સેવાઓ', updates: 'અપડેટ', transparency: 'પારદર્શિતા', history: 'ઇતિહાસ', signIn: 'સાઇન ઇન', signOut: 'સાઇન આઉટ' },
};

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name: string; email: string; language: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMatchedSourceId, setLastMatchedSourceId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('services');

  // Guards language-preference fetches from overwriting a newer manual toggle
  const langChangeSeqRef = useRef(0);

  /* ═══════════════════════════════════════════
     PREFERENCE LOADING HELPER
     Fetches saved language from /api/preferences.
     seq guards against stale responses overwriting a newer manual toggle.
     ═══════════════════════════════════════════ */
  const loadUserPreferences = async (seq: number) => {
    try {
      const res = await fetch('/api/preferences');
      if (!res.ok) return; // 401 for guest, ignore gracefully
      const data = await res.json();
      const savedLang = data?.language;
      if (
        savedLang &&
        ['en', 'hi', 'gu'].includes(savedLang) &&
        seq === langChangeSeqRef.current // Only apply if no newer manual change
      ) {
        setLanguage(savedLang as Language);
      }
    } catch {
      // Network error — keep current language, never crash
    }
  };

  // Check existing session on initial load
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.user) {
            setUser(data.user);
            // Load saved preference — capture current seq so a manual toggle wins
            const seq = langChangeSeqRef.current;
            await loadUserPreferences(seq);
          }
        }
      } catch {
        // Guest mode or network error
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ═══════════════════════════════════════════
     LANGUAGE CHANGE HANDLER
     - Updates UI immediately (optimistic)
     - For authenticated users: persists to /api/preferences
     - For guests: in-memory only
     - Never blocks the UI on network
     ═══════════════════════════════════════════ */
  const handleLanguageChange = (newLang: Language) => {
    // Increment sequence so any in-flight preference fetch won't overwrite this
    langChangeSeqRef.current += 1;
    setLanguage(newLang);

    if (!user) return; // Guest — in-memory only, no API call

    // Persist asynchronously — fire and forget with graceful error handling
    (async () => {
      try {
        await fetch('/api/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLang }),
        });
        // Update the user object's language field to keep it in sync
        setUser((prev) => (prev ? { ...prev, language: newLang } : prev));
      } catch {
        // Network error — UI already updated optimistically, no crash, no revert
      }
    })();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore network errors during logout */
    } finally {
      setUser(null);
      setLanguage('en'); // Reset to default — never leak User A's language to next user
      setHistoryOpen(false);
      setConversationId(null);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setLastMatchedSourceId(null);
    setInput('');
    setHistoryOpen(false);
  };

  const handleConversationDeleted = (deletedId: string) => {
    if (conversationId === deletedId) {
      setMessages([]);
      setConversationId(null);
      setLastMatchedSourceId(null);
      setInput('');
    }
  };

  const handleSelectConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.status === 401) {
        setUser(null);
        setHistoryOpen(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load conversation');
      }
      const data = await res.json();
      if (data?.conversation && Array.isArray(data?.messages)) {
        const loadedMessages: Message[] = data.messages.map((m: {
          id: string;
          sender: 'user' | 'assistant';
          text: string;
          sourceName?: string;
          sourceUrl?: string;
          retrievalMethod?: 'live_fetch' | 'live_fetch_with_cached_context' | 'cached_official_fallback' | 'unmatched_default';
          isSupported?: boolean;
          serviceId?: string;
        }) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          sourceName: m.sourceName,
          sourceUrl: m.sourceUrl,
          retrievalMethod: m.retrievalMethod,
          isSupported: m.isSupported,
        }));

        setConversationId(data.conversation.id);
        setMessages(loadedMessages);

        const lastAssistant = [...data.messages].reverse().find((m: { sender: string; serviceId?: string }) => m.sender === 'assistant');
        if (lastAssistant?.serviceId) {
          setLastMatchedSourceId(lastAssistant.serviceId);
        } else {
          setLastMatchedSourceId(null);
        }
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgIdRef = useRef(0);
  const text = UI_TEXT[language];
  const nav = NAV_TEXT[language];

  const prevMsgLengthRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length !== prevMsgLengthRef.current) {
      prevMsgLengthRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const scrollToSection = (id: string, navKey?: string) => {
    setMobileMenuOpen(false);
    if (navKey) setActiveNav(navKey);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ═══════════════════════════════════════════
     CHAT HANDLER
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
        console.warn('Client-side stream timeout reached (28 seconds of silence).');
        if (reader) {
          try {
            reader.cancel();
          } catch {
            /* ignore cancel error */
          }
        }
      }, 28000);
    };

    try {
      resetTimeout();

      const targetConvId = conversationId || undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language,
          lastMatchedSourceId,
          history: messages,
          conversationId: targetConvId,
        }),
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
              if (data.conversationId) setConversationId(data.conversationId);
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
      if (user) {
        setHistoryRefreshKey((prev) => prev + 1);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="flex min-h-screen flex-col text-[var(--text-primary)] selection:bg-[var(--accent)]/20">
      <div className="ambient-bg" />
      <div className="grain-overlay" />

      <Navbar
        title={text.title}
        language={language}
        setLanguage={handleLanguageChange}
        activeNav={activeNav}
        scrollToSection={scrollToSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        navText={nav}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onToggleHistory={() => setHistoryOpen(!historyOpen)}
      />

      <main className="w-full flex-1">
        {messages.length === 0 ? (
          <HeroSection
            text={text}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            handleSend={handleSend}
            inputRef={inputRef}
            language={language}
            featureStats={FEATURE_STATS}
          />
        ) : (
          <ChatSection
            messages={messages}
            text={text}
            isLoading={isLoading}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            setMessages={setMessages}
            setLastMatchedSourceId={setLastMatchedSourceId}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            onNewChat={handleNewChat}
          />
        )}
      </main>

      <Footer title={text.title} />

      <ConversationHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        user={user}
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onConversationDeleted={handleConversationDeleted}
        language={language}
        refreshTrigger={historyRefreshKey}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(authUser) => {
          setUser(authUser);
          setAuthModalOpen(false);
          // Load the user's saved language preference after successful login
          const seq = langChangeSeqRef.current;
          loadUserPreferences(seq);
        }}
        language={language}
      />
    </div>
  );
}