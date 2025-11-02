import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Job } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM jobs';
    const params: any[] = [];

    // ユーザーが指定されている場合、既にインタラクションした求人を除外
    if (userId) {
      query = `
        SELECT j.* FROM jobs j
        WHERE j.job_id NOT IN (
          SELECT job_id FROM user_interactions WHERE user_id = ?
        )
        ORDER BY j.match_score DESC
        LIMIT ? OFFSET ?
      `;
      params.push(parseInt(userId), limit, offset);
    } else {
      query += ' ORDER BY job_id LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const jobs = db.prepare(query).all(...params) as Job[];

    return NextResponse.json({
      jobs,
      total: jobs.length,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

