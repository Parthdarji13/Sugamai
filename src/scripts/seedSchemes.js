/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local without requiring external dotenv package
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'sugamgov';

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const VERIFIED_CENTRAL_SCHEMES = [
  {
    schemeId: 'pm_kisan',
    schemeName: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    schemeShortTitle: 'PM Kisan',
    nodalMinistry: 'Ministry of Agriculture and Farmers Welfare',
    schemeCategory: 'Agriculture, Rural & Environment',
    level: 'Central',
    benefits: 'Direct financial income support of Rs 6,000 per year per eligible farmer family, paid in 3 equal four-monthly installments of Rs 2,000 directly into the bank account via Aadhaar-linked DBT.',
    eligibilityCriteria: 'All landholding farmer families having cultivable land in their names. Exclusions: Institutional landholders, farmer families holding constitutional posts, serving/retired government employees, pensioners receiving Rs 10,000+ monthly pension (excluding MTS/Class IV), income tax payers in the last assessment year, and registered professionals (doctors, engineers, lawyers, CA, architects). Mandatory e-KYC and land-seeding required.',
    documentsRequired: 'Aadhaar Card, Land ownership papers / Land records (Khatiyan / RoR / 7/12 extract), Active Aadhaar-seeded Bank Account passbook, Mobile number linked with Aadhaar.',
    applicationProcess: 'Farmers can self-register online via PM-Kisan Portal (pmkisan.gov.in) under "Farmer Corner" -> "New Farmer Registration" or through local Common Service Centres (CSC) / State Agriculture Nodal Officers. Mandatory e-KYC can be completed using OTP on portal or biometric at CSC.',
    officialPortalUrl: 'https://pmkisan.gov.in',
    sourceName: 'PM-KISAN Official Portal, Ministry of Agriculture & Farmers Welfare',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'ayushman_bharat_pmjay',
    schemeName: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)',
    schemeShortTitle: 'Ayushman Bharat / PM-JAY',
    nodalMinistry: 'Ministry of Health and Family Welfare / National Health Authority (NHA)',
    schemeCategory: 'Health & Wellness',
    level: 'Central',
    benefits: 'Cashless and paperless secondary and tertiary healthcare coverage of up to Rs 5,00,000 per eligible family per year across empaneled public and private hospitals across India. Covers pre-existing conditions from Day 1, diagnostic tests, surgeries, medications, and post-hospitalization care for 15 days.',
    eligibilityCriteria: 'Rural and urban households identified through Socio-Economic Caste Census (SECC 2011) deprivation criteria (D1 to D7 categories) and active National Food Security Act (NFSA) ration card databases. Additionally, all senior citizens aged 70 years and above are eligible under the expanded AB-PMJAY regardless of income.',
    documentsRequired: 'Aadhaar Card, Ration Card / Family ID document, Registered Mobile Number, ABHA (Ayushman Bharat Health Account) ID (if available).',
    applicationProcess: 'Check eligibility on beneficiary.nha.gov.in or Ayushman App using Aadhaar/Ration card. If eligible, complete e-KYC via OTP or fingerprint at nearest Empaneled Hospital / CSC to download the Ayushman Card instantly.',
    officialPortalUrl: 'https://pmjay.gov.in',
    sourceName: 'National Health Authority (NHA), Ministry of Health and Family Welfare',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_awas_yojana_urban',
    schemeName: 'Pradhan Mantri Awas Yojana - Urban (PMAY-U / PMAY-U 2.0)',
    schemeShortTitle: 'PMAY Urban',
    nodalMinistry: 'Ministry of Housing and Urban Affairs',
    schemeCategory: 'Housing & Shelter',
    level: 'Central',
    benefits: 'Central financial subsidy assistance up to Rs 2.5 Lakh for construction or purchase of pucca houses. Provides Interest Subsidy Scheme (ISS), Affordable Housing in Partnership (AHP), and Beneficiary-Led individual house Construction (BLC).',
    eligibilityCriteria: 'Economically Weaker Section (EWS) with annual income up to Rs 3 Lakh, Low Income Group (LIG) with income between Rs 3 Lakh and Rs 6 Lakh, and Middle Income Group (MIG). The beneficiary family must not own a pucca house anywhere in India. The house must be registered in the name of the female head or joint ownership.',
    documentsRequired: 'Aadhaar Card, Income Certificate / Salary slips, Bank Account details, Proof of identity and residence, Land ownership title deed/patta (for BLC), Non-ownership affidavit of pucca house.',
    applicationProcess: 'Apply online through pmaymis.gov.in or via nearest Common Service Centre (CSC) under citizen assessment. Applications are verified by local Municipal Urban Local Bodies (ULBs).',
    officialPortalUrl: 'https://pmaymis.gov.in',
    sourceName: 'Ministry of Housing and Urban Affairs, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_awas_yojana_gramin',
    schemeName: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    schemeShortTitle: 'PMAY Gramin',
    nodalMinistry: 'Ministry of Rural Development',
    schemeCategory: 'Housing & Shelter',
    level: 'Central',
    benefits: 'Direct financial assistance of Rs 1,20,000 in plain areas and Rs 1,30,000 in hilly/difficult/IAP areas for constructing a minimum 25 sq. meter pucca house with clean cooking space. In addition, 90-95 days of unskilled labor wages under MGNREGS (approx. Rs 20,000+) and Rs 12,000 for toilet construction under Swachh Bharat Mission.',
    eligibilityCriteria: 'Houseless families and households living in kutcha/dilapidated houses according to SECC 2011 and Awas+ priority lists. Prioritizes SC/ST, minorities, widows, disabled persons, and destitute families.',
    documentsRequired: 'Aadhaar Card, MGNREGA Job Card Number, Bank Account Passbook details (DBT enabled), Land document or Gram Panchayat certificate.',
    applicationProcess: 'Beneficiary lists are prepared transparently by Gram Sabha based on SECC/Awas+ survey and geotagged verification through AwaasSoft/AwaasApp. Block Development Office (BDO) issues sanction orders directly.',
    officialPortalUrl: 'https://pmayg.nic.in',
    sourceName: 'Ministry of Rural Development, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_mudra_yojana',
    schemeName: 'Pradhan Mantri Mudra Yojana (PMMY)',
    schemeShortTitle: 'PM Mudra Yojana',
    nodalMinistry: 'Ministry of Finance / Department of Financial Services',
    schemeCategory: 'Banking, Financial Services & Insurance',
    level: 'Central',
    benefits: 'Collateral-free institutional business loans for micro and small non-farm enterprises. Three loan categories: Shishu (loans up to Rs 50,000), Kishore (Rs 50,001 to Rs 5,00,000), and Tarun (Rs 5,00,001 up to Rs 10 Lakh, expandable to Rs 20 Lakh for successful borrowers). Zero processing fee for Shishu and Kishore loans.',
    eligibilityCriteria: 'Any Indian citizen wanting to start or expand a micro/small business enterprise in manufacturing, trading, service sectors, or allied agriculture (dairy, poultry, fisheries). Must have no default record with any financial institution.',
    documentsRequired: 'Identity Proof (Aadhaar/Voter ID/PAN), Address Proof, Business Enterprise registration/proof (Udyam / GST / Shop License), Bank account statements for past 6 months, Business project proposal quotation/estimates.',
    applicationProcess: 'Apply online through Udyamimitra portal (udyamimitra.in) or submit Mudra application directly at any Commercial Bank, RRB, Small Finance Bank, or MFI branch.',
    officialPortalUrl: 'https://www.mudra.org.in',
    sourceName: 'Micro Units Development & Refinance Agency (MUDRA), Ministry of Finance',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'sukanya_samriddhi_yojana',
    schemeName: 'Sukanya Samriddhi Yojana (SSY)',
    schemeShortTitle: 'Sukanya Samriddhi',
    nodalMinistry: 'Ministry of Finance / Department of Posts',
    schemeCategory: 'Women and Child Development',
    level: 'Central',
    benefits: 'High-yield government-backed small savings scheme for girl child welfare. Offers high sovereign interest rate (currently ~8.2% p.a., compounded annually), complete Triple Tax Exemption (EEE category under Sec 80C). Minimum deposit Rs 250 and maximum Rs 1,50,000 per financial year.',
    eligibilityCriteria: 'Account can be opened by biological parents or legal guardians for a girl child from birth up to 10 years of age. Maximum 2 accounts per family (or 3 in case of twins/triplets in first/second birth). Account matures 21 years from the date of opening or upon marriage after age 18.',
    documentsRequired: "Girl child's Birth Certificate, Parent/Guardian's Aadhaar and PAN Card, Address proof, Passport size photographs of parent and child.",
    applicationProcess: 'Open in-person at any Post Office or authorized Public/Private Sector Bank branches by filling SSY Account Opening Form (Form-1) along with initial deposit.',
    officialPortalUrl: 'https://www.indiapost.gov.in',
    sourceName: 'Department of Posts / Ministry of Finance, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'atal_pension_yojana',
    schemeName: 'Atal Pension Yojana (APY)',
    schemeShortTitle: 'Atal Pension Yojana',
    nodalMinistry: 'Ministry of Finance / PFRDA',
    schemeCategory: 'Social Welfare & Pensions',
    level: 'Central',
    benefits: 'Guaranteed minimum monthly pension of Rs 1,000, Rs 2,000, Rs 3,000, Rs 4,000, or Rs 5,000 per month starting from age 60 until death. After subscriber demise, spouse receives the same monthly pension; after spouse demise, full pension corpus is returned to the nominee.',
    eligibilityCriteria: 'All Indian citizens aged between 18 and 40 years holding a savings bank account. Must NOT be an income tax payer (as per rules effective from Oct 1, 2022).',
    documentsRequired: 'Aadhaar Card, Active Savings Bank Account / Post Office Account with auto-debit consent, Registered Mobile Number.',
    applicationProcess: 'Apply online through Net Banking / mobile banking of your respective bank or submit APY registration form physically at your bank/post office branch with auto-debit mandate.',
    officialPortalUrl: 'https://www.npscra.nsdl.co.in/scheme-details.php?id=3',
    sourceName: 'Pension Fund Regulatory and Development Authority (PFRDA)',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_jeevan_jyoti_bima_yojana',
    schemeName: 'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)',
    schemeShortTitle: 'PMJJBY Life Insurance',
    nodalMinistry: 'Ministry of Finance / Department of Financial Services',
    schemeCategory: 'Banking, Financial Services & Insurance',
    level: 'Central',
    benefits: 'Affordable pure term life insurance cover of Rs 2,00,000 payable to nominee in case of death of the insured due to any reason. Annual premium is only Rs 436 per annum, auto-debited in a single installment annually.',
    eligibilityCriteria: 'All individual bank or post office account holders aged between 18 and 50 years. Coverage continues up to age 55 subject to regular annual premium payment.',
    documentsRequired: 'Aadhaar Card, Savings Bank / Post Office Account, Consent cum Declaration form with nominee details.',
    applicationProcess: 'Enroll via Internet Banking or SMS with your bank, or submit a simple one-page consent form at any bank branch or post office where you hold a savings account.',
    officialPortalUrl: 'https://www.jansuraksha.gov.in',
    sourceName: 'Jan Suraksha Portal, Department of Financial Services, Ministry of Finance',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_suraksha_bima_yojana',
    schemeName: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    schemeShortTitle: 'PMSBY Accident Insurance',
    nodalMinistry: 'Ministry of Finance / Department of Financial Services',
    schemeCategory: 'Banking, Financial Services & Insurance',
    level: 'Central',
    benefits: 'Accidental death and disability insurance cover. Provides Rs 2,00,000 for accidental death or permanent total disability, and Rs 1,00,000 for permanent partial disability. Annual premium is extremely low at Rs 20 per annum auto-debited once a year.',
    eligibilityCriteria: 'All individual bank or post office savings account holders aged between 18 and 70 years.',
    documentsRequired: 'Aadhaar Card, Active Bank/Post Office Savings Account, Nominee details.',
    applicationProcess: 'Subscribe via Bank Net Banking / Mobile Banking app, or visit your bank/post office branch to submit the auto-debit consent form.',
    officialPortalUrl: 'https://www.jansuraksha.gov.in',
    sourceName: 'Jan Suraksha Portal, Ministry of Finance',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_svanidhi',
    schemeName: "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
    schemeShortTitle: 'PM SVANidhi',
    nodalMinistry: 'Ministry of Housing and Urban Affairs',
    schemeCategory: 'Business & Entrepreneurship',
    level: 'Central',
    benefits: 'Micro-credit working capital loans for street vendors: 1st tranche up to Rs 10,000 (1-year tenure), 2nd tranche up to Rs 20,000 upon timely repayment, and 3rd tranche up to Rs 50,000. Interest subsidy of 7% per annum credited via DBT for timely repayments, plus monthly cashback up to Rs 100 on digital transactions.',
    eligibilityCriteria: 'Street vendors and hawkers vending in urban, semi-urban, or peri-urban areas holding a Certificate of Vending (CoV) / Identity Card issued by Urban Local Bodies (ULBs) or Recommendation Letter (LoR).',
    documentsRequired: 'Aadhaar Card, Certificate of Vending (CoV) / Vendor ID / Letter of Recommendation (LoR), Bank Account details, Mobile number linked to Aadhaar.',
    applicationProcess: 'Apply online on pmsvanidhi.mohua.gov.in portal or through PM SVANidhi Mobile App, or via local CSC / Banking Correspondent (BC).',
    officialPortalUrl: 'https://pmsvanidhi.mohua.gov.in',
    sourceName: 'Ministry of Housing and Urban Affairs (MoHUA)',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_garib_kalyan_anna_yojana',
    schemeName: 'PM Garib Kalyan Anna Yojana / NFSA Ration Scheme (PMGKAY)',
    schemeShortTitle: 'PMGKAY Free Foodgrains',
    nodalMinistry: 'Ministry of Consumer Affairs, Food and Public Distribution',
    schemeCategory: 'Social Welfare & Food Security',
    level: 'Central',
    benefits: 'Free monthly foodgrains (Rice/Wheat/Coarse grains) provided to over 81 crore citizens: 5 kg foodgrains per person per month for Priority Household (PHH) cardholders, and 35 kg foodgrains per family per month for Antyodaya Anna Yojana (AAY) poorest households with zero issue price.',
    eligibilityCriteria: 'Beneficiary families covered under the National Food Security Act (NFSA) categorized as Antyodaya Anna Yojana (AAY) or Priority Households (PHH) based on state identification criteria.',
    documentsRequired: 'Valid NFSA Ration Card, Aadhaar Card for all family members (for biometric PoS authentication at Fair Price Shop).',
    applicationProcess: 'Avail monthly quota directly at any Fair Price Shop (FPS) using biometric e-PoS device. Under One Nation One Ration Card (ONORC), migrant workers can collect ration from any FPS in India.',
    officialPortalUrl: 'https://nfsa.gov.in',
    sourceName: 'Department of Food and Public Distribution, Ministry of Consumer Affairs',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'eshram_card',
    schemeName: 'e-Shram Portal (National Database of Unorganized Workers)',
    schemeShortTitle: 'e-Shram Card',
    nodalMinistry: 'Ministry of Labour and Employment',
    schemeCategory: 'Labour, Employment & Social Security',
    level: 'Central',
    benefits: 'Issuance of a Universal Account Number (UAN) 12-digit eShram card for unorganized workers to easily access various social security schemes, accident insurance under PMSBY, migrant worker support, and disaster relief cash assistance.',
    eligibilityCriteria: 'Unorganized workers aged between 16 and 59 years (e.g. agricultural laborers, gig workers, construction workers, domestic help, street vendors, rickshaw pullers, carpenters). Must NOT be an income tax payer and NOT covered under EPFO/ESIC.',
    documentsRequired: 'Aadhaar Card, Active Mobile Number linked to Aadhaar, Savings Bank Account Details (Account Number & IFSC Code).',
    applicationProcess: 'Self-register for free on eshram.gov.in using Aadhaar OTP authentication or visit nearest Common Service Centre (CSC) for biometric registration to download the e-Shram card immediately.',
    officialPortalUrl: 'https://eshram.gov.in',
    sourceName: 'Ministry of Labour & Employment, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_ujjwala_yojana',
    schemeName: 'Pradhan Mantri Ujjwala Yojana (PMUY / Ujjwala 2.0)',
    schemeShortTitle: 'PM Ujjwala Yojana',
    nodalMinistry: 'Ministry of Petroleum and Natural Gas',
    schemeCategory: 'Energy & Rural Development',
    level: 'Central',
    benefits: 'Free LPG gas connection provided to adult women from poor households, including financial support of Rs 1,600 per connection, first LPG cylinder refill free of cost, and a free gas stove (hotplate). Also offers continuous targeted subsidy per refill up to 12 refills a year.',
    eligibilityCriteria: 'Adult woman (18+ years) belonging to poor household (BPL/SC/ST/PMAY/AAY/Most Backward Classes/Forest Dwellers/Tea garden tribes/SECC poor list). No other LPG connection must exist in the same household.',
    documentsRequired: 'Aadhaar Card of applicant and adult family members, Ration Card / Proof of BPL family status, Bank Account Passbook (IFSC), 14-point declaration for migrant families.',
    applicationProcess: 'Apply online at pmuy.gov.in or submit physical Ujjwala application at the nearest LPG distributor (Indane, Bharatgas, or HP Gas).',
    officialPortalUrl: 'https://www.pmuy.gov.in',
    sourceName: 'Ministry of Petroleum and Natural Gas, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_vishwakarma',
    schemeName: 'PM Vishwakarma Scheme',
    schemeShortTitle: 'PM Vishwakarma',
    nodalMinistry: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
    schemeCategory: 'Skills, Artisans & Employment',
    level: 'Central',
    benefits: 'Recognition through PM Vishwakarma Certificate and ID Card; Skill verification + 5-7 days basic training with Rs 500/day stipend; Tool-kit modern incentive e-voucher of Rs 15,000; Collateral-free enterprise loan up to Rs 1 Lakh (1st tranche) and Rs 2 Lakh (2nd tranche) at concessional 5% interest rate; Digital incentive of Rs 1 per digital transaction up to 100 transactions/month.',
    eligibilityCriteria: 'Traditional artisans and craftspersons working with hands and tools in 18 notified trades (Carpenters, Blacksmiths, Potters, Sculptors, Cobblers, Masons, Barbers, Tailors, Washermen, Basket makers, Fishery net makers, etc.). Minimum age 18 years, 1 beneficiary per family, non-government employees.',
    documentsRequired: 'Aadhaar Card, Mobile Number linked to Aadhaar, Bank Account details, Ration Card / Family ID, Skill trade declaration.',
    applicationProcess: 'Register online through Common Service Centres (CSC) on pmvishwakarma.gov.in. Applications undergo 3-stage verification (Gram Panchayat / ULB -> District Committee -> Screening Committee).',
    officialPortalUrl: 'https://pmvishwakarma.gov.in',
    sourceName: 'Ministry of MSME / Ministry of Skill Development, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'stand_up_india',
    schemeName: 'Stand-Up India Scheme',
    schemeShortTitle: 'Stand-Up India',
    nodalMinistry: 'Ministry of Finance / SIDBI',
    schemeCategory: 'Business & Entrepreneurship',
    level: 'Central',
    benefits: 'Bank composite loans between Rs 10 Lakh and Rs 1 Crore for greenfield (new) enterprise projects in manufacturing, services, trading, or agri-allied sectors. Margin money requirement lowered to up to 15%.',
    eligibilityCriteria: 'SC/ST and/or Woman entrepreneurs above 18 years of age. Enterprise must be a greenfield project. In non-individual enterprises, at least 51% shareholding and controlling stake must be held by SC/ST and/or woman entrepreneur.',
    documentsRequired: 'Identity & Address Proof, Caste Certificate (for SC/ST), Business project report/estimates, Promoter PAN, Land/Lease agreement, Bank statements.',
    applicationProcess: 'Apply online via standupmitra.in portal or directly visit any Scheduled Commercial Bank branch / Lead District Manager (LDM).',
    officialPortalUrl: 'https://www.standupmitra.in',
    sourceName: 'Small Industries Development Bank of India (SIDBI) / Ministry of Finance',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'national_scholarship_portal',
    schemeName: 'National Scholarship Portal (NSP Central Scholarship Schemes)',
    schemeShortTitle: 'National Scholarships / NSP',
    nodalMinistry: 'Ministry of Social Justice / Ministry of Tribal Affairs / Ministry of Minority Affairs / Ministry of Education',
    schemeCategory: 'Education & Learning',
    level: 'Central',
    benefits: 'Direct financial scholarship funding covering tuition fees, maintenance allowance, book allowance, and hostel fees directly into students bank accounts via DBT for Pre-Matric, Post-Matric, Higher Education, and Top Class Education.',
    eligibilityCriteria: 'School and college students belonging to SC, ST, OBC, Minority, EBC categories, or differently-abled students with annual parental family income generally below Rs 1.5 Lakh to Rs 2.5 Lakh (depending on scheme), having secured minimum qualifying marks.',
    documentsRequired: 'Student Aadhaar Card, Previous Year Marksheet, Caste/Community Certificate, Income Certificate issued by competent revenue authority, Student Bank Account Passbook (Aadhaar linked), Institute Verification Bonafide Certificate.',
    applicationProcess: 'Register on scholarships.gov.in with One-Time Registration (OTR), select eligible scheme, upload required documents, and submit. Application is verified by Institute Nodal Officer (INO) and State Nodal Officer (SNO).',
    officialPortalUrl: 'https://scholarships.gov.in',
    sourceName: 'National Scholarship Portal (NSP), Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_kaushal_vikas_yojana',
    schemeName: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
    schemeShortTitle: 'PMKVY Skill Training',
    nodalMinistry: 'Ministry of Skill Development and Entrepreneurship (MSDE)',
    schemeCategory: 'Skills & Employment',
    level: 'Central',
    benefits: 'Free industry-aligned certified skill training, placement support, assessment, and government certification under National Skills Qualification Framework (NSQF). Offers short-term training (STT), Recognition of Prior Learning (RPL), and specialized FutureSkills training.',
    eligibilityCriteria: 'Any Indian citizen aged 15 to 45 years who is unemployed, school/college drop-out, or looking to upskill with valid identity proof.',
    documentsRequired: 'Aadhaar Card, Educational qualification marksheets/certificates, Bank Account details, Passport size photograph.',
    applicationProcess: 'Enroll online through Skill India Digital portal (skillindiadigital.gov.in) or visit your nearest Pradhan Mantri Kaushal Kendra (PMKK) or accredited training center.',
    officialPortalUrl: 'https://www.skillindiadigital.gov.in',
    sourceName: 'National Skill Development Corporation (NSDC) / MSDE',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'kisan_credit_card',
    schemeName: 'Kisan Credit Card (KCC) Scheme',
    schemeShortTitle: 'Kisan Credit Card / KCC',
    nodalMinistry: 'Ministry of Agriculture and Farmers Welfare / RBI / NABARD',
    schemeCategory: 'Agriculture & Rural Credit',
    level: 'Central',
    benefits: 'Timely and flexible short-term institutional crop credit and working capital up to Rs 3 Lakh at an effective concessional interest rate of 4% per annum (after 2% interest subvention and 3% prompt repayment incentive). No collateral needed for loans up to Rs 1.60 Lakh.',
    eligibilityCriteria: 'All individual farmers/cultivators, joint borrowers, tenant farmers, oral lessees, sharecroppers, and Self Help Groups (SHGs) or Joint Liability Groups (JLGs) of farmers, animal husbandry, dairy, and fisheries farmers.',
    documentsRequired: 'Duly filled KCC application form, Land ownership records (7/12, RoR, Khatauni) or tenancy lease agreement, Aadhaar Card, PAN Card, passport photos.',
    applicationProcess: 'Apply at any Commercial Bank, Regional Rural Bank (RRB), or Cooperative Bank branch, or online through PM-Kisan portal integrated KCC link / JanSamarth portal.',
    officialPortalUrl: 'https://pmkisan.gov.in/KCC.aspx',
    sourceName: 'Department of Agriculture & Farmers Welfare / NABARD',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_fasal_bima_yojana',
    schemeName: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    schemeShortTitle: 'PM Fasal Bima / PMFBY',
    nodalMinistry: 'Ministry of Agriculture and Farmers Welfare',
    schemeCategory: 'Agriculture & Crop Insurance',
    level: 'Central',
    benefits: 'Comprehensive crop insurance coverage against non-preventable natural risks (drought, flood, pests, unseasonal rains, post-harvest losses). Extremely low farmer premium share: max 2.0% for Kharif food/oilseed crops, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops. Remaining actuarial premium is subsidized by Government.',
    eligibilityCriteria: 'All farmers (loanee and non-loanee, sharecroppers, tenant farmers) growing notified crops in notified areas during the season.',
    documentsRequired: 'Land record document (RoR / 7/12 / Khasra), Sowing certificate / Crop declaration by Patwari/Village officer, Aadhaar Card, Bank Passbook, Tenant agreement (if applicable).',
    applicationProcess: 'Apply online on pmfby.gov.in or through Crop Insurance Mobile App, nearest Bank branch, Primary Agricultural Credit Society (PACS), or CSC before the cutoff date for the season.',
    officialPortalUrl: 'https://pmfby.gov.in',
    sourceName: 'Ministry of Agriculture and Farmers Welfare, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'jal_jeevan_mission',
    schemeName: 'Jal Jeevan Mission (Har Ghar Jal)',
    schemeShortTitle: 'Jal Jeevan Mission',
    nodalMinistry: 'Ministry of Jal Shakti / Department of Drinking Water and Sanitation',
    schemeCategory: 'Public Infrastructure & Water',
    level: 'Central',
    benefits: 'Providing functional household tap connection (FHTC) with safe and adequate potable drinking water at the service level of 55 liters per capita per day (lpcd) to every rural household on regular and long-term basis.',
    eligibilityCriteria: 'All rural households located in village habitations across all States and UTs of India.',
    documentsRequired: 'Village residency verification through Village Water & Sanitation Committee (VWSC) / Gram Panchayat records.',
    applicationProcess: 'Executed collectively at the Gram Panchayat / Village level under Village Action Plans (VAP). Citizens can track connectivity status of their village on the JJM Dashboard (ejalshakti.gov.in).',
    officialPortalUrl: 'https://jaljeevanmission.gov.in',
    sourceName: 'Department of Drinking Water and Sanitation, Ministry of Jal Shakti',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'ddu_gky',
    schemeName: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana (DDU-GKY)',
    schemeShortTitle: 'DDU-GKY Rural Skills',
    nodalMinistry: 'Ministry of Rural Development',
    schemeCategory: 'Rural Livelihoods & Skills',
    level: 'Central',
    benefits: 'Free residential placement-linked skill training, free uniforms, course books, lodging, boarding, and guaranteed job placement for at least 70% of trained rural youth with a minimum wage guarantee.',
    eligibilityCriteria: 'Rural youth aged between 15 and 35 years (upper age relaxed up to 45 years for women, SC/ST, PwD, and special groups) belonging to poor rural households (BPL or SECC identified).',
    documentsRequired: 'Aadhaar Card, BPL Card / Ration Card / MGNREGA Job card of family, Proof of Age (Birth cert / School marksheet), Caste certificate (if SC/ST).',
    applicationProcess: 'Register at Kaushal Panjee portal (kaushalpanjee.nic.in) or visit the nearest Project Implementing Agency (PIA) training centre or District Rural Development Agency (DRDA).',
    officialPortalUrl: 'http://ddugky.gov.in',
    sourceName: 'Ministry of Rural Development, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_poshan_midday_meal',
    schemeName: 'PM POSHAN Scheme (Pradhan Mantri Poshan Shakti Nirman / Mid-Day Meal)',
    schemeShortTitle: 'PM POSHAN',
    nodalMinistry: 'Ministry of Education / Department of School Education and Literacy',
    schemeCategory: 'Education, Nutrition & Child Welfare',
    level: 'Central',
    benefits: 'Free hot cooked nutritious mid-day meal provided every school day to children studying in government and government-aided primary (Classes I-V: min 450 calories & 12g protein) and upper primary (Classes VI-VIII: min 700 calories & 20g protein) schools and Balvatikas.',
    eligibilityCriteria: 'All children enrolled and attending Classes I to VIII in Government, Local Body, and Government-aided schools, Special Training Centres (EGS/AIE), and Madarsas/Maqtabs supported under Samagra Shiksha.',
    documentsRequired: 'School admission enrollment in eligible government or aided school. No separate individual document required.',
    applicationProcess: 'Automatic provision upon school enrollment and daily attendance in eligible schools.',
    officialPortalUrl: 'https://pmposhan.education.gov.in',
    sourceName: 'Department of School Education and Literacy, Ministry of Education',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'mahila_samman_savings_certificate',
    schemeName: 'Mahila Samman Savings Certificate (MSSC)',
    schemeShortTitle: 'Mahila Samman Savings',
    nodalMinistry: 'Ministry of Finance / Department of Economic Affairs',
    schemeCategory: 'Women Empowerment & Small Savings',
    level: 'Central',
    benefits: 'Guaranteed high fixed interest rate of 7.5% per annum, compounded quarterly. Short 2-year maturity tenure. Minimum investment Rs 1,00,0 and maximum Rs 2,00,000. Partial withdrawal up to 40% of balance permitted after 1 year.',
    eligibilityCriteria: 'Any woman or girl child (account can be opened by the woman herself or by a guardian on behalf of a minor girl child).',
    documentsRequired: 'Account Opening Form, Aadhaar Card, PAN Card, KYC Address Proof, Passport size photo.',
    applicationProcess: 'Visit any Post Office or designated Public/Private sector bank branch and submit the MSSC application form with deposit amount (cash or cheque).',
    officialPortalUrl: 'https://www.indiapost.gov.in',
    sourceName: 'Ministry of Finance / Department of Posts, Government of India',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'pm_employment_generation_programme',
    schemeName: 'Prime Minister Employment Generation Programme (PMEGP)',
    schemeShortTitle: 'PMEGP Subsidy Scheme',
    nodalMinistry: 'Ministry of Micro, Small and Medium Enterprises (MSME) / KVIC',
    schemeCategory: 'Business & Employment',
    level: 'Central',
    benefits: 'Credit-linked capital subsidy for setting up new micro-enterprises. Max project cost: Rs 50 Lakh for manufacturing unit and Rs 20 Lakh for service unit. Government margin money subsidy: 15% to 25% in urban areas, and 25% to 35% in rural areas for special category beneficiaries (SC/ST/OBC/Women/Ex-servicemen/NER/Disabled).',
    eligibilityCriteria: 'Any individual aged 18+ years. For projects costing above Rs 10 Lakh in manufacturing and Rs 5 Lakh in service sector, minimum educational qualification is 8th standard pass. New projects only.',
    documentsRequired: 'Aadhaar Card, PAN Card, Detailed Project Report (DPR), Educational/EDP Training Certificate, Caste/Category Certificate, Rural area certificate from Gram Panchayat (if rural).',
    applicationProcess: 'Apply online on the PMEGP e-Portal (kviconline.gov.in/pmegpeportal/). Applications are screened by District Level Task Force Committee (DLTFC) and forwarded to financing banks.',
    officialPortalUrl: 'https://www.kviconline.gov.in/pmegpeportal/',
    sourceName: 'Khadi and Village Industries Commission (KVIC), Ministry of MSME',
    lastVerifiedAt: new Date('2026-02-15')
  },
  {
    schemeId: 'national_apprenticeship_promotion_scheme',
    schemeName: 'National Apprenticeship Promotion Scheme (NAPS-2)',
    schemeShortTitle: 'NAPS Apprenticeship',
    nodalMinistry: 'Ministry of Skill Development and Entrepreneurship (MSDE)',
    schemeCategory: 'Skills, Apprenticeship & Youth',
    level: 'Central',
    benefits: 'Direct financial stipend support of 25% of the prescribed monthly stipend (up to a maximum of Rs 1,500 per month per apprentice) paid directly to apprentices via DBT, along with on-the-job industrial practical training and government apprenticeship certification.',
    eligibilityCriteria: 'Candidates aged 14+ years (18+ for hazardous occupations) possessing minimum educational qualification prescribed for the designated trade (e.g. 8th/10th/12th/ITI/Diploma/Graduate).',
    documentsRequired: 'Aadhaar Card, Educational marksheet/certificate, Bank Account Details (Aadhaar linked for DBT stipend), Mobile number and Email.',
    applicationProcess: 'Register as candidate on the National Apprenticeship Portal (apprenticeshipindia.gov.in), search for apprenticeship opportunities by industry/location, and apply directly to establishments.',
    officialPortalUrl: 'https://www.apprenticeshipindia.gov.in',
    sourceName: 'Ministry of Skill Development and Entrepreneurship (MSDE)',
    lastVerifiedAt: new Date('2026-02-15')
  }
];

async function seed() {
  console.log('Connecting to MongoDB database...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB:', MONGODB_DB);
    const db = client.db(MONGODB_DB);
    const collection = db.collection('government_schemes');

    // Create / verify text index
    console.log('Verifying text index on government_schemes...');
    try {
      await collection.createIndex(
        {
          schemeName: 'text',
          schemeShortTitle: 'text',
          schemeCategory: 'text',
          benefits: 'text',
          eligibilityCriteria: 'text',
          nodalMinistry: 'text'
        },
        { name: 'idx_government_schemes_text' }
      );
      console.log('Text index idx_government_schemes_text ready.');
    } catch (idxErr) {
      console.log('Index note:', idxErr.message);
    }

    console.log(`Upserting ${VERIFIED_CENTRAL_SCHEMES.length} verified government schemes...`);
    let upsertedCount = 0;
    let updatedCount = 0;

    for (const scheme of VERIFIED_CENTRAL_SCHEMES) {
      const res = await collection.updateOne(
        { schemeId: scheme.schemeId },
        { $set: scheme },
        { upsert: true }
      );
      if (res.upsertedCount > 0) upsertedCount++;
      else if (res.modifiedCount > 0) updatedCount++;
    }

    const count = await collection.countDocuments();
    console.log('\n===========================================');
    console.log(' GOVERNMENT SCHEMES SEEDING COMPLETED');
    console.log(` Newly Inserted : ${upsertedCount}`);
    console.log(` Updated         : ${updatedCount}`);
    console.log(` Total in DB     : ${count}`);
    console.log('===========================================\n');
  } catch (err) {
    console.error('Error seeding schemes:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
