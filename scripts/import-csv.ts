import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const dbPath = path.join(process.cwd(), 'data', 'jobs.db');
const csvPath = path.join(process.cwd(), 'Job Datsset.csv');

interface CSVRecord {
  User_ID: string;
  Job_ID: string;
  User_Skills: string;
  Job_Requirements: string;
  Match_Score: string;
  Recommended: string;
}

async function importCSV() {
  console.log('📖 Reading CSV file...');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as CSVRecord[];

  console.log(`✅ Loaded ${records.length} records`);

  // データディレクトリが存在しない場合は作成
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created data directory: ${dataDir}`);
  }

  // データベースに接続
  const db = new Database(dbPath);
  
  // テーブル作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      job_id INTEGER PRIMARY KEY,
      job_requirements TEXT NOT NULL,
      match_score REAL,
      recommended INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      user_skills TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_interactions (
      interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('like', 'dislike', 'skip')),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (job_id) REFERENCES jobs(job_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_interactions_job_id ON user_interactions(job_id);
    CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);
  `);
  
  // トランザクション開始
  const insertJob = db.prepare(`
    INSERT OR REPLACE INTO jobs (job_id, job_requirements, match_score, recommended)
    VALUES (?, ?, ?, ?)
  `);

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (user_id, user_skills)
    VALUES (?, ?)
  `);

  const insertManyJobs = db.transaction((jobs: any[]) => {
    for (const job of jobs) {
      insertJob.run(
        job.job_id,
        job.job_requirements,
        job.match_score || null,
        job.recommended || 0
      );
    }
  });

  const insertManyUsers = db.transaction((users: any[]) => {
    for (const user of users) {
      insertUser.run(user.user_id, user.user_skills);
    }
  });

  // ユニークなJob_IDとUser_IDを抽出
  const uniqueJobs = new Map();
  const uniqueUsers = new Map();

  for (const record of records) {
    const jobId = parseInt(record.Job_ID);
    const userId = parseInt(record.User_ID);

    // ユニークな求人を保存
    if (!uniqueJobs.has(jobId)) {
      uniqueJobs.set(jobId, {
        job_id: jobId,
        job_requirements: record.Job_Requirements,
        match_score: parseFloat(record.Match_Score) || null,
        recommended: parseInt(record.Recommended) || 0,
      });
    }

    // ユニークなユーザーを保存
    if (!uniqueUsers.has(userId)) {
      uniqueUsers.set(userId, {
        user_id: userId,
        user_skills: record.User_Skills,
      });
    }
  }

  console.log(`📊 Found ${uniqueJobs.size} unique jobs`);
  console.log(`📊 Found ${uniqueUsers.size} unique users`);

  // データベースに挿入
  console.log('💾 Importing jobs...');
  insertManyJobs(Array.from(uniqueJobs.values()));
  console.log('✅ Jobs imported');

  console.log('💾 Importing users...');
  insertManyUsers(Array.from(uniqueUsers.values()));
  console.log('✅ Users imported');

  // 統計情報を表示
  const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  console.log('\n📊 Database Statistics:');
  console.log(`   - Jobs: ${jobCount.count}`);
  console.log(`   - Users: ${userCount.count}`);

  db.close();
  console.log('\n✅ Import completed successfully!');
}

importCSV().catch((error) => {
  console.error('❌ Error importing CSV:', error);
  process.exit(1);
});
