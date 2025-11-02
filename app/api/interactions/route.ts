import { NextRequest, NextResponse } from 'next/server';
import { saveInteraction, getUserInteractions } from '@/lib/data';
import { UserInteraction } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, job_id, action } = body;

    // バリデーション
    if (!user_id || !job_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, job_id, action' },
        { status: 400 }
      );
    }

    if (!['like', 'dislike', 'skip'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: like, dislike, skip' },
        { status: 400 }
      );
    }

    // インタラクションを保存
    await saveInteraction(user_id, job_id, action);

    return NextResponse.json({
      success: true,
      message: 'Interaction saved',
    });
  } catch (error) {
    console.error('Error saving interaction:', error);
    return NextResponse.json(
      { error: 'Failed to save interaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    let interactions = await getUserInteractions(parseInt(userId));

    if (jobId) {
      interactions = interactions.filter(i => i.job_id === parseInt(jobId));
    }

    // getUserInteractionsは既にタイムスタンプで降順ソートされている

    return NextResponse.json({
      interactions,
      total: interactions.length,
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
