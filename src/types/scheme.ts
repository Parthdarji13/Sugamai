export interface GovernmentScheme {
  schemeId: string;
  schemeName: string;
  schemeShortTitle: string;
  nodalMinistry: string;
  schemeCategory: string;
  level: 'Central' | 'State' | 'Concurrent';
  benefits: string;
  eligibilityCriteria: string;
  documentsRequired: string;
  applicationProcess: string;
  officialPortalUrl: string;
  sourceName: string;
  lastVerifiedAt: Date;
}
