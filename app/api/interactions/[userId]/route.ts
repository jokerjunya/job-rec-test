import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { UserInteraction } from '@/lib/schema';

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

    const interactions = db
      .prepare('SELECT * FROM user_interactions WHERE user_id = ? ORDER BY timestamp DESC')
      .all(userId) as UserInteraction[];

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

