# プロジェクト構造

```
job-rec-test/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── interactions/  # インタラクションAPI
│   │   └── jobs/          # 求人API
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # メインページ
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/uiコンポーネント
│   ├── JobCard.tsx       # 求人カード
│   ├── SwipeableCard.tsx # スワイプ可能なカード
│   └── SwipeActions.tsx  # スワイプアクションボタン
├── data/                 # データファイル
│   └── jobs.db           # SQLiteデータベース
├── docs/                 # ドキュメント
│   ├── data-integration-plan.md
│   ├── integration-feasibility.md
│   └── user-interaction-research.md
├── lib/                  # ユーティリティ
│   ├── db.ts             # データベース接続
│   ├── schema.ts         # 型定義
│   └── utils.ts          # 汎用ユーティリティ
├── scripts/              # スクリプト
│   ├── import-csv.ts     # CSVインポートスクリプト
│   └── python/           # Pythonスクリプト（旧ファイル）
│       ├── generate-user-logs.py
│       ├── integrate-datasets.py
│       └── test-integration.py
├── .gitignore
├── components.json        # shadcn/ui設定
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

