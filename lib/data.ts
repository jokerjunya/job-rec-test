import { Job, User, UserInteraction } from '@/lib/schema';
import fs from 'fs';
import path from 'path';
import db from './db';

interface JobsData {
  jobs: Job[];
  users: User[];
}

let cachedData: JobsData | null = null;

export function getJobsData(): JobsData {
  if (cachedData) {
    return cachedData;
  }

  const dataPath = path.join(process.cwd(), 'data', 'jobs.json');
  
  if (!fs.existsSync(dataPath)) {
    // フォールバック: 空のデータを返す
    console.warn('jobs.json not found, returning empty data');
    return { jobs: [], users: [] };
  }

  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  cachedData = JSON.parse(fileContent) as JobsData;
  
  return cachedData;
}

export function getJobs(): Job[] {
  return getJobsData().jobs;
}

export function getUsers(): User[] {
  return getJobsData().users;
}

export function getUserById(userId: number): User | undefined {
  return getUsers().find(user => user.user_id === userId);
}

export function getJobById(jobId: number): Job | undefined {
  return getJobs().find(job => job.job_id === jobId);
}

/**
 * ユーザーのインタラクション（いいね/スキップ）をデータベースに保存
 * @param userId ユーザーID
 * @param jobId 求人ID
 * @param action アクション ('like', 'dislike', 'skip')
 */
export function saveInteraction(userId: number, jobId: number, action: string): void {
  try {
    // ユーザーと求人が存在するか確認（外部キー制約エラーを防ぐ）
    const userExists = db.prepare('SELECT 1 FROM users WHERE user_id = ?').get(userId);
    const jobExists = db.prepare('SELECT 1 FROM jobs WHERE job_id = ?').get(jobId);
    
    if (!userExists) {
      console.warn(`User ${userId} does not exist in database. Creating user...`);
      // ユーザーが存在しない場合は作成（デフォルトユーザー用）
      const insertUser = db.prepare('INSERT OR IGNORE INTO users (user_id, user_skills) VALUES (?, ?)');
      insertUser.run(userId, '');
    }
    
    if (!jobExists) {
      throw new Error(`Job ${jobId} does not exist in database`);
    }
    
    // インタラクションを保存
    const stmt = db.prepare(`
      INSERT INTO user_interactions (user_id, job_id, action, timestamp)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(userId, jobId, action);
  } catch (error) {
    console.error('Error saving interaction to database:', error);
    throw error;
  }
}

/**
 * ユーザーのインタラクション履歴をデータベースから取得
 * @param userId ユーザーID
 * @returns インタラクション履歴の配列
 */
export function getUserInteractions(userId: number): UserInteraction[] {
  try {
    const stmt = db.prepare(`
      SELECT interaction_id, user_id, job_id, action, timestamp
      FROM user_interactions
      WHERE user_id = ?
      ORDER BY timestamp DESC
    `);
    
    const rows = stmt.all(userId) as Array<{
      interaction_id: number;
      user_id: number;
      job_id: number;
      action: string;
      timestamp: string;
    }>;
    
    return rows.map(row => ({
      interaction_id: row.interaction_id,
      user_id: row.user_id,
      job_id: row.job_id,
      action: row.action as 'like' | 'dislike' | 'skip',
      timestamp: row.timestamp,
    }));
  } catch (error) {
    console.error('Error fetching user interactions from database:', error);
    return [];
  }
}

/**
 * ユーザーがインタラクションした求人IDのリストを取得
 * @param userId ユーザーID
 * @returns 求人IDの配列
 */
export function getUserInteractedJobIds(userId: number): number[] {
  try {
    const stmt = db.prepare(`
      SELECT DISTINCT job_id
      FROM user_interactions
      WHERE user_id = ?
    `);
    
    const rows = stmt.all(userId) as Array<{ job_id: number }>;
    return rows.map(row => row.job_id);
  } catch (error) {
    console.error('Error fetching interacted job IDs from database:', error);
    return [];
  }
}

