'use client';

import React, { useState, useRef, useEffect } from 'react';
import AnimatedPage from '@/components/AnimatedPage';
import LatestGovernmentUpdates from '@/components/LatestGovernmentUpdates';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sourceName?: string;
  sourceUrl?: string;
  retrievalMethod?: 'live_fetch' | 'cached_official_fallback' | 'unmatched_default';
  isSupported?: boolean;
}

const UI_TEXT = {
  en: {
    title: 'SugamGov AI',
    tagline: 'SECURE INFORMATION VAULT',
    subtitle: 'Intelligent Government Service Assistant',
    welcomeTitle: 'Government Services,',
    welcomeSubTitleHighlight: 'Made Simple with AI.',
    welcomeSub: 'Find government schemes, certificates and public services using simple questions. SugamGov AI retrieves official information and explains it in a clear and simple way.',
    placeholder: 'Ask SugamGov AI a question...',
    disclaimer: 'SugamGov AI provides information assistance and users should verify important details through the linked official government source.',
    suggestedTitle: 'QUICK START SUGGESTIONS',
    sourceLabel: 'Verification Source:',
    sourceLinkText: 'Access Official Portal',
    badgeLive: 'Official Live Check',
    badgeCached: 'Verified Local Copy',
    badgeUnmatched: 'No Official Record',
    latencyText: 'Secure Session Active',
    suggestions: [
      'PM Kisan eligibility kya hai?',
      'Ayushman Bharat eligibility?',
      'How to apply for Income Certificate?'
    ],
    errorMsg: 'Sorry, I encountered an error. Please try asking again.',
  },
  hi: {
    title: 'सुगमगॉव AI',
    tagline: 'सुरक्षित सूचना तिजोरी',
    subtitle: 'बुद्धिमान सरकारी सेवा सहायक',
    welcomeTitle: 'सरकारी सेवाएं,',
    welcomeSubTitleHighlight: 'एआई के साथ सरल।',
    welcomeSub: 'सरल प्रश्नों का उपयोग करके सरकारी योजनाओं, प्रमाणपत्रों और सार्वजनिक सेवाओं की खोज करें। सुगमगॉव AI आधिकारिक स्रोतों से जानकारी प्राप्त करता है और इसे स्पष्ट रूप से समझाता है।',
    placeholder: 'सुगमगॉव AI से प्रश्न पूछें...',
    disclaimer: 'सुगमगॉव AI सूचना सहायता प्रदान करता है और उपयोगकर्ताओं को लिंक किए गए आधिकारिक सरकारी स्रोत के माध्यम से महत्वपूर्ण विवरणों की पुष्टि करनी चाहिए।',
    suggestedTitle: 'त्वरित सुझाव',
    sourceLabel: 'सत्यापन का स्रोत:',
    sourceLinkText: 'पोर्टल पर जाएं',
    badgeLive: 'आधिकारिक लाइव चेक',
    badgeCached: 'सत्यापित स्थानीय दस्तावेज़',
    badgeUnmatched: 'कोई रिकॉर्ड नहीं मिला',
    latencyText: 'सुरक्षित सत्र सक्रिय',
    suggestions: [
      'पीएम किसान पात्रता (eligibility) क्या है?',
      'आयुष्मान भारत के लिए कौन पात्र है?',
      'आय प्रमाण पत्र (Income Certificate) कैसे बनवाएं?'
    ],
    errorMsg: 'क्षमा करें, अनुरोध पूरा करने में त्रुटि हुई। कृपया पुनः प्रयास करें।',
  },
  gu: {
    title: 'સુગમગવ AI',
    tagline: 'સુરક્ષિત માહિતી ભંડાર',
    subtitle: 'ઇન્ટેલિજન્ટ સરકારી સેવા સહાયક',
    welcomeTitle: 'સરકારી સેવાઓ,',
    welcomeSubTitleHighlight: 'એઆઈ દ્વારા સરળ.',
    welcomeSub: 'સરળ પ્રશ્નો પૂછીને સરકારી યોજનાઓ, પ્રમાણપત્રો અને સરકારી સેવાઓ શોધો. સુગમગવ AI સત્તાવાર સ્રોતોમાંથી માહિતી મેળવે છે અને તેને સ્પષ્ટ રીતે સમજાવે છે.',
    placeholder: 'સુગમગવ AI ને પ્રશ્ન પૂછો...',
    disclaimer: 'સુગમગવ AI માહિતી સહાય પૂરી પાડે છે અને વપરાશકર્તાઓએ લિંક કરેલ સત્તાવાર સરકારી સ્ત્રોત દ્વારા મહત્વપૂર્ણ વિગતોની ચકાસણી કરવી જોઈએ.',
    suggestedTitle: 'ત્વરિત પ્રશ્નો',
    sourceLabel: 'સત્યાપન સ્ત્રોત:',
    sourceLinkText: 'સત્તાવાર પોર્ટલ જુઓ',
    badgeLive: 'સત્તાવાર લાઈવ ચેક',
    badgeCached: 'ચકાસાયેલ સ્થાનિક નકલ',
    badgeUnmatched: 'કોઈ રેકોર્ડ મળ્યો નથી',
    latencyText: 'સુરક્ષિત સત્ર સક્રિય',
    suggestions: [
      'પીએમ કિસાન યોજના માટે પાત્રતા શું છે?',
      'આયુષ્માન ભારત યોજનાના શું લાભ છે?',
      'આવકનો દાખલો (Income Certificate) કઢાવવા માટે કયા કાગળો જોઈએ?'
    ],
    errorMsg: 'ભૂલ આવી છે. કૃપા કરીને પ્રશ્ન ફરીથી સબમિટ કરો.',
  }
};

const NAV_TEXT = {
  en: { home: 'Home', services: 'Government Services', howItWorks: 'How It Works', about: 'About' },
  hi: { home: 'होम', services: 'सरकारी सेवाएं', howItWorks: 'यह कैसे काम करता है', about: 'हमारे बारे में' },
  gu: { home: 'હોમ', services: 'સરકારી સેવાઓ', howItWorks: 'આ કેવી રીતે કામ કરે છે', about: 'અમારા વિશે' }
};

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'hi' | 'gu'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMatchedSourceId, setLastMatchedSourceId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const text = UI_TEXT[language];
  const nav = NAV_TEXT[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantMsgId = '';
    let dataReceived = false;
    let clientTimeout: any = null;

    try {
      clientTimeout = setTimeout(() => {
        if (!dataReceived) {
          console.warn('Client-side safety timeout reached (20 seconds of silence).');
          setIsLoading(false);
          
          if (assistantMsgId) {
            setMessages(prev => prev.map(m => m.id === assistantMsgId ? {
              ...m,
              text: text.errorMsg,
              isSupported: false
            } : m));
          } else {
            const errorMsg: Message = {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: text.errorMsg,
              isSupported: false
            };
            setMessages(prev => [...prev, errorMsg]);
          }
        }
      }, 20000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          language: language,
          lastMatchedSourceId: lastMatchedSourceId
        })
      });

      if (!response.ok) {
        let errorMsgText = text.errorMsg;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsgText = errData.error;
          }
        } catch (_) {}
        throw new Error(errorMsgText);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantMsgId,
        sender: 'assistant',
        text: '',
        sourceName: '',
        sourceUrl: '',
        isSupported: true
      };

      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            console.log('[STREAM CHUNK RECEIVED]:', line);

            dataReceived = true;
            if (clientTimeout) {
              clearTimeout(clientTimeout);
              clientTimeout = null;
            }

            const data = JSON.parse(line);

            if (data.type === 'metadata') {
              setMessages(prev => prev.map(m => m.id === assistantMsgId ? {
                ...m,
                sourceName: data.officialSource,
                sourceUrl: data.sourceUrl,
                retrievalMethod: data.retrievalMethod,
                isSupported: data.isSupported !== false
              } : m));

              if (data.serviceId) {
                setLastMatchedSourceId(data.serviceId);
              } else if (data.isSupported === false) {
                setLastMatchedSourceId(null);
              }
            } else if (data.type === 'chunk') {
              setMessages(prev => prev.map(m => m.id === assistantMsgId ? {
                ...m,
                text: m.text + data.text
              } : m));
            } else if (data.type === 'error') {
              setMessages(prev => prev.map(m => m.id === assistantMsgId ? {
                ...m,
                text: data.message,
                isSupported: false
              } : m));
            }
          } catch (jsonErr) {
            console.error('Error parsing stream line:', jsonErr);
          }
        }
      }
    } catch (error) {
      console.error('Chat interface error:', error);
      if (assistantMsgId) {
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? {
          ...m,
          text: (error as Error).message || text.errorMsg,
          isSupported: false
        } : m));
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: (error as Error).message || text.errorMsg,
          isSupported: false
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      if (clientTimeout) {
        clearTimeout(clientTimeout);
      }
      setIsLoading(false);
    }
  };

  const handleCardClick = (queryText: string) => {
    setInput(queryText);
    scrollToSection('chatbot-anchor');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100 selection:bg-blue-600/30 selection:text-white">
      {/* Tricolour Accent Strip */}
      <div className="h-[3px] w-full flex relative z-50">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-[#030712]/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Shield Logo & AI Badge */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black tracking-tight text-white uppercase">{text.title}</h1>
              <span className="text-[7px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1 py-0.2 rounded uppercase tracking-wider select-none">AI</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400">
            <button onClick={() => scrollToSection('home-anchor')} className="hover:text-white transition-colors">{nav.home}</button>
            <button onClick={() => scrollToSection('services-anchor')} className="hover:text-white transition-colors">{nav.services}</button>
            <button onClick={() => scrollToSection('works-anchor')} className="hover:text-white transition-colors">{nav.howItWorks}</button>
            <button onClick={() => scrollToSection('footer-anchor')} className="hover:text-white transition-colors">{nav.about}</button>
          </nav>

          {/* Right Selector Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-900/60 p-0.5 border border-slate-800">
              {(['en', 'hi', 'gu'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded px-2 py-0.8 text-[8px] font-extrabold tracking-wide transition-all ${
                    language === lang
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'ગુજ'}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollToSection('chatbot-anchor')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-extrabold text-[9px] tracking-wider uppercase hover:bg-blue-500 select-none active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              ASK SUGAMGOV
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
            >
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

        {/* Mobile menu anchors list */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-900 bg-[#030712] px-4 py-3 flex flex-col gap-2.5 text-xs font-bold text-slate-455">
            <button onClick={() => scrollToSection('home-anchor')} className="text-left py-2 border-b border-slate-900/50 hover:text-white">{nav.home}</button>
            <button onClick={() => scrollToSection('services-anchor')} className="text-left py-2 border-b border-slate-900/50 hover:text-white">{nav.services}</button>
            <button onClick={() => scrollToSection('works-anchor')} className="text-left py-2 border-b border-slate-900/50 hover:text-white">{nav.howItWorks}</button>
            <button onClick={() => scrollToSection('footer-anchor')} className="text-left py-2 hover:text-white">{nav.about}</button>
          </div>
        )}
      </header>

      {/* Main Container Viewport */}
      <main className="flex-1 w-full">
        {messages.length === 0 ? (
          /* Welcome Landing Sections Layout */
          <div id="home-anchor" className="flex flex-col">
            
            {/* HERO SECTION */}
            <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[70vh]">
              
              {/* Left Column Text details */}
              <div className="lg:col-span-7 text-left flex flex-col items-start">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 tracking-wider uppercase mb-4 select-none">
                  ● AI-POWERED GOVERNMENT SERVICE ASSISTANT
                </span>
                
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05] mb-5">
                  {text.welcomeTitle} <br />
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">{text.welcomeSubTitleHighlight}</span>
                </h2>
                
                <p className="text-xs sm:text-sm leading-relaxed text-slate-400 font-semibold mb-6 max-w-lg">
                  {text.welcomeSub}
                </p>

                <div className="flex flex-wrap gap-4 items-center">
                  <button
                    onClick={() => scrollToSection('chatbot-anchor')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-black text-[9px] tracking-wider uppercase hover:bg-blue-500 transition-all select-none active:scale-[0.98] cursor-pointer"
                  >
                    <span>ASK SUGAMGOV →</span>
                  </button>
                  <button
                    onClick={() => scrollToSection('services-anchor')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-black text-[9px] tracking-wider uppercase hover:bg-slate-850 hover:text-white transition-all select-none active:scale-[0.98] cursor-pointer"
                  >
                    <span>EXPLORE SERVICES</span>
                  </button>
                </div>
              </div>

              {/* Right Column visual preview card */}
              <div className="lg:col-span-5 w-full flex justify-center">
                <div className="relative w-full max-w-sm rounded-3xl border border-blue-500/20 bg-[#0a1020]/45 backdrop-blur-xl p-5 shadow-[0_0_50px_rgba(59,130,246,0.06)] overflow-hidden">
                  
                  {/* Glow layer backdrop */}
                  <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-blue-500 to-cyan-400 opacity-20 blur-xl z-0"></div>
                  
                  {/* Mock Window details */}
                  <div className="relative z-10">
                    {/* Header dots */}
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
                        <span className="text-[9px] font-black text-white ml-2 tracking-widest uppercase">SUGAMGOV AI</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-450 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Official Source Connected
                      </span>
                    </div>

                    {/* Chat bubbles preview dialogue */}
                    <div className="flex flex-col gap-4 text-xs font-semibold">
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] font-bold text-slate-500 uppercase mb-0.8">User</span>
                        <div className="bg-blue-600 text-white px-3.5 py-2.5 rounded-2xl max-w-[85%] leading-relaxed shadow-sm">
                          "How can I check PM Kisan information?"
                        </div>
                      </div>

                      <div className="flex flex-col items-start">
                        <span className="text-[7px] font-bold text-slate-455 uppercase mb-0.8">SUGAMGOV AI</span>
                        <div className="bg-[#11182c] border border-slate-800 text-slate-350 px-3.5 py-2.5 rounded-2xl max-w-[95%] leading-relaxed shadow-sm">
                          Here is the information available from the official PM Kisan source...
                          
                          {/* Verification footer preview */}
                          <div className="mt-3.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[7px] text-slate-500 uppercase tracking-widest font-black">
                            <span className="text-emerald-400 flex items-center gap-1">
                              ✓ OFFICIAL SOURCE
                            </span>
                            <span className="truncate max-w-[130px]">Ministry of Agriculture</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURE STRIP */}
            <section className="border-t border-b border-slate-900 bg-[#070b14]/75 py-4">
              <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 items-center justify-center text-center">
                  {[
                    { title: '✓ Official Government Sources', desc: 'Verified source content' },
                    { title: '✓ Source-Linked Answers', desc: 'Official links' },
                    { title: '✓ Multilingual Support', desc: 'English • Hindi • Gujarati' },
                    { title: '✓ AI-Assisted Information', desc: 'Government information simplified' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className="text-xs font-black text-white leading-tight">{item.title}</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* LATEST GOVERNMENT UPDATES */}
            <section id="updates-anchor" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 border-b border-slate-900/80">
              <div className="text-center mb-8 max-w-xl mx-auto">
                <span className="text-[9px] font-black tracking-[0.2em] text-blue-400 uppercase">Live Broadcasts</span>
                <h3 className="text-2xl font-black text-white mt-1">Latest Government Updates</h3>
                <p className="mt-2 text-xs text-slate-455 font-semibold">
                  Stay informed with important information from official government sources.
                </p>
              </div>

              <LatestGovernmentUpdates language={language} />
            </section>

            {/* QUICK QUESTIONS / CHATBOT ENTRY */}
            <section id="chatbot-anchor" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 text-center border-b border-slate-900/80">
              <div className="mb-8">
                <span className="text-[9px] font-black tracking-[0.2em] text-blue-400 uppercase">Interactive Terminal</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">Have a Government Service Question?</h3>
                <p className="mt-2.5 text-xs text-slate-455 font-semibold max-w-md mx-auto leading-relaxed">
                  Ask SugamGov AI in English, Hindi or Gujarati. Choose suggestions or type custom queries below.
                </p>
              </div>

              {/* Suggestions Quick Buttons */}
              <div className="mb-6 flex flex-col gap-2.5 max-w-xl mx-auto">
                {text.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="flex items-center justify-between rounded-xl border border-slate-850 bg-[#0d1527] p-3.5 text-left text-xs font-semibold tracking-wide text-slate-300 hover:border-blue-500/50 hover:bg-slate-900 transition-all duration-200 group active:scale-[0.99] cursor-pointer shadow-sm hover:shadow"
                  >
                    <span className="group-hover:text-blue-400 transition-colors">{suggestion}</span>
                    <svg className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Form Input Bar inline inside homepage grid */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="relative flex items-center shadow-2xl rounded-2xl bg-[#0d1527] border border-slate-855 p-1.5 focus-within:border-slate-700 transition-all max-w-xl mx-auto"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={text.placeholder}
                  disabled={isLoading}
                  className="w-full bg-transparent py-3 pl-3.5 pr-12 text-xs sm:text-sm text-white placeholder-slate-550 focus:outline-none disabled:opacity-50 font-semibold"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer shadow-sm transition-all"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>

              <p className="mt-4 text-[10px] leading-relaxed text-slate-500 px-4 font-semibold max-w-lg mx-auto">
                ⚠️ {text.disclaimer}
              </p>
            </section>

            {/* HOW IT WORKS */}
            <section id="works-anchor" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 border-b border-slate-900/80">
              <div className="text-center mb-8 max-w-xl mx-auto">
                <span className="text-[9px] font-black tracking-[0.2em] text-blue-400 uppercase">Process Blueprint</span>
                <h3 className="text-2xl font-black text-white mt-1">How SugamGov AI Works</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start relative mt-8">
                {[
                  {
                    num: '01',
                    stepName: 'ASK',
                    desc: 'Ask your question naturally.',
                    glow: 'border-blue-500/20 text-blue-400 bg-blue-500/5'
                  },
                  {
                    num: '02',
                    stepName: 'FIND',
                    desc: 'SugamGov identifies relevant government information and official sources.',
                    glow: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5'
                  },
                  {
                    num: '03',
                    stepName: 'UNDERSTAND',
                    desc: 'AI explains the information clearly and provides the official source.',
                    glow: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                  }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center px-4 relative z-10">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-base font-black ${step.glow} mb-4`}>
                      {step.num}
                    </div>
                    <h4 className="font-extrabold text-white text-xs tracking-wider">{step.stepName}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400 font-semibold">{step.desc}</p>
                  </div>
                ))}

                <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-[1px] bg-slate-800/80 z-0"></div>
              </div>
            </section>

            {/* GOVERNMENT SERVICES */}
            <section id="services-anchor" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
              <div className="text-center mb-8 max-w-xl mx-auto">
                <span className="text-[9px] font-black tracking-[0.2em] text-blue-400 uppercase">Information Catalogs</span>
                <h3 className="text-2xl font-black text-white mt-1">Government Services</h3>
                <p className="mt-2 text-xs text-slate-455 font-semibold">
                  Explore services currently supported by SugamGov AI.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'PM Kisan Samman Nidhi',
                    desc: 'Direct cash assistance of ₹6,000 yearly for cultivable landholding farmers.',
                    query: 'PM Kisan eligibility kya hai?',
                    icon: (
                      <svg className="h-5.5 w-5.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  },
                  {
                    title: 'Ayushman Bharat',
                    desc: 'Complete paperless health cover of ₹5 Lakh per year for diagnostic and hospital expenses.',
                    query: 'Ayushman Bharat eligibility?',
                    icon: (
                      <svg className="h-5.5 w-5.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )
                  },
                  {
                    title: 'Income Certificate',
                    desc: 'Comprehensive local revenue department criteria, mandatory document files, and application guidelines.',
                    query: 'How to apply for Income Certificate?',
                    icon: (
                      <svg className="h-5.5 w-5.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )
                  }
                ].map((scheme, i) => (
                  <div
                    key={i}
                    onClick={() => handleCardClick(scheme.query)}
                    className="flex flex-col rounded-2xl border border-slate-900 bg-[#0d1527] p-5 shadow-sm transition-all duration-300 hover:border-blue-500/35 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="mb-4 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
                      {scheme.icon}
                    </div>
                    <h4 className="font-extrabold text-white text-xs leading-none tracking-wide group-hover:text-blue-400 transition-colors">{scheme.title}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-455 font-semibold flex-grow">{scheme.desc}</p>
                    
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[9px] font-black text-blue-400 uppercase tracking-widest group-hover:text-cyan-400 transition-colors pt-3 border-t border-slate-900">
                      <span>ASK SUGAMGOV →</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        ) : (
          /* ACTIVE CHAT SCREEN VIEW (when messages exist) */
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-4 sm:p-6 justify-center">
            <AnimatedPage>
              <div className="flex flex-col gap-6 py-4">
                {messages.map((message) => {
                  const isAI = message.sender === 'assistant';
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex w-full flex-col ${isAI ? 'items-start' : 'items-end'}`}
                    >
                      {/* Message Meta Info */}
                      <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase px-1">
                        {isAI ? (
                          <>
                            <span className="text-blue-400">SugamGov Assistant</span>
                            <span className="text-slate-700">•</span>
                            <span>Verified Response</span>
                          </>
                        ) : (
                          <span>Citizen Query</span>
                        )}
                      </div>

                      {/* Chat Bubble Container */}
                      <div
                        className={`relative max-w-[85%] rounded-2xl p-4 text-sm border shadow-sm transition-all duration-300 ${
                          isAI
                            ? 'bg-[#0d1527] border-slate-850 text-slate-200'
                            : 'bg-blue-600 border-blue-700 text-white shadow-sm'
                        }`}
                      >
                        {/* Message Content */}
                        <div 
                          className="prose-answer leading-relaxed text-xs sm:text-sm font-medium tracking-wide"
                          dangerouslySetInnerHTML={{
                            __html: isAI 
                              ? message.text
                                  .replace(/\*\*(.*?)\*\//g, '<strong class="text-white font-extrabold">$1</strong>')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-extrabold">$1</strong>')
                                  .replace(/\n/g, '<br />')
                              : message.text.replace(/\n/g, '<br />')
                          }}
                        />

                        {/* Official Verification Certificate Footer */}
                        {isAI && message.sourceUrl && (
                          <div className="mt-4 pt-3.5 border-t border-slate-800 bg-[#10192e] -mx-4 -mb-4 px-4 py-3 rounded-b-2xl flex flex-col gap-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              {/* Verification Badge */}
                              <div className="flex items-center gap-1.5">
                                {message.retrievalMethod === 'live_fetch' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    {text.badgeLive}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-slate-900 text-slate-400 border border-slate-800">
                                    {text.badgeCached}
                                  </span>
                                )}
                              </div>

                              <a
                                href={message.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                              >
                                <span>{text.sourceLinkText}</span>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>

                            <div className="flex items-center gap-1.5 text-[9px] text-slate-550 font-bold uppercase tracking-wider truncate">
                              <svg className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span className="truncate">{message.sourceName}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Shimmer Response Loader */}
                {isLoading && (messages.length === 0 || messages[messages.length - 1].sender !== 'assistant') && (
                  <div className="flex w-full flex-col items-start">
                    <div className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase px-1">
                      SugamGov Assistant
                    </div>
                    <div className="w-[75%] max-w-[500px] rounded-2xl border border-slate-855 bg-[#0d1527] p-4 shadow-sm flex flex-col gap-2.5">
                      <div className="h-3 w-2/3 rounded bg-slate-850 animate-pulse"></div>
                      <div className="h-3 w-5/6 rounded bg-slate-850 animate-pulse"></div>
                      <div className="h-3 w-1/2 rounded bg-slate-850 animate-pulse"></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </AnimatedPage>

            {/* Chat View input form footer */}
            <div className="w-full mt-auto pt-4 border-t border-slate-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="relative flex items-center shadow-2xl rounded-2xl bg-[#0d1527] border border-slate-855 p-1.5 focus-within:border-slate-700 transition-all w-full"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={text.placeholder}
                  disabled={isLoading}
                  className="w-full bg-transparent py-3 pl-3.5 pr-12 text-xs sm:text-sm text-white placeholder-slate-550 focus:outline-none disabled:opacity-50 font-semibold"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer shadow-sm transition-all"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>

              <p className="mt-3 text-center text-[9px] leading-relaxed text-slate-550 px-4 font-semibold">
                ⚠️ {text.disclaimer}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer id="footer-anchor" className="border-t border-slate-950 bg-[#04070d] py-12 text-left mt-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Logo Description */}
          <div className="md:col-span-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h4 className="font-black text-white text-base leading-none">{text.title}</h4>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed max-w-xs font-semibold">
              AI-powered access to official government information. Sourced and verified dynamically.
            </p>
          </div>

          {/* Quick links block 1 */}
          <div className="md:col-span-2">
            <h5 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3.5 font-bold">Services</h5>
            <div className="flex flex-col gap-2.5 text-xs text-slate-450 font-semibold">
              <button onClick={() => handleCardClick('PM Kisan eligibility kya hai?')} className="text-left hover:text-white transition-colors">PM Kisan</button>
              <button onClick={() => handleCardClick('Ayushman Bharat eligibility?')} className="text-left hover:text-white transition-colors">Ayushman Bharat</button>
              <button onClick={() => handleCardClick('How to apply for Income Certificate?')} className="text-left hover:text-white transition-colors">Income Certificate</button>
            </div>
          </div>

          {/* Quick links block 2 */}
          <div className="md:col-span-2">
            <h5 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3.5 font-bold">Navigation</h5>
            <div className="flex flex-col gap-2.5 text-xs text-slate-450 font-semibold">
              <button onClick={() => scrollToSection('home-anchor')} className="text-left hover:text-white transition-colors">{nav.home}</button>
              <button onClick={() => scrollToSection('services-anchor')} className="text-left hover:text-white transition-colors">{nav.services}</button>
              <button onClick={() => scrollToSection('works-anchor')} className="text-left hover:text-white transition-colors">{nav.howItWorks}</button>
            </div>
          </div>

          {/* Quick links block 3 */}
          <div className="md:col-span-2">
            <h5 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3.5 font-bold">Official Sources</h5>
            <div className="flex flex-col gap-2.5 text-xs text-slate-450 font-semibold">
              <a href="https://pmkisan.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">PM Kisan</a>
              <a href="https://pmjay.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Ayushman Bharat</a>
              <a href="https://services.india.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">National Portal</a>
            </div>
          </div>
        </div>

        {/* Disclaimer footer strip */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-10 pt-6 border-t border-slate-900/80 text-center">
          <p className="text-[10px] leading-relaxed text-slate-500 font-semibold max-w-2xl mx-auto">
            Disclaimer: {text.disclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}
