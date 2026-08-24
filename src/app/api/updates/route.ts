import { NextResponse } from 'next/server';
import { governmentUpdates } from '@/retrieval/updatesData';

export async function GET() {
  try {
    // Validate source URLs
    for (const update of governmentUpdates) {
      if (!update.sourceUrl.startsWith('http://') && !update.sourceUrl.startsWith('https://')) {
        throw new Error(`Invalid source URL configured for update: ${update.id}`);
      }
    }

    return NextResponse.json(governmentUpdates, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=600'
      }
    });
  } catch (error) {
    console.error('Error in /api/updates:', error);
    
    // Return fallback copy rather than crashing
    return NextResponse.json(governmentUpdates.slice(0, 1), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}
