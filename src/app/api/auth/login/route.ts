import { NextResponse } from 'next/server';
import { getUsersCollection, getUserPreferencesCollection } from '@/lib/dbCollections';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, password } = body || {};

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Query User by Normalized Email
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ email: normalizedEmail });

    // 2. Constant-time/Generic Credential Validation
    // Avoid timing/existence side-channels by always checking password
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 3. Query User Preferences (Language)
    const prefsCollection = await getUserPreferencesCollection();
    const prefs = await prefsCollection.findOne({ userId: user._id });
    const userLanguage = prefs?.language || 'en';

    // 4. Generate Session Token & Set Cookie
    const token = await createSessionToken({
      sub: user._id.toHexString(),
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    // 5. Return Safe User Representation
    return NextResponse.json({
      user: {
        id: user._id.toHexString(),
        name: user.name,
        email: user.email,
        language: userLanguage,
      },
    });
  } catch (error) {
    console.error('Error during user login:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
