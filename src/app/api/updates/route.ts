import { NextResponse } from 'next/server';
import { governmentUpdates } from '@/retrieval/updatesData';
import { fetchLiveGovernmentUpdates } from '@/retrieval/updateFetcher';

export async function GET() {
  try {
    // 1. Attempt live PIB feed retrieval
    const liveUpdates = await fetchLiveGovernmentUpdates();

    if (liveUpdates && liveUpdates.length >= 3) {
      return NextResponse.json(liveUpdates, {
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=600'
        }
      });
    }

    // 2. If live fetch failed or produced < 3 items, serve verified static fallback
    console.log('[UPDATES FETCH] PIB live feed failed');
    console.log('[UPDATES FETCH] Serving verified static fallback');

    return NextResponse.json(governmentUpdates, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=600'
      }
    });

  } catch (error) {
    console.warn('[UPDATES FETCH] PIB live feed failed:', (error as Error).message);
    console.log('[UPDATES FETCH] Serving verified static fallback');

    return NextResponse.json(governmentUpdates, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}
