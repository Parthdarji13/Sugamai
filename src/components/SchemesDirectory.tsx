'use client';

import React from 'react';
import { Language } from '@/types/chat';

interface SchemesDirectoryProps {
  language: Language;
  onSelectScheme: (query: string) => void;
}

const SCHEMES_TEXT = {
  en: {
    tag: 'CITIZEN SERVICES DIRECTORY',
    title: 'Popular Welfare Schemes',
    subtitle: 'Explore key citizen schemes with verified guidelines and instant AI guidance',
    askAiBtn: 'Ask AI Guide',
    visitPortal: 'Official Portal',
    schemes: [
      {
        id: 'pm_kisan',
        title: 'PM Kisan Samman Nidhi',
        dept: 'Ministry of Agriculture & Farmers Welfare',
        tag: 'Agriculture',
        highlight: '₹6,000 / Year',
        desc: 'Direct financial benefit transfer in 3 equal installments of ₹2,000 to all eligible landholding farmer families across India.',
        query: 'What is the eligibility criteria, required documents, and application process for PM Kisan Samman Nidhi?',
        url: 'https://pmkisan.gov.in/',
      },
      {
        id: 'ayushman_bharat',
        title: 'Ayushman Bharat (AB-PMJAY)',
        dept: 'National Health Authority',
        tag: 'Healthcare',
        highlight: '₹5,00,000 / Year',
        desc: 'World’s largest health assurance scheme providing cashless hospital coverage up to ₹5 Lakh per family. Now covers all senior citizens 70+.',
        query: 'Who is eligible for Ayushman Bharat PM-JAY and how can senior citizens aged 70+ get the Ayushman Vay Vandana Card?',
        url: 'https://pmjay.gov.in/',
      },
      {
        id: 'income_cert',
        title: 'Income & Caste Certificates',
        dept: 'Department of Revenue / e-District',
        tag: 'Certificates',
        highlight: 'Single-Window CSC',
        desc: 'Official certificate for citizen income & category proof required for government subsidies, educational scholarships, and fee concessions.',
        query: 'How to apply for an official Income Certificate, what documents are required, and what is the issuing authority?',
        url: 'https://services.india.gov.in/',
      },
      {
        id: 'pmay_g',
        title: 'PM Awas Yojana (Gramin)',
        dept: 'Ministry of Rural Development',
        tag: 'Housing',
        highlight: 'Up to ₹1.3 Lakh Assistance',
        desc: 'Financial assistance for construction of pucca homes with basic amenities for homeless and families living in kutcha or dilapidated houses.',
        query: 'What is the eligibility criteria and DBT assistance amount under PM Awas Yojana Gramin?',
        url: 'https://pmayg.nic.in/',
      },
    ],
  },
  hi: {
    tag: 'नागरिक सेवा निर्देशिका',
    title: 'प्रमुख सरकारी योजनाएं',
    subtitle: 'सत्यापित सरकारी योजनाओं की जानकारी प्राप्त करें और सीधे AI सहायक से पूछें',
    askAiBtn: 'AI से पूछें',
    visitPortal: 'आधिकारिक पोर्टल',
    schemes: [
      {
        id: 'pm_kisan',
        title: 'पीएम किसान सम्मान निधि',
        dept: 'कृषि एवं किसान कल्याण मंत्रालय',
        tag: 'कृषि कल्याण',
        highlight: '₹6,000 / वर्ष',
        desc: 'देश के सभी पात्र भूमिधारक किसान परिवारों को ₹2,000 की 3 समान किस्तों में प्रति वर्ष ₹6,000 का सीधा वित्तीय लाभ अंतरण (DBT)।',
        query: 'पीएम किसान सम्मान निधि के लिए पात्रता, आवश्यक दस्तावेज और आवेदन प्रक्रिया क्या है?',
        url: 'https://pmkisan.gov.in/',
      },
      {
        id: 'ayushman_bharat',
        title: 'आयुष्मान भारत (AB-PMJAY)',
        dept: 'राष्ट्रीय स्वास्थ्य प्राधिकरण',
        tag: 'स्वास्थ्य सुरक्षा',
        highlight: '₹5,00,000 / वर्ष',
        desc: 'प्रति परिवार प्रति वर्ष ₹5 लाख तक का कैशलेस स्वास्थ्य बीमा। अब 70 वर्ष या उससे अधिक आयु के सभी वरिष्ठ नागरिकों के लिए भी उपलब्ध।',
        query: 'आयुष्मान भारत योजना के नियम क्या हैं और 70 वर्ष से अधिक आयु के बुजुर्गों के लिए आयुष्मान वय वंदना कार्ड कैसे बनवाएं?',
        url: 'https://pmjay.gov.in/',
      },
      {
        id: 'income_cert',
        title: 'आय एवं जाति प्रमाण पत्र',
        dept: 'राजस्व विभाग / ई-डिस्ट्रिक्ट',
        tag: 'नागरिक प्रमाण पत्र',
        highlight: 'एकल खिड़की सीएससी',
        desc: 'सरकारी छात्रवृत्ति, रियायतों और कल्याणकारी योजनाओं का लाभ उठाने के लिए आवश्यक आधिकारिक वार्षिक आय व श्रेणी प्रमाण पत्र।',
        query: 'आय प्रमाण पत्र (Income Certificate) कैसे बनवाएं, इसके लिए कौन-कौन से दस्तावेज चाहिए?',
        url: 'https://services.india.gov.in/',
      },
      {
        id: 'pmay_g',
        title: 'पीएम आवास योजना (ग्रामीण)',
        dept: 'ग्रामीण विकास मंत्रालय',
        tag: 'आवास कल्याण',
        highlight: '₹1.3 लाख तक सहायता',
        desc: 'बेघर और कच्चे मकानों में रहने वाले परिवारों के लिए पक्के मकान के निर्माण हेतु सीधी वित्तीय सहायता और बुनियादी सुविधाएं।',
        query: 'पीएम आवास योजना ग्रामीण की पात्रता नियम और आवेदन की प्रक्रिया क्या है?',
        url: 'https://pmayg.nic.in/',
      },
    ],
  },
  gu: {
    tag: 'નાગરિક સેવા ડિરેક્ટરી',
    title: 'મુખ્ય સરકારી યોજનાઓ',
    subtitle: 'ચકાસાયેલ સરકારી યોજનાઓની માહિતી મેળવો અને સીધા AI સહાયકને પ્રશ્ન પૂછો',
    askAiBtn: 'AI સહાયકને પૂછો',
    visitPortal: 'સત્તાવાર પોર્ટલ',
    schemes: [
      {
        id: 'pm_kisan',
        title: 'પીએમ કિસાન સન્માન નિધિ',
        dept: 'કૃષિ અને ખેડૂત કલ્યાણ મંત્રાલય',
        tag: 'ખેતી કલ્યાણ',
        highlight: '₹6,000 / વર્ષ',
        desc: 'દેશના તમામ પાત્ર જમીનધારક ખેડૂત પરિવારોને વાર્ષિક ₹2,000 ના 3 સમાન હપ્તામાં ₹6,000 ની સીધી નાણાકીય સહાય (DBT).',
        query: 'પીએમ કિસાન યોજનાની પાત્રતા, જરૂરી દસ્તાવેજો અને અરજી પ્રક્રિયા શું છે?',
        url: 'https://pmkisan.gov.in/',
      },
      {
        id: 'ayushman_bharat',
        title: 'આયુષ્માન ભારત (AB-PMJAY)',
        dept: 'રાષ્ટ્રીય સ્વાસ્થ્ય સત્તામંડળ',
        tag: 'આરોગ્ય સુરક્ષા',
        highlight: '₹5,00,000 / વર્ષ',
        desc: 'પરિવાર દીઠ વાર્ષિક ₹5 લાખ સુધીની મફત કેશલેસ હોસ્પિટલ સારવાર. હવે 70 કે તેથી વધુ વયના તમામ વરિષ્ઠ નાગરિકો માટે પણ ઉપલબ્ધ.',
        query: 'આયુષ્માન ભારત યોજનાના નિયમો શું છે અને 70 વર્ષથી વધુ વયના વરિષ્ઠ નાગરિકો માટે આયુષ્માન વય વંદના કાર્ડ કેવી રીતે બનાવવું?',
        url: 'https://pmjay.gov.in/',
      },
      {
        id: 'income_cert',
        title: 'આવક અને જાતિના દાખલા',
        dept: 'મહેસૂલ વિભાગ / ઈ-ડિસ્ટ્રિક્ટ',
        tag: 'નાગરિક પ્રમાણપત્ર',
        highlight: 'સિંગલ વિન્ડો CSC',
        desc: 'સરકારી સ્કોલરશિપ, ફી માફી અને સહાય યોજનાઓ માટે જરૂરી સત્તાવાર વાર્ષિક આવકનું પ્રમાણપત્ર.',
        query: 'આવકનો દાખલો (Income Certificate) કઢાવવા માટે કયા દસ્તાવેજો જોઈએ અને તેની પ્રક્રિયા શું છે?',
        url: 'https://services.india.gov.in/',
      },
      {
        id: 'pmay_g',
        title: 'પીએમ આવાસ યોજના (ગ્રામીણ)',
        dept: 'ગ્રામીણ વિકાસ મંત્રાલય',
        tag: 'આવાસ યોજના',
        highlight: '₹1.3 લાખ સુધી સહાય',
        desc: 'કાચા કે જર્જરિત મકાનમાં રહેતા પરિવારોને પાકા ઘરના નિર્માણ માટે સીધી નાણાકીય સહાય અને સુવિધાઓ.',
        query: 'પીએમ આવાસ યોજના ગ્રામીણ હેઠળ મકાન સહાય મેળવવા માટેની પાત્રતા શું છે?',
        url: 'https://pmayg.nic.in/',
      },
    ],
  },
};

export default function SchemesDirectory({ language, onSelectScheme }: SchemesDirectoryProps) {
  const text = SCHEMES_TEXT[language] || SCHEMES_TEXT.en;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="mb-8 flex flex-col justify-between gap-2 border-b pb-6 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
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

      {/* Grid of Scheme Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {text.schemes.map((scheme) => (
          <div
            key={scheme.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:border-[rgba(59,130,246,0.5)] hover:shadow-xl hover:-translate-y-1"
            style={{
              background: 'linear-gradient(145deg, rgba(16,19,26,0.95) 0%, rgba(12,14,21,0.98) 100%)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Top row: Category tag + Highlight Badge */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {scheme.tag}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-tight"
                  style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)' }}
                >
                  {scheme.highlight}
                </span>
              </div>

              {/* Title & Dept */}
              <h4 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-[var(--accent)] transition-colors">
                {scheme.title}
              </h4>
              <p className="mt-1 text-[11px] font-medium text-[var(--text-muted)] line-clamp-1" title={scheme.dept}>
                {scheme.dept}
              </p>

              {/* Description */}
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                {scheme.desc}
              </p>
            </div>

            {/* Bottom Actions: 1-Click Ask AI + Official Portal Link */}
            <div className="mt-5 pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => onSelectScheme(scheme.query)}
                className="btn-press flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                title={scheme.query}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <span>{text.askAiBtn}</span>
              </button>

              <a
                href={scheme.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-white transition-colors"
                title={`${text.visitPortal}: ${scheme.url}`}
              >
                <span>{text.visitPortal}</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
