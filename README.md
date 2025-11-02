# Job Swipe App

Tinder風の求人マッチングアプリです。左右スワイプで求人に興味があるかどうかを記録できます。

## 機能

- 📱 Tinder風のスワイプUI
- 💾 ユーザーインタラクションログの保存
- 🎨 モダンなUIデザイン（Tailwind CSS + shadcn/ui）
- 📊 Firebase Firestoreによるデータ管理（Netlify対応）
- 🔄 SQLiteからFirestoreへのデータ移行対応

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **アニメーション**: Framer Motion
- **データベース**: Firebase Firestore（本番環境） / SQLite（ローカル開発）
- **スワイプ機能**: react-swipeable

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. データベースの準備

CSVデータをSQLiteデータベースにインポートします：

```bash
npm run import-csv
```

これにより、`data/jobs.db`にデータがインポートされます。

### 3. 求人データにjob_titleを追加

求人データに職種名、会社名、勤務地などの情報を追加します：

```bash
npm run update-jobs
```

このスクリプトは、`Job_Requirements`から職種名を推測して、各求人に`job_title`、`company_name`、`location`などのフィールドを追加します。

### 4. （オプション）Kaggleデータセットを統合

より詳細な求人情報を追加するために、Kaggleのデータセットを統合できます：

```bash
npm run integrate-kaggle -- --linkedin linkedin_jobs.csv --salary salaries.csv
```

または対話的に：

```bash
npm run integrate-kaggle
```

### 5. Firebase Firestoreのセットアップ（推奨）

Netlifyなどサーバーレス環境で動作させるために、Firebase Firestoreを使用します：

1. **Firebaseプロジェクトの作成**
   - [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
   - Firestore Databaseを作成

2. **環境変数の設定**
   - `.env.local`ファイルを作成
   - Firebase設定を追加（詳細は`docs/firebase-setup.md`を参照）

3. **データの移行**
   ```bash
   npm run migrate-to-firestore
   ```

詳細なセットアップ手順は[`docs/firebase-setup.md`](docs/firebase-setup.md)を参照してください。

### 6. JSONファイルの更新（Firestore未使用時）

SQLiteデータベースの変更をJSONファイルに反映します：

```bash
# 通常のエクスポート（既存ファイルがある場合はスキップ）
npm run prepare-data

# 強制的にエクスポート
FORCE_EXPORT=true npm run prepare-data
```

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 使い方

1. アプリを開くと、求人カードが表示されます
2. カードを左右にスワイプ、または下部のボタンで操作：
   - **右スワイプ（いいね）**: 興味がある求人
   - **左スワイプ（スキップ）**: 興味がない求人
3. スワイプした求人は自動的にインタラクションログに保存されます
4. 次の求人が自動的に表示されます

## データ構造

### jobs テーブル
- `job_id`: 求人ID（主キー）
- `job_requirements`: 必要なスキル（カンマ区切り）
- `job_title`: 職種名（例: "Software Engineer", "Data Scientist"）
- `company_name`: 会社名（例: "TechCorp Solutions"）
- `location`: 勤務地（例: "Tokyo, Japan", "Remote"）
- `job_description`: 求人説明
- `salary_range`: 給与範囲（例: "$80,000 - $120,000"）
- `employment_type`: 雇用形態（例: "Full-time", "Part-time"）
- `experience_level`: 経験レベル（例: "Entry Level", "Mid Level"）
- `match_score`: マッチングスコア（0-1）
- `recommended`: 推奨フラグ（0/1）

### users テーブル
- `user_id`: ユーザーID（主キー）
- `user_skills`: ユーザースキル（カンマ区切り）

### user_interactions テーブル
- `interaction_id`: インタラクションID（主キー）
- `user_id`: ユーザーID
- `job_id`: 求人ID
- `action`: アクション（'like', 'dislike', 'skip'）
- `timestamp`: タイムスタンプ

## API エンドポイント

### GET /api/jobs
求人一覧を取得します。

**クエリパラメータ**:
- `userId`: ユーザーID（オプション）
- `limit`: 取得件数（デフォルト: 10）
- `offset`: オフセット（デフォルト: 0）

### GET /api/jobs/[id]
個別の求人情報を取得します。

### POST /api/interactions
インタラクションを記録します。

**リクエストボディ**:
```json
{
  "user_id": 1,
  "job_id": 16,
  "action": "like"
}
```

### GET /api/interactions
ユーザーのインタラクション履歴を取得します。

**クエリパラメータ**:
- `userId`: ユーザーID（必須）
- `jobId`: 求人ID（オプション）

## 開発

### プロジェクト構造

```
job-rec-test/
├── app/
│   ├── api/          # API Routes
│   ├── page.tsx      # メインページ
│   └── layout.tsx    # レイアウト
├── components/       # Reactコンポーネント
│   ├── ui/          # shadcn/uiコンポーネント
│   ├── JobCard.tsx
│   ├── SwipeableCard.tsx
│   └── SwipeActions.tsx
├── lib/             # ユーティリティ
│   ├── db.ts        # データベース接続
│   └── schema.ts    # 型定義
├── scripts/         # スクリプト
│   ├── import-csv.ts
│   ├── update-jobs-with-titles.ts  # job_titleを追加
│   ├── integrate-kaggle-data.ts    # Kaggleデータセット統合
│   └── export-json.ts              # JSONエクスポート
└── data/           # データベースファイル
    └── jobs.db
```

## ライセンス

MIT

