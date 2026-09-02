import { NextResponse } from 'next/server';
import { getUsersCollection, getUserPreferencesCollection, UserDocument, UserPreferencesDocument } from '@/lib/dbCollections';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, email, password } = body || {};

    // 1. Validate Name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json({ error: 'Name is too long (maximum 100 characters)' }, { status: 400 });
    }

    // 2. Validate & Normalize Email
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 255) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // 3. Validate Password
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long (maximum 128 characters)' }, { status: 400 });
    }

    const usersCollection = await getUsersCollection();

    // 4. Check for existing user
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 409 });
    }

    // 5. Hash Password & Insert User
    const passwordHash = await hashPassword(password);
    const now = new Date();

    let insertResult;
    try {
      insertResult = await usersCollection.insertOne({
        name: trimmedName,
        email: normalizedEmail,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      } as UserDocument);
    } catch (dbErr: unknown) {
      // Catch concurrent unique index constraint violations (MongoDB error code 11000)
      if (typeof dbErr === 'object' && dbErr !== null && 'code' in dbErr && (dbErr as { code: number }).code === 11000) {
        return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 409 });
      }
      throw dbErr;
    }

    const userId = insertResult.insertedId;

    // 6. Create Default User Preferences
    const prefsCollection = await getUserPreferencesCollection();
    await prefsCollection.insertOne({
      userId,
      language: 'en',
      createdAt: now,
      updatedAt: now,
    } as UserPreferencesDocument);

    // 7. Generate Session Token & Set Cookie
    const token = await createSessionToken({
      sub: userId.toHexString(),
      email: normalizedEmail,
      name: trimmedName,
    });
    await setSessionCookie(token);

    // 8. Return Safe User Representation
    return NextResponse.json(
      {
        user: {
          id: userId.toHexString(),
          name: trimmedName,
          email: normalizedEmail,
          language: 'en',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during user signup:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
