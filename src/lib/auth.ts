import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import { getUsersCollection, getUserPreferencesCollection } from './dbCollections';

/* ══════════════════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
   ══════════════════════════════════════════════════════════ */

export const SESSION_COOKIE_NAME = 'sugamgov_session';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days
const BCRYPT_SALT_ROUNDS = 12;

export interface SessionPayload {
  sub: string; // User ID as hex string
  email: string;
  name: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  language: 'en' | 'hi' | 'gu';
}

/**
 * Custom Error class for authentication failures.
 */
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Returns the secret key for signing/verifying JWT tokens.
 * Reads SESSION_SECRET from environment variables.
 * Throws a clear server error if missing.
 */
function getSessionSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      'Invalid/Missing environment variable: "SESSION_SECRET". Please configure SESSION_SECRET in your environment or .env.local'
    );
  }
  return new TextEncoder().encode(secret.trim());
}

/* ══════════════════════════════════════════════════════════
   PASSWORD UTILITIES
   ══════════════════════════════════════════════════════════ */

/**
 * Hashes a plaintext password using bcryptjs with 12 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a candidate plaintext password with a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ══════════════════════════════════════════════════════════
   SESSION TOKEN UTILITIES (JOSE)
   ══════════════════════════════════════════════════════════ */

/**
 * Signs a session token containing user identity using HMAC SHA-256.
 * Valid for 7 days.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secretKey = getSessionSecretKey();
  return new SignJWT({
    email: payload.email,
    name: payload.name,
  })
    .setSubject(payload.sub)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Verifies a session token.
 * Returns decoded SessionPayload if valid, or null if expired/invalid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getSessionSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (!payload.sub || typeof payload.sub !== 'string') {
      return null;
    }

    return {
      sub: payload.sub,
      email: (payload.email as string) || '',
      name: (payload.name as string) || '',
    };
  } catch {
    // Expired, signature mismatch, or malformed token
    return null;
  }
}

/* ══════════════════════════════════════════════════════════
   COOKIE & SESSION RESOLVERS (Next.js 16 Compatible)
   ══════════════════════════════════════════════════════════ */

/**
 * Sets the secure HTTP-only session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Reads the session cookie, verifies the token, and queries the database
 * to return the full safe authenticated user profile.
 * Returns null if unauthenticated, invalid, or user was deleted.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return null;
    }

    const payload = await verifySessionToken(sessionCookie.value);
    if (!payload || !ObjectId.isValid(payload.sub)) {
      await clearSessionCookie();
      return null;
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.sub) });
    if (!user) {
      // User no longer exists in DB — clean up invalid cookie
      await clearSessionCookie();
      return null;
    }

    // Query user preferences (language)
    const prefsCollection = await getUserPreferencesCollection();
    const prefs = await prefsCollection.findOne({ userId: user._id });

    return {
      id: user._id.toHexString(),
      name: user.name,
      email: user.email,
      language: prefs?.language || 'en',
    };
  } catch {
    return null;
  }
}

/**
 * Authorization helper for protected routes.
 * Throws an AuthError if no authenticated session exists.
 */
export async function requireSessionUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError('Authentication required. Please log in to continue.', 401);
  }
  return user;
}
