# 🔍 ユーザー行動ログを含むデータセット調査

## 📊 現在のデータセット分析結果

### Recommended列の特徴
- **Recommended=1**: 19,927件 (19.9%) ← 「興味あり」として扱える可能性
- **Recommended=0**: 80,073件 (80.1%)
- **Match_Scoreとの相関**: 
  - Recommended=1の平均: 0.900
  - Recommended=0の平均: 0.399
  - **→ 高い相関あり！**

### 問題点
- これは「学習済みの推奨結果」であり、実際のユーザー行動ではない
- タイムスタンプがない（いつ興味を持ったか不明）
- ユーザーごとの行動パターンが不明

---

## 🎯 ユーザー行動ログを含むデータセット候補

### 1. **Movielens / 推薦システムデータセット**
```
✅ ユーザーID
✅ アイテムID（映画の場合）
✅ 評価（1-5点）
✅ タイムスタンプ
❌ 求人データではない
```

**類似データセットを探す**: 求人推薦システム用のMovielens形式データセット

---

### 2. **Last.fm / Spotify データセット**
```
✅ ユーザーの音楽聴取履歴
✅ タイムスタンプ
✅ 再生回数
❌ 求人データではない
```

**応用**: ユーザーの行動パターン学習に使える可能性

---

### 3. **Amazon Product Reviews / インタラクションデータ**
```
✅ ユーザーID
✅ 商品ID
✅ 評価・レビュー
✅ タイムスタンプ
❌ 求人データではない
```

---

### 4. **GitHub上で公開されている求人推薦データセット**
- 大学の研究プロジェクトで公開されている可能性
- 実際のユーザーインタラクションを含む可能性

---

## 💡 推奨アプローチ

### オプションA: 現在の`Recommended`列を「疑似興味あり」として扱う

```python
# Recommended=1を「興味あり」として扱う
interactions = df[df['Recommended'] == 1].copy()
interactions['action'] = 'like'
interactions['timestamp'] = pd.Timestamp.now()  # ダミータイムスタンプ

# 協調フィルタリングに使用可能
# ただし、実際のユーザー行動ではない点に注意
```

**メリット**:
- ✅ すぐに使える
- ✅ 10万件のデータがある
- ✅ Match_Scoreとの相関が高い

**デメリット**:
- ⚠️  実際のユーザー行動ではない
- ⚠️  タイムスタンプがない

---

### オプションB: 公開データセットを探す

検索キーワード:
- "job recommendation dataset user interactions"
- "job recommendation dataset user clicks"
- "job matching dataset user feedback"
- "career recommendation dataset user behavior"

---

### オプションC: ダミーログ生成

```python
# 現在のデータセットから、より現実的なログを生成
def generate_realistic_logs(df):
    logs = []
    
    for user_id in df['User_ID'].unique():
        user_data = df[df['User_ID'] == user_id]
        
        # ユーザーは複数の求人を見る
        # Match_Scoreが高い順に見る
        user_data_sorted = user_data.sort_values('Match_Score', ascending=False)
        
        # 上位N件を見る（ユーザーごとに異なる）
        num_views = np.random.randint(5, 20)
        viewed_jobs = user_data_sorted.head(num_views)
        
        for _, row in viewed_jobs.iterrows():
            # Match_Scoreに基づいて、確率的にlike/dislikeを決定
            # Match_Scoreが高いほどlikeしやすい
            like_probability = row['Match_Score'] * 0.9  # 調整可能
            
            action = 'like' if np.random.random() < like_probability else 'dislike'
            
            # タイムスタンプも生成（段階的に見る）
            timestamp = pd.Timestamp.now() - pd.Timedelta(
                days=np.random.randint(0, 30)
            )
            
            logs.append({
                'user_id': user_id,
                'job_id': row['Job_ID'],
                'action': action,
                'timestamp': timestamp,
                'match_score': row['Match_Score']
            })
    
    return pd.DataFrame(logs)
```

---

## 🔍 実際に探すべきデータセット

1. **Kaggle**: "job recommendation user interactions"
2. **GitHub**: "job recommendation dataset"
3. **Google Dataset Search**: "job recommendation user behavior"
4. **UCI Machine Learning Repository**: 推薦システム関連
5. **Papers with Code**: 求人推薦システムの研究論文のデータセット

---

## 📋 推奨アクション

1. **今すぐ使える**: `Recommended`列を「疑似興味あり」として扱う
2. **短期**: より現実的なログを生成するスクリプトを作成
3. **長期**: 実際のユーザー行動ログを含むデータセットを探す / 本番で蓄積

