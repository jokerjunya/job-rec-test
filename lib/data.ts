import { Job, User, UserInteraction } from '@/lib/schema';
import { getFirestoreAdmin } from './firebase-admin';
import fs from 'fs';
import path from 'path';

// Firestoreを使用するか、JSONフォールバックを使用するか
const USE_FIRESTORE = process.env.USE_FIRESTORE !== 'false'; // デフォルトでtrue

/**
 * Jobsコレクションから全求人を取得
 */
export async function getJobs(): Promise<Job[]> {
  if (USE_FIRESTORE) {
    try {
      const db = getFirestoreAdmin();
      const snapshot = await db.collection('jobs').get();
      return snapshot.docs.map(doc => doc.data() as Job);
    } catch (error) {
      console.error('Error fetching jobs from Firestore:', error);
      // フォールバック: JSONファイルから読み込み
      return getJobsFromJSON();
    }
  }
  
  // JSONファイルから読み込み
  return getJobsFromJSON();
}

/**
 * JSONファイルから求人データを取得（フォールバック用）
 */
function getJobsFromJSON(): Job[] {
  const dataPath = path.join(process.cwd(), 'data', 'jobs.json');
  
  if (!fs.existsSync(dataPath)) {
    return [];
  }
  
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.jobs || [];
  } catch (error) {
    console.error('Error reading jobs.json:', error);
    return [];
  }
}

/**
 * Usersコレクションから全ユーザーを取得
 */
export async function getUsers(): Promise<User[]> {
  if (USE_FIRESTORE) {
    try {
      const db = getFirestoreAdmin();
      const snapshot = await db.collection('users').get();
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error('Error fetching users from Firestore:', error);
      return getUsersFromJSON();
    }
  }
  
  return getUsersFromJSON();
}

/**
 * JSONファイルからユーザーデータを取得（フォールバック用）
 */
function getUsersFromJSON(): User[] {
  const dataPath = path.join(process.cwd(), 'data', 'jobs.json');
  
  if (!fs.existsSync(dataPath)) {
    return [];
  }
  
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.users || [];
  } catch (error) {
    console.error('Error reading users from jobs.json:', error);
    return [];
  }
}

export async function getUserById(userId: number): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(user => user.user_id === userId);
}

export async function getJobById(jobId: number): Promise<Job | undefined> {
  if (USE_FIRESTORE) {
    try {
      const db = getFirestoreAdmin();
      const doc = await db.collection('jobs').doc(jobId.toString()).get();
      if (!doc.exists) {
        return undefined;
      }
      return doc.data() as Job;
    } catch (error) {
      console.error('Error fetching job from Firestore:', error);
      // フォールバック: JSONから取得
      const jobs = await getJobs();
      return jobs.find(job => job.job_id === jobId);
    }
  }
  
  const jobs = await getJobs();
  return jobs.find(job => job.job_id === jobId);
}

/**
 * ユーザーのインタラクション（いいね/スキップ）をFirestoreに保存
 */
export async function saveInteraction(userId: number, jobId: number, action: string): Promise<void> {
  if (USE_FIRESTORE) {
    try {
      const db = getFirestoreAdmin();
      
      // ユーザーが存在しない場合は作成
      const userRef = db.collection('users').doc(userId.toString());
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        await userRef.set({
          user_id: userId,
          user_skills: '',
        });
      }
      
      // インタラクションを保存
      await db.collection('user_interactions').add({
        user_id: userId,
        job_id: jobId,
        action: action,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error saving interaction to Firestore:', error);
      throw error;
    }
    return;
  }
  
  // フォールバック: SQLite（既存の実装）
  const db = require('./db').default;
  try {
    const userExists = db.prepare('SELECT 1 FROM users WHERE user_id = ?').get(userId);
    const jobExists = db.prepare('SELECT 1 FROM jobs WHERE job_id = ?').get(jobId);
    
    if (!userExists) {
      console.warn(`User ${userId} does not exist in database. Creating user...`);
      const insertUser = db.prepare('INSERT OR IGNORE INTO users (user_id, user_skills) VALUES (?, ?)');
      insertUser.run(userId, '');
    }
    
    if (!jobExists) {
      throw new Error(`Job ${jobId} does not exist in database`);
    }
    
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
 * ユーザーのインタラクション履歴をFirestoreから取得
 */
export async function getUserInteractions(userId: number): Promise<UserInteraction[]> {
  if (USE_FIRESTORE) {
    try {
      const db = getFirestoreAdmin();
      const snapshot = await db.collection('user_interactions')
        .where('user_id', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          interaction_id: doc.id,
          user_id: data.user_id,
          job_id: data.job_id,
          action: data.action as 'like' | 'dislike' | 'skip',
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        };
      });
    } catch (error) {
      console.error('Error fetching user interactions from Firestore:', error);
      return [];
    }
  }
  
  // フォールバック: SQLite
  const db = require('./db').default;
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
 */
export async function getUserInteractedJobIds(userId: number): Promise<number[]> {
  if (USE_FIRESTORE) {
    try {
      const db = getFirestoreAdmin();
      const snapshot = await db.collection('user_interactions')
        .where('user_id', '==', userId)
        .get();
      
      return snapshot.docs.map(doc => doc.data().job_id);
    } catch (error) {
      console.error('Error fetching interacted job IDs from Firestore:', error);
      return [];
    }
  }
  
  // フォールバック: SQLite
  const db = require('./db').default;
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
