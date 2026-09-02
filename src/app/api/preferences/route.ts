import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSessionUser } from '@/lib/auth';
import { getUserPreferencesCollection, UserPreferencesDocument } from '@/lib/dbCollections';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════ */

const VALID_LANGUAGES = ['en', 'hi', 'gu'] as const;
type ValidLanguage = (typeof VALID_LANGUAGES)[number];

function isValidLanguage(lang: unknown): lang is ValidLanguage {
  return typeof lang === 'string' && (VALID_LANGUAGES as readonly string[]).includes(lang);
}

/* ══════════════════════════════════════════════════════════
   GET /api/preferences
   Returns the authenticated user's saved language preference.
   Unauthenticated requests → 401.
   If no preference document exists → safe default "en".
   ══════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to view preferences.' },
        { status: 401 }
      );
    }

    const prefsCollection = await getUserPreferencesCollection();
    const userObjectId = new ObjectId(sessionUser.id);
    const prefs = await prefsCollection.findOne({ userId: userObjectId });

    if (!prefs) {
      // Preference document missing — initialize it with the default
      const now = new Date();
      try {
        await prefsCollection.updateOne(
          { userId: userObjectId },
          {
            $setOnInsert: {
              userId: userObjectId,
              language: 'en' as const,
              createdAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      } catch (upsertErr) {
        // Non-fatal: race condition on first upsert. Log and continue with default.
        console.warn(
          '[preferences GET] Non-fatal upsert warning:',
          (upsertErr as Error).message
        );
      }

      return NextResponse.json({
        language: 'en',
        preferences: { language: 'en', updatedAt: now },
      });
    }

    return NextResponse.json({
      language: prefs.language,
      preferences: {
        language: prefs.language,
        updatedAt: prefs.updatedAt,
      },
    });
  } catch (error) {
    console.error('[preferences GET] Unexpected error:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/* ══════════════════════════════════════════════════════════
   PATCH /api/preferences
   Updates the authenticated user's language preference.
   Unauthenticated requests → 401.
   Invalid language values → 400.
   Uses upsert to safely handle missing preference documents.
   ══════════════════════════════════════════════════════════ */

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to update preferences.' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { language } = (body as { language?: unknown }) || {};

    // Strict language validation
    if (!isValidLanguage(language)) {
      return NextResponse.json(
        {
          error: `Invalid language value "${language}". Supported values: en, hi, gu.`,
        },
        { status: 400 }
      );
    }

    const prefsCollection = await getUserPreferencesCollection();
    const userObjectId = new ObjectId(sessionUser.id);
    const now = new Date();

    // Upsert: update existing or create if missing.
    // userId index is unique — this is safe and idempotent.
    await prefsCollection.updateOne(
      { userId: userObjectId },
      {
        $set: {
          language: language as ValidLanguage,
          updatedAt: now,
        },
        $setOnInsert: {
          userId: userObjectId,
          createdAt: now,
        } as Partial<UserPreferencesDocument>,
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      language,
      preferences: {
        language,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('[preferences PATCH] Unexpected error:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
