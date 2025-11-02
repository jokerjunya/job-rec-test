# Job Swipe App

Tinder風の求人マッチングアプリです。左右スワイプで求人に興味があるかどうかを記録できます。

## 機能

- 📱 Tinder風のスワイプUI
- 💾 ユーザーインタラクションログの保存
- 🎨 モダンなUIデザイン（Tailwind CSS + shadcn/ui）
- 📊 SQLiteデータベースによるデータ管理

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **アニメーション**: Framer Motion
- **データベース**: SQLite (better-sqlite3)
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

### 3. 開発サーバーの起動

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
│   └── import-csv.ts
└── data/           # データベースファイル
    └── jobs.db
```

## ライセンス

MIT

