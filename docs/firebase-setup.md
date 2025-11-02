# Firebase Firestore統合ガイド

## 概要

このプロジェクトはFirebase Firestoreを使用してデータを管理します。Netlifyなどのサーバーレス環境でも動作します。

## セットアップ

### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. Firestore Databaseを作成（モード: 本番環境またはテストモード）

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Firebase Client SDK設定（Next.jsアプリ用）
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK設定（サーバーサイド用）
# オプション1: サービスアカウントキーをJSON文字列として設定
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# オプション2: サービスアカウントキーファイルのパスを設定
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Firestoreを使用するか（デフォルト: true）
USE_FIRESTORE=true
```

### 3. サービスアカウントキーの取得

1. Firebase Console > プロジェクト設定 > サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. ダウンロードしたJSONファイルをプロジェクトルートに配置、または環境変数に設定

### 4. Firestoreルールのデプロイ

```bash
firebase deploy --only firestore:rules
```

### 5. データの移行

既存のSQLiteデータをFirestoreに移行：

```bash
npm run migrate-to-firestore
```

## 使用方法

### データの移行

```bash
# SQLiteからFirestoreへ移行
npm run migrate-to-firestore
```

### Firestoreの無効化（開発用）

JSONファイルフォールバックを使用する場合：

```bash
USE_FIRESTORE=false npm run dev
```

## データ構造

### Jobsコレクション
- Document ID: `job_id`（文字列）
- Fields:
  - `job_id`: number
  - `job_requirements`: string
  - `job_title`: string | null
  - `company_name`: string | null
  - `location`: string | null
  - `job_description`: string | null
  - `salary_range`: string | null
  - `employment_type`: string | null
  - `experience_level`: string | null
  - `match_score`: number | null
  - `recommended`: number

### Usersコレクション
- Document ID: `user_id`（文字列）
- Fields:
  - `user_id`: number
  - `user_skills`: string

### UserInteractionsコレクション
- Document ID: 自動生成
- Fields:
  - `user_id`: number
  - `job_id`: number
  - `action`: string ('like' | 'dislike' | 'skip')
  - `timestamp`: Date

## Netlifyデプロイ時の設定

Netlifyの環境変数に以下を設定：

1. Firebase Client SDK設定（`NEXT_PUBLIC_*`で始まる変数）
2. Firebase Admin SDK設定（`FIREBASE_SERVICE_ACCOUNT_KEY`または`GOOGLE_APPLICATION_CREDENTIALS`）

注意: `GOOGLE_APPLICATION_CREDENTIALS`を使用する場合は、サービスアカウントキーをNetlifyにアップロードする必要があります。

## トラブルシューティング

### Firestore接続エラー

- 環境変数が正しく設定されているか確認
- Firestoreルールがデプロイされているか確認
- FirebaseプロジェクトIDが正しいか確認

### データが空になる

- `npm run migrate-to-firestore`を実行してデータを移行
- Firestore Consoleでデータが存在するか確認

