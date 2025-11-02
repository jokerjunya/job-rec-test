# Firestore有効化の手順（解決方法）

## エラーの原因

エラーメッセージ `7 PERMISSION_DENIED: Cloud Firestore API has not been used in project job-swipe-app-2025 before or it is disabled` は、Firestoreデータベースがまだ作成されていないことを示しています。

これは**正常なエラー**です。Firebaseプロジェクトを作成しただけでは、Firestoreは自動的に有効になりません。

## 解決手順

### 方法1: Firebase Consoleから作成（推奨）

1. **Firebase Consoleにアクセス**
   - https://console.firebase.google.com/project/job-swipe-app-2025/firestore
   - または、上記のブラウザで開いたページを使用

2. **データベースを作成**
   - 「データベースを作成」または「Create database」ボタンをクリック
   - セキュリティルールのモードを選択：
     - **テストモード**: 開発中はこちら（30日間の無料期間）
     - **本番環境モード**: 本番環境用（厳格なセキュリティルール）
   - ロケーションを選択（推奨: `nam5 (us-central)` または `asia-northeast1 (Tokyo)`）

3. **データベースの作成を待つ**
   - 数分かかる場合があります
   - 作成が完了すると、Firestore Consoleが表示されます

### 方法2: gcloudコマンドで有効化（上級者向け）

```bash
# Firestore APIを有効化
gcloud services enable firestore.googleapis.com --project=job-swipe-app-2025

# データベースを作成
gcloud firestore databases create --project=job-swipe-app-2025 --location=nam5
```

## データベース作成後の確認

Firestoreデータベースが作成されたら、以下を実行してください：

```bash
# データ移行を再実行
npm run migrate-to-firestore
```

正常に動作すれば、以下のようなメッセージが表示されます：
```
✅ Jobsコレクションへの移行完了: 500件
✅ Usersコレクションへの移行完了: 100000件
```

## トラブルシューティング

### まだエラーが出る場合

1. **数分待つ**: APIが有効化されるまで数分かかる場合があります
2. **プロジェクトIDを確認**: `.firebaserc`ファイルに正しいプロジェクトIDが設定されているか確認
3. **認証情報を確認**: gcloud認証が正しく設定されているか確認
   ```bash
   gcloud auth application-default print-access-token
   ```

### 権限エラーが出る場合

Firebaseプロジェクトのオーナー権限が必要です。プロジェクトの設定を確認してください。

