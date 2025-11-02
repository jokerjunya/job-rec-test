import { NextRequest, NextResponse } from 'next/server';
import { getUserInteractions } from '@/lib/data';
import { UserInteraction } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const interactions = getUserInteractions(userId);

    // getUserInteractionsは既にタイムスタンプで降順ソートされている

    return NextResponse.json({
      interactions,
      total: interactions.length,
    });
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user interactions' },
      { status: 500 }
    );
  }
}
