'use client';

import React, { useState, useRef, useEffect } from 'react';
import AnimatedPage from '@/components/AnimatedPage';

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
    welcomeTitle: 'How can I assist you today?',
    welcomeSub: 'Ask questions in natural language. SugamGov AI extracts factual answers dynamically from official government portals.',
    placeholder: 'Type your question (e.g., PM Kisan eligibility)...',
    disclaimer: 'Information is retrieved dynamically from verified government domains. Please double-check details before formal applications.',
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
    welcomeTitle: 'मैं आपकी क्या सहायता कर सकता हूँ?',
    welcomeSub: 'आधिकारिक सरकारी पोर्टलों से सीधे और सत्यापित रूप से जानकारी प्राप्त करने के लिए अपनी मातृभाषा में प्रश्न पूछें।',
    placeholder: 'अपना प्रश्न लिखें (जैसे, पीएम किसान पात्रता)...',
    disclaimer: 'यह जानकारी आधिकारिक स्रोतों से गतिशील रूप से ली गई है। कृपया आवेदन से पहले आधिकारिक सरकारी पोर्टल पर सत्यापन कर लें।',
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
    welcomeTitle: 'હું તમારી શું મદદ કરી શકું?',
    welcomeSub: 'સરળ ભાષામાં પ્રશ્નો પૂછો. સુગમગવ AI સત્તાવાર સરકારી પોર્ટલ પરથી ચકાસાયેલ માહિતી સીધી તમારા સુધી લાવે છે.',
    placeholder: 'તમારો પ્રશ્ન લખો (દા.ત., પીએમ કિસાન પાત્રતા)...',
    disclaimer: 'માહિતી સત્તાવાર સરકારી સ્ત્રોતોમાંથી મેળવેલી છે. અરજી કરતા પહેલા કૃપા કરીને સત્તાવાર પોર્ટલ પર વિગતો ચકાસી લો.',
    suggestedTitle: 'ત્વરિત પ્રશ્નો',
    sourceLabel: 'સત્યાપન સ્ત્રોત:',
    sourceLinkText: 'સત્તાવાર પોર્ટલ જુઓ',
    badgeLive: 'સત્તાવાર લાઈવ ચેક',
    badgeCached: 'ચકાસાયેલ સ્થાનિક નકલ',
    badgeUnmatched: 'કોઈ રેકોર્ડ મળ્યો નથી',
    latencyText: 'સુરક્ષित સત્ર સક્રિય',
    suggestions: [
      'પીએમ કિસાન યોજના માટે પાત્રતા શું છે?',
      'આયુષ્માન ભારત યોજનાના શું લાભ છે?',
      'આવકનો દાખલો (Income Certificate) કઢાવવા માટે કયા કાગળો જોઈએ?'
    ],
    errorMsg: 'ભૂલ આવી છે. કૃપા કરીને પ્રશ્ન ફરીથી સબમિટ કરો.',
  }
};

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'hi' | 'gu'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMatchedSourceId, setLastMatchedSourceId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const text = UI_TEXT[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
      // Set client-side safety timeout (20 seconds)
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
        text: '', // Start empty
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
        
        // Save the last partial line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            // Log response line to browser console
            console.log('[STREAM CHUNK RECEIVED]:', line);

            // Mark data as received and clear safety timeout
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
      
      // If assistant bubble was already created, update it; otherwise append a new one
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

  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-[#f8fafc] selection:bg-blue-500/30 selection:text-white">
      {/* Tricolour Accent Strip (Ultra thin glowing header) */}
      <div className="h-[3px] w-full flex shadow-[0_2px_10px_rgba(251,146,60,0.15)]">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-white/80"></div>
        <div className="w-1/3 bg-[#10b981]"></div>
      </div>

      {/* Futuristic Floating Glass Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Holographic Logo Shield */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-900/40 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {/* Pulsing indicator core */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-[0.2em] text-orange-400/80 uppercase">{text.tagline}</span>
              </div>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                {text.title}
                <span className="text-[10px] font-semibold text-blue-400/80 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded">R2-PRO</span>
              </h1>
            </div>
          </div>

          {/* Secure State Indicator & Language Selector */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 status-dot-active"></span>
              <span className="font-semibold tracking-wider uppercase text-[10px] text-slate-400/80">{text.latencyText}</span>
            </div>
            
            <div className="flex items-center gap-1 rounded-xl bg-slate-900/60 p-1 border border-slate-800">
              {(['en', 'hi', 'gu'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
                    language === lang
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10 border border-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'ગુજ'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 sm:p-6 justify-center">
        <AnimatedPage>
          {messages.length === 0 ? (
            /* Welcome / Landing Screen - Futuristic Grid */
            <div className="flex flex-col items-center justify-center py-8 text-center">
              
              {/* Ambient Glowing Logo Wrapper */}
              <div className="relative mb-6">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-blue-500 to-orange-400 opacity-20 blur-xl"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/80 border border-slate-800/80 text-blue-400 shadow-xl">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096L9 21zm0 0h1m-1 0H8m6.813-5.096L15 21m0 0l-.813-5.096L15 21zm0 0h1m-1 0h-1m-4.707-3.293a1 1 0 00-1.414 1.414l3.586 3.586a1 1 0 001.414 0l3.586-3.586a1 1 0 00-1.414-1.414L12 14.586l-1.414-1.414z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v11.5" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {text.welcomeTitle}
              </h2>
              <p className="mt-2.5 max-w-lg text-sm text-slate-400">
                {text.welcomeSub}
              </p>

              {/* Supported Schemes Cards (Highly Styled Glass Cards) */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 w-full max-w-3xl">
                {[
                  {
                    title: 'PM Kisan Samman',
                    desc: 'Direct cash assistance of ₹6,000 yearly for cultivable landholding farmers.',
                    icon: (
                      <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    borderGlow: 'hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(251,146,60,0.06)]'
                  },
                  {
                    title: 'Ayushman Bharat',
                    desc: 'Complete paperless health cover of ₹5 Lakh per year for diagnostic and hospital expenses.',
                    icon: (
                      <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    borderGlow: 'hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                  },
                  {
                    title: 'Income Certificate',
                    desc: 'Comprehensive local revenue department criteria, mandatory document files, and application guidelines.',
                    icon: (
                      <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    borderGlow: 'hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.06)]'
                  }
                ].map((scheme, i) => (
                  <div
                    key={i}
                    className={`flex flex-col rounded-2xl border border-slate-800 bg-[#0f172a]/30 backdrop-blur-md p-5 text-left shadow-md transition-all duration-300 ${scheme.borderGlow}`}
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
                      {scheme.icon}
                    </div>
                    <h3 className="font-bold text-white tracking-wide text-sm">{scheme.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{scheme.desc}</p>
                  </div>
                ))}
              </div>

              {/* Suggestions Section */}
              <div className="mt-10 w-full max-w-xl text-left">
                <h3 className="text-[10px] font-black tracking-[0.15em] text-slate-500 uppercase">
                  {text.suggestedTitle}
                </h3>
                <div className="mt-3 flex flex-col gap-2">
                  {text.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(suggestion)}
                      className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-[#0f172a]/45 p-3.5 text-left text-xs font-semibold tracking-wide text-slate-300 hover:border-blue-500/60 hover:bg-slate-900/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-200 group active:scale-[0.99] cursor-pointer"
                    >
                      <span className="group-hover:text-white transition-colors">{suggestion}</span>
                      <svg className="h-4 w-4 text-slate-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat Interface rendering */
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
                          <span className="text-slate-600">•</span>
                          <span>Verified Response</span>
                        </>
                      ) : (
                        <span>Citizen Query</span>
                      )}
                    </div>

                    {/* Chat Bubble Container */}
                    <div
                      className={`relative max-w-[85%] rounded-2xl p-4 text-sm border shadow-md transition-all duration-300 ${
                        isAI
                          ? 'chat-bubble-ai text-slate-200'
                          : 'chat-bubble-user text-white'
                      }`}
                    >
                      {/* Message Content */}
                      <div 
                        className="prose-answer leading-relaxed text-xs sm:text-sm font-medium tracking-wide"
                        dangerouslySetInnerHTML={{
                          __html: message.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-extrabold">$1</strong>')
                            .replace(/\n/g, '<br />')
                        }}
                      />

                      {/* Official Verification Certificate Footer */}
                      {isAI && message.sourceUrl && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {/* Verification Badge */}
                            <div className="flex items-center gap-1.5">
                              {message.retrievalMethod === 'live_fetch' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                  {text.badgeLive}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
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

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold truncate">
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
                  <div className="w-[75%] max-w-[500px] rounded-2xl border border-slate-800 bg-[#0f172a]/30 backdrop-blur-md p-4 shadow-sm flex flex-col gap-2.5">
                    <div className="h-3 w-2/3 rounded-md shimmer-bg"></div>
                    <div className="h-3 w-5/6 rounded-md shimmer-bg"></div>
                    <div className="h-3 w-1/2 rounded-md shimmer-bg"></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatedPage>
      </main>

      {/* Floating Action Input Bar & Legal Disclaimer */}
      <footer className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 mt-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-center shadow-lg rounded-2xl bg-slate-950/60 border border-slate-800 p-1 backdrop-blur-md focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={text.placeholder}
            disabled={isLoading}
            className="w-full bg-transparent py-3 pl-3.5 pr-12 text-xs sm:text-sm text-[#f8fafc] placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

        <p className="mt-3.5 text-center text-[10px] leading-relaxed text-slate-500 px-4 font-medium">
          ⚠️ {text.disclaimer}
        </p>
      </footer>
    </div>
  );
}
