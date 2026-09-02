'use client';

import React, { useState } from 'react';
import { Language } from '@/types/chat';

interface HelplineDirectoryProps {
  language: Language;
}

const HELPLINE_TEXT = {
  en: {
    tag: 'OFFICIAL ASSISTANCE & EMERGENCIES',
    title: 'Verified Citizen Helplines',
    subtitle: 'Official 24x7 toll-free government hotlines for immediate citizen support',
    callNow: 'Call Hotline',
    copied: 'Copied!',
    copyNumber: 'Copy',
    helplines: [
      {
        id: 'ayushman',
        name: 'AB-PMJAY Health Helpline',
        number: '14555',
        dept: 'National Health Authority',
        hours: '24x7 Toll-Free',
        desc: 'Emergency assistance for hospital admissions, Ayushman Card verification, and scheme eligibility inquiries.',
      },
      {
        id: 'pm_kisan',
        name: 'PM-Kisan Farmer Call Centre',
        number: '155261',
        dept: 'Ministry of Agriculture',
        hours: 'Toll-Free',
        desc: 'Direct citizen support for DBT installment tracking, e-KYC validation, and beneficiary status verification.',
      },
      {
        id: 'cyber',
        name: 'National Cyber Crime & Fraud',
        number: '1930',
        dept: 'Ministry of Home Affairs / I4C',
        hours: '24x7 Emergency',
        desc: 'Immediate reporting of financial fraud, unauthorised UPI/banking deductions, and digital security threats.',
      },
      {
        id: 'consumer',
        name: 'National Consumer Grievance',
        number: '1915',
        dept: 'Ministry of Consumer Affairs',
        hours: 'National Helpline',
        desc: 'Official portal for filing consumer complaints against unfair trade practices, e-commerce, and public service disputes.',
      },
    ],
  },
  hi: {
    tag: 'आधिकारिक सहायता एवं आपातकालीन सेवा',
    title: 'सत्यापित नागरिक हेल्पलाइन',
    subtitle: 'तत्काल नागरिक सहायता के लिए आधिकारिक 24x7 टोल-फ्री सरकारी हेल्पलाइन नंबर',
    callNow: 'कॉल करें',
    copied: 'कॉपी हो गया!',
    copyNumber: 'कॉपी',
    helplines: [
      {
        id: 'ayushman',
        name: 'आयुष्मान भारत स्वास्थ्य हेल्पलाइन',
        number: '14555',
        dept: 'राष्ट्रीय स्वास्थ्य प्राधिकरण',
        hours: '24x7 टोल-फ्री',
        desc: 'अस्पताल में भर्ती, आयुष्मान कार्ड सत्यापन और योजना पात्रता के लिए 24 घंटे उपलब्ध सहायता।',
      },
      {
        id: 'pm_kisan',
        name: 'पीएम किसान कॉल सेंटर',
        number: '155261',
        dept: 'कृषि एवं किसान कल्याण मंत्रालय',
        hours: 'टोल-फ्री',
        desc: 'डीबीटी किस्त की स्थिति, ई-केवाईसी सत्यापन और लाभार्थी पंजीकरण में सहायता हेतु।',
      },
      {
        id: 'cyber',
        name: 'राष्ट्रीय साइबर वित्तीय अपराध हेल्पलाइन',
        number: '1930',
        dept: 'गृह मंत्रालय / आई4सी',
        hours: '24x7 आपातकालीन',
        desc: 'ऑनलाइन बैंकिंग धोखाधड़ी, अनधिकृत यूपीआई लेन-देन और वित्तीय साइबर अपराधों की तत्काल रिपोर्टिंग।',
      },
      {
        id: 'consumer',
        name: 'राष्ट्रीय उपभोक्ता हेल्पलाइन',
        number: '1915',
        dept: 'उपभोक्ता मामले मंत्रालय',
        hours: 'राष्ट्रीय हेल्पलाइन',
        desc: 'अनुचित व्यापार प्रथाओं, सेवा में कमी और उपभोक्ता अधिकारों के संरक्षण के लिए आधिकारिक शिकायत निवारण।',
      },
    ],
  },
  gu: {
    tag: 'સત્તાવાર સહાય અને ઇમરજન્સી',
    title: 'ચકાસાયેલ નાગરિક હેલ્પલાઇન',
    subtitle: 'તાત્કાલિક નાગરિક સહાય માટે સત્તાવાર 24x7 ટોલ-ફ્રી સરકારી હેલ્પલાઇન નંબર્સ',
    callNow: 'કૉલ કરો',
    copied: 'કૉપિ થઈ ગયું!',
    copyNumber: 'કૉપિ',
    helplines: [
      {
        id: 'ayushman',
        name: 'આયુષ્માન ભારત આરોગ્ય હેલ્પલાઇન',
        number: '14555',
        dept: 'રાષ્ટ્રીય સ્વાસ્થ્ય સત્તામંડળ',
        hours: '24x7 ટોલ-ફ્રી',
        desc: 'હોસ્પિટલમાં દાખલ થવા, આયુષ્માન કાર્ડ ચકાસણી અને યોજનાની પાત્રતા સંબંધી તાત્કાલિક સહાય.',
      },
      {
        id: 'pm_kisan',
        name: 'પીએમ કિસાન કૉલ સેન્ટર',
        number: '155261',
        dept: 'કૃષિ અને ખેડૂત કલ્યાણ મંત્રાલય',
        hours: 'ટોલ-ફ્રી',
        desc: 'ડીબીટી હપ્તાની સ્થિતિ, ઈ-કેવાયસી અને લાભાર્થી નોંધણી સહાય માટે સત્તાવાર કૉલ સેન્ટર.',
      },
      {
        id: 'cyber',
        name: 'નેશનલ સાયબર ક્રાઈમ હેલ્પલાઇન',
        number: '1930',
        dept: 'ગૃહ મંત્રાલય / I4C',
        hours: '24x7 ઇમરજન્સી',
        desc: 'ઓનલાઇન બેંકિંગ ફ્રોડ, અજાણ્યા યુપીઆઇ ટ્રાન્ઝેક્શન અને સાયબર છેતરપિંડીની ત્વરિત ફરિયાદ.',
      },
      {
        id: 'consumer',
        name: 'રાષ્ટ્રીય ગ્રાહક હેલ્પલાઇન',
        number: '1915',
        dept: 'ગ્રાહક બાબતોનું મંત્રાલય',
        hours: 'રાષ્ટ્રીય હેલ્પલાઇન',
        desc: 'અયોગ્ય વેપાર પદ્ધતિઓ અને જાહેર સેવાઓમાં છેતરપિંડી સામે ગ્રાહક ફરિયાદ નિવારણ.',
      },
    ],
  },
};

export default function HelplineDirectory({ language }: HelplineDirectoryProps) {
  const text = HELPLINE_TEXT[language] || HELPLINE_TEXT.en;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="mb-8 flex flex-col justify-between gap-2 border-b pb-6 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
            >
              <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: '#f87171' }} />
              {text.tag}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {text.title}
          </h3>
          <p className="mt-1 text-xs font-medium text-[var(--text-secondary)] sm:text-sm">
            {text.subtitle}
          </p>
        </div>
      </div>

      {/* Grid of Helplines */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {text.helplines.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:border-[rgba(59,130,246,0.5)] hover:shadow-xl"
            style={{
              background: 'linear-gradient(145deg, rgba(16,19,26,0.95) 0%, rgba(12,14,21,0.98) 100%)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              {/* Header: Dept & Hours */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate max-w-[130px]" title={item.dept}>
                  {item.dept}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tracking-tight text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                >
                  {item.hours}
                </span>
              </div>

              {/* Helpline Name */}
              <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                {item.name}
              </h4>

              {/* Big Phone Number Badge */}
              <div className="my-3 flex items-center justify-between rounded-xl border p-2.5" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <span className="font-mono text-base font-extrabold text-white tracking-wider">
                    {item.number}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(item.id, item.number)}
                  className="rounded px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                  title="Copy number"
                >
                  {copiedId === item.id ? text.copied : text.copyNumber}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                {item.desc}
              </p>
            </div>

            {/* Bottom: Click to Call */}
            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <a
                href={`tel:${item.number}`}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all text-white hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>{text.callNow}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
