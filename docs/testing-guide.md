# エラーチェックとテスト手順

## ビルド確認

```bash
npm run build
```

✅ **結果**: ビルド成功（警告のみ）

## Lint確認

```bash
npm run lint
```

✅ **結果**: Lintエラーなし

## 開発サーバー起動

```bash
npm run dev
```

サーバーは http://localhost:3000 で起動します。

## UIテスト手順

1. **ブラウザで http://localhost:3000 を開く**

2. **確認項目**:
   - [ ] ページが正常に読み込まれる
   - [ ] 求人カードが表示される
   - [ ] スワイプ操作が動作する（マウス/タッチ）
   - [ ] ボタン操作が動作する（いいね/スキップ）
   - [ ] インタラクションログが保存される
   - [ ] 次の求人が自動的に表示される

3. **API動作確認**:
   ```bash
   # 求人一覧取得
   curl http://localhost:3000/api/jobs?userId=1&limit=5
   
   # インタラクション記録
   curl -X POST http://localhost:3000/api/interactions \
     -H "Content-Type: application/json" \
     -d '{"user_id":1,"job_id":16,"action":"like"}'
   
   # インタラクション履歴取得
   curl http://localhost:3000/api/interactions?userId=1
   ```

## 既知の警告

- API Routesの動的レンダリング警告（正常動作に影響なし）
  - `/api/jobs` が `nextUrl.searchParams` を使用しているため
  - これは期待される動作です

