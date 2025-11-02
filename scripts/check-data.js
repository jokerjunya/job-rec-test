// ビルド前にデータファイルの存在を確認するスクリプト
// Netlifyのビルド環境で実行される（tsx不要）

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), 'data', 'jobs.json');

// dataディレクトリが存在しない場合は作成
const dataDir = path.dirname(jsonPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// JSONファイルが存在し、有効なサイズを持つか確認
if (fs.existsSync(jsonPath)) {
  const stats = fs.statSync(jsonPath);
  if (stats.size > 1024) {
    console.log('✅ jobs.json exists and is valid');
    process.exit(0);
  } else {
    console.log('⚠️  jobs.json exists but is too small, creating empty file');
  }
}

// JSONファイルが存在しないか、サイズが小さい場合は空のファイルを作成
console.log('⚠️  Creating empty jobs.json for build');
const emptyData = { jobs: [], users: [] };
fs.writeFileSync(jsonPath, JSON.stringify(emptyData, null, 2));
console.log('✅ Created empty jobs.json');

process.exit(0);

