import path from 'path';

export interface GovernmentSource {
  id: string;
  name: string;
  officialUrl: string;
  alternateUrls?: string[];
  sourceTitle: string;
  cachedFileName: string;
  aliases?: string[];
  keywords: string[];
}

export const governmentSources: GovernmentSource[] = [
  {
    id: 'pm_kisan',
    name: 'PM Kisan Samman Nidhi',
    officialUrl: 'https://pmkisan.gov.in/',
    sourceTitle: 'PM-Kisan Portal - Ministry of Agriculture & Farmers Welfare',
    cachedFileName: 'pm_kisan.txt',
    aliases: [
      // English & Transliterated
      'pm kisan', 'pmkisan', 'pm-kisan', 'pm kisan samman nidhi', 'kisan samman nidhi',
      'farmer scheme', 'farmer money scheme', 'kisan yojana', 'kisan paisa', 'farmer paisa', 'kisan scheme',
      // Hindi
      'पीएम किसान', 'किसान सम्मान निधि', 'प्रधानमंत्री किसान योजना', 'किसान योजना', 'किसान पैसा',
      // Gujarati
      'પીએમ કિસાન', 'કિસાન સન્માન નિધિ', 'ખેડૂત યોજના', 'ખેડૂત પૈસા'
    ],
    keywords: [
      'pm kisan', 'pm-kisan', 'kisan', 'farmer', 'installment', 'exclude', 'exclusion', 'landholding', 'cultivable land', 'rs 6000', 'rs 2000',
      'किसान', 'पीएम किसान', 'किस्त', 'जमीन', 'खेती', 'अपात्र',
      'ખેડૂત', 'પીએમ કિસાન', 'હપ્તો', 'જમીન', 'ખેતી', 'અપાત્ર'
    ]
  },
  {
    id: 'ayushman_bharat',
    name: 'Ayushman Bharat (AB-PMJAY)',
    officialUrl: 'https://pmjay.gov.in/',
    alternateUrls: ['https://nha.gov.in/'],
    sourceTitle: 'National Health Authority - Ayushman Bharat Portal',
    cachedFileName: 'ayushman_bharat.txt',
    aliases: [
      // English & Transliterated
      'ayushman bharat', 'ayushman', 'pmjay', 'pm-jay', 'pm jay', 'health card', 'ayushman card',
      '5 lakh treatment', 'health insurance scheme', 'medical cover', 'ayushman yojana',
      // Hindi
      'आयुष्मान भारत', 'आयुष्मान', 'आयुष्मान कार्ड', 'स्वास्थ्य कार्ड', '५ लाख इलाज', 'आयुष्मान योजना',
      // Gujarati
      'આયુષ્માન ભારત', 'આયુષ્માન', 'આયુષ્માન કાર્ડ', 'સ્વાસ્થ્ય વીમો'
    ],
    keywords: [
      'ayushman bharat', 'ayushman', 'pmjay', 'pm-jay', 'health cover', 'insurance', 'hospital', 'card', '5 lakh', 'five lakh', 'medical', 'deprivation', 'rural', 'urban', 'secc', 'treatment',
      'आयुष्मान भारत', 'आयुष्मान', 'स्वास्थ्य', 'बीमा', 'अस्पताल', 'कार्ड', '५ लाख', 'इलाज', 'गरीब',
      'આયુષ્માન ભારત', 'આયુષ્માન', 'સ્વાસ્થ્ય', 'વીમો', 'હોસ્પિટલ', 'કાર્ડ', '૫ લાખ', 'સારવાર', 'ગરીબ'
    ]
  },
  {
    id: 'income_certificate',
    name: 'Income Certificate Guidelines',
    officialUrl: 'https://services.india.gov.in/',
    alternateUrls: ['https://services.india.gov.in/service/search?kw=income+certificate'],
    sourceTitle: 'National Government Services Portal - Income Certificate Guidelines',
    cachedFileName: 'income_certificate.txt',
    aliases: [
      // English & Transliterated
      'income certificate', 'income cert', 'income certificate documents', 'income proof',
      'income dakhla', 'aavak dakhla', 'income certificate apply',
      // Hindi
      'आय प्रमाण पत्र', 'आय प्रमाण', 'आय प्रमाणपत्र', 'आय का प्रमाण पत्र',
      // Gujarati
      'આવકનું પ્રમાણપત્ર', 'આવક પ્રમાણપત્ર', 'આવક દાખલો', 'આવક નો દાખલો', 'આવકનો દાખલો'
    ],
    keywords: [
      'income certificate', 'income', 'certificate', 'annual income', 'salary slip', 'affidavit', 'tahsildar', 'mamlatdar', 'csc', 'e-district',
      'आय प्रमाण पत्र', 'आय', 'प्रमाण पत्र', 'सर्टिफिकेट', 'सालाना आय', 'तहसीलदार', 'पटवारी',
      'આવકનું પ્રમાણપત્ર', 'આવક', 'આવકનો', 'પ્રમાણપત્ર', 'દાખલો', 'વાર્ષિક આવક', 'મામલતદાર'
    ]
  },
  {
    id: 'nfsa_ration_card',
    name: 'Ration Card / NFSA Guidelines',
    officialUrl: 'https://nfsa.gov.in/',
    sourceTitle: 'National Food Security Portal - Department of Food & Public Distribution',
    cachedFileName: 'nfsa_ration_card.txt',
    aliases: [
      // English & Transliterated
      'ration card', 'ration', 'nfsa', 'food security', 'ration card documents', 'ration card apply',
      'ration card list', 'bpl ration card', 'ration yojana', 'rashan card',
      // Hindi
      'राशन कार्ड', 'राशन', 'राष्ट्रीय खाद्य सुरक्षा', 'राशन कार्ड दस्तावेज', 'राशन कार्ड ऑनलाइन',
      // Gujarati
      'રેશન કાર્ડ', 'રાશન કાર્ડ', 'રાશન', 'રેશન કાર્ડ અરજી'
    ],
    keywords: [
      'ration card', 'ration', 'nfsa', 'food security', 'pds', 'aay', 'phh', 'bpl', 'fair price shop', 'foodgrains', 'wheat', 'rice', 'subsidy',
      'राशन कार्ड', 'राशन', 'खाद्य सुरक्षा', 'बीपीएल', 'अन्न', 'गेहूं', 'चावल',
      'રેશન કાર્ડ', 'રાશન', 'ખાદ્ય સુરક્ષા', 'બીપીએલ', 'અનાજ'
    ]
  },
  {
    id: 'pm_awas_yojana',
    name: 'Pradhan Mantri Awas Yojana (PMAY)',
    officialUrl: 'https://pmaymis.gov.in/',
    sourceTitle: 'PMAY Portal - Ministry of Housing and Urban Affairs',
    cachedFileName: 'pm_awas_yojana.txt',
    aliases: [
      // English & Transliterated
      'pm awas', 'pmay', 'awas yojana', 'housing scheme', 'ghar yojana', 'home loan subsidy',
      'pm awas eligibility', 'housing for all', 'pm awas gramin', 'pm awas urban',
      // Hindi
      'प्रधानमंत्री आवास योजना', 'पीएम आवास', 'आवास योजना', 'घर योजना', 'मकान योजना', 'आवास ऐप',
      // Gujarati
      'પ્રધાનમંત્રી આવાસ યોજના', 'આવાસ યોજના', 'ઘર યોજના', 'મકાન યોજના'
    ],
    keywords: [
      'pm awas', 'pmay', 'housing scheme', 'subsidy', 'clss', 'gramin', 'urban', 'pucca house', 'home loan', 'beneficiary list',
      'प्रधानमंत्री आवास योजना', 'आवास', 'घर', 'मकान', 'सब्सिडी', 'लाभार्थी',
      'આવાસ યોજના', 'ઘર', 'મકાન', 'સબસીડી'
    ]
  },
  {
    id: 'eshram_card',
    name: 'e-Shram Card Registration',
    officialUrl: 'https://eshram.gov.in/',
    sourceTitle: 'e-Shram Portal - Ministry of Labour & Employment',
    cachedFileName: 'eshram_card.txt',
    aliases: [
      // English & Transliterated
      'e shram', 'eshram', 'e shram card', 'labour card', 'worker card', 'unorganized worker card',
      'shramik card', 'eshram registration', 'shramik yojana',
      // Hindi
      'ई श्रम', 'ई श्रम कार्ड', 'श्रम कार्ड', 'श्रमिक कार्ड', 'मजदूर कार्ड', 'श्रमिक पंजीयन',
      // Gujarati
      'ઈ શ્રમ', 'ઈ શ્રમ કાર્ડ', 'મજૂર કાર્ડ', 'શ્રમિક કાર્ડ'
    ],
    keywords: [
      'e-shram', 'eshram', 'labour card', 'worker', 'unorganized sector', 'shramik', 'uwin', 'accident insurance', 'pension', 'pmsym',
      'ई श्रम', 'श्रम कार्ड', 'श्रमिक', 'मजदूर', 'दुर्घटना बीमा',
      'ઈ શ્રમ', 'શ્રમિક', 'મજૂર', 'વીમો'
    ]
  },
  {
    id: 'passport_seva',
    name: 'Passport Seva Application Guidelines',
    officialUrl: 'https://www.passportindia.gov.in/',
    sourceTitle: 'Passport Seva - Ministry of External Affairs',
    cachedFileName: 'passport_seva.txt',
    aliases: [
      // English & Transliterated
      'passport', 'passport seva', 'passport application', 'passport renewal', 'passport documents',
      'new passport', 'tatkal passport', 'passport fees', 'passport status',
      // Hindi
      'पासपोर्ट', 'पासपोर्ट सेवा', 'पासपोर्ट आवेदन', 'पासपोर्ट नवीनीकरण', 'नया पासपोर्ट',
      // Gujarati
      'પાસપોર્ટ', 'પાસપોર્ટ સેવા', 'પાસપોર્ટ અરજી', 'નવો પાસપોર્ટ'
    ],
    keywords: [
      'passport', 'passport seva', 'apply passport', 'renewal', 'tatkaal', 'police verification', 'arn', 'appointment', 'documents',
      'पासपोर्ट', 'पासपोर्ट सेवा', 'आवेदन', 'नवीनीकरण', 'सत्यापन',
      'પાસપોર્ટ', 'અરજી', 'ચકાસણી'
    ]
  },
  {
    id: 'pm_mudra_yojana',
    name: 'Pradhan Mantri Mudra Yojana (PMMY)',
    officialUrl: 'https://www.mudra.org.in/',
    sourceTitle: 'Mudra Portal - Ministry of Finance',
    cachedFileName: 'pm_mudra_yojana.txt',
    aliases: [
      // English & Transliterated
      'mudra', 'mudra loan', 'pm mudra', 'business loan', 'small business loan',
      'shishu loan', 'kishor loan', 'tarun loan', 'mudra loan eligibility', 'startup loan',
      // Hindi
      'मुद्रा लोन', 'पीएम मुद्रा', 'बिजनेस लोन', 'छोटा बिजनेस लोन', 'शिशु लोन', 'किशोर लोन', 'तरुण लोन',
      // Gujarati
      'મુદ્રા લોન', 'બિઝનેસ લોન', 'નાના ધંધા માટે લોન'
    ],
    keywords: [
      'mudra', 'mudra loan', 'pmmy', 'business loan', 'shishu', 'kishor', 'tarun', 'collateral free', 'msme', 'working capital',
      'मुद्रा लोन', 'बिजनेस लोन', 'ऋण', 'शिशु', 'किशोर', 'तरुण',
      'મુદ્રા લોન', 'ધંધા માટે લોન', 'લોન'
    ]
  },
  {
    id: 'national_scholarships',
    name: 'National Scholarship Portal (NSP)',
    officialUrl: 'https://scholarships.gov.in/',
    sourceTitle: 'National Scholarship Portal - Ministry of Electronics & IT',
    cachedFileName: 'national_scholarships.txt',
    aliases: [
      // English & Transliterated
      'scholarship', 'national scholarship', 'nsp', 'student scholarship', 'student scheme',
      'post matric scholarship', 'pre matric scholarship', 'nsp scholarship', 'scholarship documents',
      // Hindi
      'स्कॉलरशिप', 'छात्रवृत्ति', 'नेशनल स्कॉलरशिप', 'छात्र छात्रवृत्ति', 'छात्र योजना',
      // Gujarati
      'સ્કોલરશીપ', 'શિષ્યવૃત્તિ', 'વિદ્યાર્થી સ્કોલરશીપ'
    ],
    keywords: [
      'scholarship', 'nsp', 'student', 'pre-matric', 'post-matric', 'merit', 'minority', 'sc st obc', 'dbt', 'education loan',
      'स्कॉलरशिप', 'छात्रवृत्ति', 'छात्र', 'छात्रवृत्ति योजना',
      'સ્કોલરશીપ', 'શિષ્યવૃત્તિ', 'વિદ્યાર્થી'
    ]
  }
];

export function getCachedSourcePath(cachedFileName: string): string {
  // Works both in dev server and compiled environments since process.cwd() is the root of next project
  return path.join(process.cwd(), 'src', 'retrieval', 'sources', cachedFileName);
}
