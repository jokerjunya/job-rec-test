# Netlify対応の修正完了

## 修正内容

### 1. JSONファイルベースのデータストアに変更 ✅
- `lib/data.ts`: JSONファイルからデータを読み込む新しいモジュール
- SQLiteの代わりに`data/jobs.json`を使用
- サーバーレス環境でも動作可能

### 2. API Routesに動的設定を追加 ✅
- すべてのAPI Routesに`export const dynamic = 'force-dynamic'`を追加
- Netlifyで動的レンダリングが正しく動作するように設定

### 3. Netlify設定ファイルの追加 ✅
- `netlify.toml`: Netlify用の設定ファイル
- Next.jsプラグインを使用

### 4. ビルドスクリプトの調整 ✅
- `scripts/export-json.ts`: SQLiteからJSONへのエクスポートスクリプト
- `package.json`: ビルド前にデータを準備するスクリプトを追加

## 変更点

### 削除された依存関係
- `better-sqlite3`は開発時のCSVインポートにのみ使用（本番環境では不要）

### 新しいファイル
- `lib/data.ts`: JSONベースのデータアクセス
- `scripts/export-json.ts`: データエクスポートスクリプト
- `netlify.toml`: Netlify設定
- `data/jobs.json`: 求人データ（リポジトリに含める）

## 動作確認

### ローカル環境
```bash
npm run build  # ✅ 成功
npm run dev    # 正常動作
```

### Netlify環境
- ビルド時に`prepare-data`スクリプトが実行される
- JSONファイルが存在しない場合は空のデータで動作
- API Routesは動的レンダリングとして動作

## 注意事項

1. **インタラクションデータ**: サーバーレス環境では永続化されません（メモリのみ）
   - 本番環境では外部データベースサービスの使用を推奨

2. **データ更新**: CSVファイルを更新した場合は、以下を実行：
   ```bash
   npm run import-csv
   npm run prepare-data
   ```

3. **Netlifyデプロイ**: `data/jobs.json`がリポジトリに含まれていることを確認

