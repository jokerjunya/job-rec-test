# Firestoreデータベース作成コマンド（実行手順）

## 前提条件
- Firebase CLIがインストールされていること（確認済み: v14.16.0）
- 正しいGoogleアカウントでログインしていること

## 実行手順

### 1. Firebase CLIでログイン（まだの場合）
```bash
firebase login
```

### 2. プロジェクトを確認
```bash
cd /Users/01062544/Documents/job-rec-test
firebase use job-swipe-app-2025
```

### 3. Firestore APIを有効化（gcloud経由）
```bash
gcloud config set project job-swipe-app-2025
gcloud services enable firestore.googleapis.com
```

### 4. Firestoreデータベースを作成
```bash
gcloud firestore databases create --location=nam5
```

または、Firebase CLIから直接：
```bash
firebase init firestore
```
（既存の設定がある場合は上書きしない）

### 5. データ移行を実行
```bash
npm run migrate-to-firestore
```

## トラブルシューティング

### 権限エラーが出る場合
- Firebase Consoleでプロジェクトのオーナー権限があることを確認
- 別のアカウントでログインしている可能性があるため、アカウントを切り替え：
  ```bash
  firebase logout
  firebase login
  ```

### APIが有効化されない場合
- Firebase Consoleから手動で有効化：
  https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=job-swipe-app-2025

