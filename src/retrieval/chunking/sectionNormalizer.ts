import { SectionType } from './types';

/**
 * Maps arbitrary document section titles into normalized canonical SectionType values.
 */
export function normalizeSectionHeading(title: string): SectionType {
  const normalized = title.toLowerCase().trim().replace(/[:\-_]/g, ' ');

  // 1. Exclusions (must precede generic eligibility checks)
  if (
    normalized.includes('exclusion') ||
    normalized.includes('not eligible') ||
    normalized.includes('ineligible') ||
    normalized.includes('who is not')
  ) {
    return 'exclusions';
  }

  // 2. Overview / Summary
  if (
    normalized.includes('overview') ||
    normalized.includes('about') ||
    normalized.includes('introduction') ||
    normalized.includes('summary')
  ) {
    return 'overview';
  }

  // 3. Status Tracking
  if (
    normalized.includes('status') ||
    normalized.includes('tracking') ||
    normalized.includes('check beneficiary')
  ) {
    return 'status';
  }

  // 4. Validity / Deadlines / Duration
  if (
    normalized.includes('validity') ||
    normalized.includes('duration') ||
    normalized.includes('last date') ||
    normalized.includes('deadline') ||
    normalized.includes('timeline') ||
    normalized.includes('window')
  ) {
    return 'validity';
  }

  // 5. Verification notes / remarks
  if (normalized.includes('verification')) {
    return 'verification';
  }

  // 6. Documents / Proofs
  if (
    normalized.includes('document') ||
    normalized.includes('documents required') ||
    normalized.includes('proof') ||
    normalized.includes('papers') ||
    normalized.includes('non ecr')
  ) {
    return 'documents';
  }

  // 7. Application process / How to apply / Registration
  if (
    normalized.includes('apply') ||
    normalized.includes('application') ||
    normalized.includes('registration') ||
    normalized.includes('how to') ||
    normalized.includes('process') ||
    normalized.includes('method')
  ) {
    return 'application';
  }

  // 8. Eligibility criteria (rural, urban, senior citizens, workers, general)
  if (
    normalized.includes('eligib') ||
    normalized.includes('criteria') ||
    normalized.includes('who can') ||
    normalized.includes('senior citizen') ||
    normalized.includes('eligible worker') ||
    normalized.includes('qualification')
  ) {
    return 'eligibility';
  }

  // 9. Benefits / Categories / Loan tiers / Entitlements
  if (
    normalized.includes('benefit') ||
    normalized.includes('component') ||
    normalized.includes('categories') ||
    normalized.includes('types of') ||
    normalized.includes('entitlement') ||
    normalized.includes('coverage')
  ) {
    return 'benefits';
  }

  return 'other';
}

/**
 * Extracts a concise official Ministry / Department / Authority name from sourceTitle.
 */
export function extractMinistryFromSourceTitle(sourceTitle: string): string {
  if (!sourceTitle) return 'Government of India';

  // Common patterns: "Portal Name - Ministry / Department Name"
  const hyphenParts = sourceTitle.split(' - ');
  if (hyphenParts.length > 1) {
    return hyphenParts[1].trim();
  }

  // Pattern: "National Health Authority..."
  if (sourceTitle.toLowerCase().includes('national health authority')) {
    return 'National Health Authority';
  }

  if (sourceTitle.toLowerCase().includes('passport seva')) {
    return 'Ministry of External Affairs';
  }

  return sourceTitle.trim();
}

/**
 * Computes a standardized token count estimation for English governmental text.
 * Uses 1.25x word count heuristic (standard for English technical/bureaucratic text).
 */
export function estimateTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words * 1.25));
}

/**
 * Normalizes text content: standardizes newlines, strips trailing spaces, converts tabs.
 */
export function normalizeTextContent(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}
