# Firebase Firestore有効化手順

## 現在の状況

Firebaseプロジェクト `job-swipe-app-2025` が作成されましたが、Firestore APIがまだ有効になっていません。

## 次のステップ

### 1. Firestore APIを有効化

以下のリンクからFirestore APIを有効化してください：
https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=job-swipe-app-2025

または、Firebase Consoleから：
1. https://console.firebase.google.com/project/job-swipe-app-2025/firestore
2. 「データベースを作成」をクリック
3. 本番環境モードまたはテストモードを選択
4. ロケーションを選択（推奨: nam5 (us-central)）

### 2. データの移行

Firestore APIが有効になったら、以下を実行：

```bash
npm run migrate-to-firestore
```

### 3. Firestoreルールのデプロイ

```bash
firebase deploy --only firestore:rules --project job-swipe-app-2025
```

### 4. 環境変数の設定

`.env.local`ファイルを作成して、Firebase設定を追加してください（既に作成済みの場合も確認）。

## 注意事項

- Firestore APIが有効になるまで数分かかる場合があります
- データ移行にはgcloud認証またはサービスアカウントキーが必要です
- Netlifyデプロイ時は環境変数にFirebase設定を追加してください

