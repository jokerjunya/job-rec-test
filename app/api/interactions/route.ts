import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { UserInteraction } from '@/lib/schema';

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
    const insert = db.prepare(`
      INSERT INTO user_interactions (user_id, job_id, action, timestamp)
      VALUES (?, ?, ?, datetime('now'))
    `);

    const result = insert.run(user_id, job_id, action);

    return NextResponse.json({
      success: true,
      interaction_id: result.lastInsertRowid,
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

    let query = 'SELECT * FROM user_interactions WHERE user_id = ?';
    const params: any[] = [parseInt(userId)];

    if (jobId) {
      query += ' AND job_id = ?';
      params.push(parseInt(jobId));
    }

    query += ' ORDER BY timestamp DESC';

    const interactions = db.prepare(query).all(...params) as UserInteraction[];

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

