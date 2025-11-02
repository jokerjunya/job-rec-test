# 📊 データセット統合計画

## 3つのデータセットの構造

### 1. Job Recommendation Dataset (現在保有)
```
- User_ID: ユーザーID
- Job_ID: 求人ID
- User_Skills: ユーザースキル（カンマ区切り）
- Job_Requirements: 求人要件（カンマ区切り）
- Match_Score: マッチングスコア（0-1）
- Recommended: 推奨フラグ（0/1）
```

### 2. LinkedIn Job Postings Dataset (ダウンロード予定)
```
- job_id: 求人ID
- job_title: 職種名
- company_name: 会社名
- location: 勤務地
- job_description: 求人説明
- job_requirements: スキル要件
- salary_range: 給与範囲
- employment_type: 雇用形態
- experience_level: 経験レベル
- posted_date: 投稿日
```

### 3. Data Science Job Salaries Dataset (ダウンロード予定)
```
- job_title: 職種名
- salary: 給与情報
- salary_currency: 通貨
- salary_in_usd: USD換算給与
- employee_residence: 従業員所在地
- experience_level: 経験レベル
- employment_type: 雇用形態
- work_setting: 勤務形態（リモート/ハイブリッド/オフィス）
- company_location: 会社所在地
- company_size: 会社規模
```

## 🔗 データ結合戦略

### 結合キー
- **Job_ID** ↔ **job_id** (LinkedIn Dataset)
- **Job_Requirements** ↔ **job_requirements** (スキルマッチング)
- **job_title** ↔ **job_title** (給与データ補完)

### 統合後のデータ構造
```typescript
interface IntegratedJob {
  // 元のデータセットから
  job_id: number;
  job_requirements: string[];
  match_score?: number;
  recommended?: number;
  
  // LinkedIn Datasetから
  job_title: string;
  company_name: string;
  location: string;
  job_description: string;
  salary_range?: string;
  employment_type?: string;
  experience_level?: string;
  posted_date?: Date;
  
  // Salary Datasetから（補完データ）
  salary_in_usd?: number;
  work_setting?: string;
  company_size?: string;
}
```

