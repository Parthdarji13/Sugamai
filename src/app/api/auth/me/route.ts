import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    // Return 200 with user or null for normal guest state
    return NextResponse.json({ user: user || null });
  } catch (error) {
    console.error('Error in /api/auth/me:', (error as Error).message);
    // Even in case of unexpected errors, return user: null so guest mode never crashes
    return NextResponse.json({ user: null });
  }
}
