import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'jobs.db');
const jsonPath = path.join(process.cwd(), 'data', 'jobs.json');

// SQLiteからJSONへのエクスポートスクリプト
// このスクリプトは、SQLiteデータベースが存在する場合にのみ実行される

function exportToJson() {
  // データディレクトリが存在しない場合は作成
  const dataDir = path.dirname(jsonPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // SQLiteデータベースが存在しない場合は、空のJSONファイルを作成
  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  SQLite database not found, creating empty JSON file');
    const emptyData = { jobs: [], users: [] };
    fs.writeFileSync(jsonPath, JSON.stringify(emptyData, null, 2));
    console.log('✅ Created empty jobs.json');
    return;
  }

  try {
    const db = new Database(dbPath);
    
    const jobs = db.prepare('SELECT * FROM jobs').all();
    const users = db.prepare('SELECT * FROM users').all();
    
    const data = {
      jobs,
      users,
    };

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Exported ${jobs.length} jobs and ${users.length} users to jobs.json`);
    
    db.close();
  } catch (error) {
    console.error('❌ Error exporting to JSON:', error);
    // エラーが発生した場合でも、空のJSONファイルを作成
    const emptyData = { jobs: [], users: [] };
    fs.writeFileSync(jsonPath, JSON.stringify(emptyData, null, 2));
    console.log('✅ Created empty jobs.json as fallback');
  }
}

exportToJson();

