export interface MultilingualText {
  en: string;
  hi: string;
  gu: string;
}

export interface GovernmentUpdate {
  id: string;
  title: MultilingualText;
  summary: MultilingualText;
  department: MultilingualText;
  date: string;
  sourceUrl: string;
  sourceName: string;
  category: 'pm_kisan' | 'ayushman_bharat' | 'income_certificate';
}

export const governmentUpdates: GovernmentUpdate[] = [
  {
    id: 'pm_kisan_18th',
    title: {
      en: 'Release of 18th Installment of PM-KISAN',
      hi: 'पीएम-किसान की 18वीं किस्त जारी',
      gu: 'પીએમ-કિસાનના 18મા હપ્તાની ચુકવણી'
    },
    summary: {
      en: 'The government has released the 18th installment of the PM Kisan Samman Nidhi scheme. Over 9.4 crore farmers received direct benefit transfers directly in their bank accounts.',
      hi: 'सरकार ने पीएम किसान सम्मान निधि योजना की 18वीं किस्त जारी कर दी है। देश के 9.4 करोड़ से अधिक किसानों को सीधे उनके बैंक खातों में राशि हस्तांतरित की गई।',
      gu: 'સરકાર દ્વારા પીએમ કિસાન સન્માન નિધિ યોજનાનો 18મો હપ્તો ચૂકવવામાં આવ્યો છે. દેશના 9.4 કરોડથી વધુ ખેડૂતોના બેંક ખાતામાં સીધા રૂપિયા જમા થયા છે.'
    },
    department: {
      en: 'Ministry of Agriculture and Farmers Welfare',
      hi: 'कृषि एवं किसान कल्याण मंत्रालय',
      gu: 'કૃષિ અને ખેડૂત કલ્યાણ મંત્રાલય'
    },
    date: '2024-10-05',
    sourceUrl: 'https://pmkisan.gov.in/',
    sourceName: 'PM-Kisan Portal',
    category: 'pm_kisan'
  },
  {
    id: 'ayushman_70_plus',
    title: {
      en: 'Expansion of AB-PMJAY to Senior Citizens Aged 70+',
      hi: '70 वर्ष से अधिक आयु के वरिष्ठ नागरिकों के लिए आयुष्मान योजना का विस्तार',
      gu: '70 વર્ષથી વધુ ઉંમરના વરિષ્ઠ નાગરિકો માટે આયુષ્માન યોજનાનો વિસ્તાર'
    },
    summary: {
      en: 'All senior citizens aged 70 years and above are now eligible for free health cover of up to ₹5 Lakh per year under PM-JAY. A new separate Ayushman Vay Vandana Card is being issued.',
      hi: '70 वर्ष और उससे अधिक आयु के सभी वरिष्ठ नागरिक अब पीएम-जय के तहत प्रति वर्ष ₹5 लाख तक के मुफ्त स्वास्थ्य कवर के पात्र हैं। एक नया अलग आयुष्मान वय वंदना कार्ड जारी किया जा रहा है।',
      gu: '70 વર્ષ કે તેથી વધુ ઉંમરના તમામ વરિષ્ઠ નાગરિકો હવે પીએમ-જય યોજના હેઠળ વાર્ષિક ₹5 લાખ સુધીના મફત સ્વાસ્થ્ય વીમા માટે પાત્ર છે. એક નવું આયુષ્માન વય વંદના કાર્ડ જાહેર કરવામાં આવ્યું છે.'
    },
    department: {
      en: 'National Health Authority',
      hi: 'राष्ट्रीय स्वास्थ्य प्राधिकरण',
      gu: 'રાષ્ટ્રીય સ્વાસ્થ્ય સત્તામંડળ'
    },
    date: '2024-10-29',
    sourceUrl: 'https://pmjay.gov.in/',
    sourceName: 'National Health Authority PMJAY Portal',
    category: 'ayushman_bharat'
  },
  {
    id: 'income_cert_single_window',
    title: {
      en: 'Unified e-District Service for Income Certificate',
      hi: 'आय प्रमाण पत्र के लिए एकीकृत ई-डिस्ट्रिक्ट सेवा',
      gu: 'આવકના દાખલા માટે સંકલિત ઇ-ડિસ્ટ્રિક્ટ સેવા'
    },
    summary: {
      en: 'State Revenue Departments have streamlined the Income Certificate issuance. Applications are now integrated with Mamlatdar/Tahsildar offices via single-window CSC counters.',
      hi: 'राज्य राजस्व विभागों ने आय प्रमाण पत्र जारी करने की प्रक्रिया को सरल बना दिया है। आवेदन अब एकल-खिड़की सीएससी काउंटरों के माध्यम से तहसीलदार कार्यालयों के साथ एकीकृत हैं।',
      gu: 'રાજ્યના મહેસૂલ વિભાગો દ્વારા આવકનું પ્રમાણપત્ર મેળવવાની પ્રક્રિયા સરળ કરાઈ છે. હવે સિંગલ-વિન્ડો સીએસસી કાઉન્ટર્સ દ્વારા મામલતદાર કચેરી સાથે અરજીઓ સંકલિત કરવામાં આવી છે.'
    },
    department: {
      en: 'Ministry of Electronics & Information Technology / Department of Revenue',
      hi: 'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय / राजस्व विभाग',
      gu: 'ઇલેક્ટ્રોનિક્સ અને ઇન્ફોર્મેશન ટેકનોલોજી મંત્રાલય / મહેસૂલ વિભાગ'
    },
    date: '2025-01-10',
    sourceUrl: 'https://services.india.gov.in/',
    sourceName: 'National Government Services Portal',
    category: 'income_certificate'
  }
];
