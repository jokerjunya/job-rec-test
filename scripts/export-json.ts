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

  // 環境変数で強制エクスポートを制御
  const forceExport = process.env.FORCE_EXPORT === 'true';

  // JSONファイルが既に存在する場合はスキップ（CI/CD環境では不要）
  if (!forceExport && fs.existsSync(jsonPath)) {
    const stats = fs.statSync(jsonPath);
    // ファイルサイズが1KB以上の場合、既に有効なデータがあると判断
    if (stats.size > 1024) {
      console.log('✅ jobs.json already exists, skipping export');
      console.log('   💡 強制的にエクスポートするには: FORCE_EXPORT=true npm run prepare-data');
      return;
    }
  }

  // SQLiteデータベースが存在しない場合は、空のJSONファイルを作成
  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  SQLite database not found');
    
    // JSONファイルが存在しない場合のみ空のファイルを作成
    if (!fs.existsSync(jsonPath)) {
      console.log('⚠️  jobs.json not found, creating empty JSON file');
      const emptyData = { jobs: [], users: [] };
      fs.writeFileSync(jsonPath, JSON.stringify(emptyData, null, 2));
      console.log('✅ Created empty jobs.json');
    } else {
      console.log('✅ Using existing jobs.json');
    }
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
    // エラーが発生した場合でも、既存のJSONファイルがあればそれを使用
    if (fs.existsSync(jsonPath)) {
      console.log('✅ Using existing jobs.json as fallback');
    } else {
      // エラーが発生した場合でも、空のJSONファイルを作成
      const emptyData = { jobs: [], users: [] };
      fs.writeFileSync(jsonPath, JSON.stringify(emptyData, null, 2));
      console.log('✅ Created empty jobs.json as fallback');
    }
  }
}

exportToJson();

