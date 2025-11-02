import { NextRequest, NextResponse } from 'next/server';
import { getJobs, getUserInteractedJobIds } from '@/lib/data';
import { Job } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let jobs: Job[] = getJobs();

    // ユーザーが指定されている場合、既にインタラクションした求人を除外
    if (userId) {
      const interactedJobIds = getUserInteractedJobIds(parseInt(userId));
      jobs = jobs.filter(job => !interactedJobIds.includes(job.job_id));
    }

    // ソートとページネーション
    jobs = jobs
      .sort((a, b) => {
        // match_scoreで降順ソート
        const scoreA = a.match_score || 0;
        const scoreB = b.match_score || 0;
        return scoreB - scoreA;
      })
      .slice(offset, offset + limit);

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
