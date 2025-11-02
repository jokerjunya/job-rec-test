import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'jobs.db');

// データディレクトリが存在しない場合は作成
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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

export default db;

