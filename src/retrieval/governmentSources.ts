import path from 'path';

export interface GovernmentSource {
  id: string;
  name: string;
  officialUrl: string;
  sourceTitle: string;
  cachedFileName: string;
  keywords: string[];
}

export const governmentSources: GovernmentSource[] = [
  {
    id: 'pm_kisan',
    name: 'PM Kisan Samman Nidhi',
    officialUrl: 'https://pmkisan.gov.in/',
    sourceTitle: 'PM-Kisan Portal - Ministry of Agriculture & Farmers Welfare',
    cachedFileName: 'pm_kisan.txt',
    keywords: [
      // English
      'pm kisan', 'pm-kisan', 'kisan', 'farmer', 'eligibility', 'eligible', 'benefit', 'installment', 'money', 'payment', 'exclude', 'exclusion', 'landholding', 'cultivable land', 'rs 6000', 'rs 2000',
      // Hindi
      'किसान', 'पीएम किसान', 'पात्रता', 'पात्र', 'लाभ', 'किस्त', 'पैसा', 'रुपये', 'जमीन', 'खेती', 'अपात्र',
      // Gujarati
      'ખેડૂત', 'પીએમ કિસાન', 'પાત્રતા', 'લાભ', 'હપ્તો', 'રૂપિયા', 'જમીન', 'ખેતી', 'અપાત્ર'
    ]
  },
  {
    id: 'ayushman_bharat',
    name: 'Ayushman Bharat (AB-PMJAY)',
    officialUrl: 'https://pmjay.gov.in/',
    sourceTitle: 'National Health Authority - Ayushman Bharat Portal',
    cachedFileName: 'ayushman_bharat.txt',
    keywords: [
      // English
      'ayushman bharat', 'ayushman', 'pmjay', 'pm-jay', 'health cover', 'insurance', 'hospital', 'card', '5 lakh', 'five lakh', 'medical', 'deprivation', 'rural', 'urban', 'secc', 'treatment',
      // Hindi
      'आयुष्मान भारत', 'आयुष्मान', 'स्वास्थ्य', 'बीमा', 'अस्पताल', 'कार्ड', '५ लाख', 'पात्रता', 'इलाज', 'गरीब',
      // Gujarati
      'આયુષ્માન ભારત', 'આયુષ્માન', 'સ્વાસ્થ્ય', 'વીમો', 'હોસ્પિટલ', 'કાર્ડ', '૫ લાખ', 'સારવાર', 'ગરીબ'
    ]
  },
  {
    id: 'income_certificate',
    name: 'Income Certificate Guidelines',
    officialUrl: 'https://services.india.gov.in/',
    sourceTitle: 'National Government Services Portal - Income Certificate Guidelines',
    cachedFileName: 'income_certificate.txt',
    keywords: [
      // English
      'income certificate', 'income', 'certificate', 'apply', 'documents', 'process', 'annual income', 'salary slip', 'affidavit', 'tahsildar', 'mamlatdar', 'csc', 'e-district',
      // Hindi
      'आय प्रमाण पत्र', 'आय', 'प्रमाण पत्र', 'सर्टिफिकेट', 'दस्तावेज', 'आवेदन', 'प्रक्रिया', 'सालाना आय', 'तहसीलदार', 'पटवारी',
      // Gujarati
      'આવકનું પ્રમાણપત્ર', 'આવક', 'પ્રમાણપત્ર', 'દાખલો', 'દસ્તાવેજો', 'અરજી', 'પ્રક્રિયા', 'વાર્ષિક આવક', 'મામલતદાર'
    ]
  }
];

export function getCachedSourcePath(cachedFileName: string): string {
  // Works both in dev server and compiled environments since process.cwd() is the root of next project
  return path.join(process.cwd(), 'src', 'retrieval', 'sources', cachedFileName);
}
