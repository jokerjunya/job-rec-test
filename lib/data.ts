import { Job, User } from '@/lib/schema';
import fs from 'fs';
import path from 'path';

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

// インタラクションはメモリに保存（サーバーレス環境では永続化しない）
const interactions: Map<string, Array<{ user_id: number; job_id: number; action: string; timestamp: string }>> = new Map();

export function saveInteraction(userId: number, jobId: number, action: string): void {
  const key = `user_${userId}`;
  if (!interactions.has(key)) {
    interactions.set(key, []);
  }
  
  const userInteractions = interactions.get(key)!;
  userInteractions.push({
    user_id: userId,
    job_id: jobId,
    action,
    timestamp: new Date().toISOString(),
  });
}

export function getUserInteractions(userId: number): Array<{ user_id: number; job_id: number; action: string; timestamp: string }> {
  const key = `user_${userId}`;
  return interactions.get(key) || [];
}

export function getUserInteractedJobIds(userId: number): number[] {
  return getUserInteractions(userId).map(i => i.job_id);
}

