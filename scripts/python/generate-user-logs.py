#!/usr/bin/env python3
"""
ユーザー行動ログ生成スクリプト
現在のデータセットのRecommended列から、より現実的なユーザーインタラクションログを生成
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import json


class UserInteractionLogGenerator:
    """ユーザーインタラクションログ生成クラス"""
    
    def __init__(self, csv_path: str):
        """
        初期化
        
        Args:
            csv_path: Job Recommendation Datasetのパス
        """
        print(f"📖 Loading dataset from {csv_path}...")
        self.df = pd.read_csv(csv_path)
        print(f"   ✅ Loaded {len(self.df):,} rows")
    
    def generate_realistic_logs(
        self,
        views_per_user_min: int = 5,
        views_per_user_max: int = 20,
        like_probability_multiplier: float = 0.9
    ) -> pd.DataFrame:
        """
        現実的なユーザーインタラクションログを生成
        
        Args:
            views_per_user_min: ユーザーが1日あたり見る求人の最小数
            views_per_user_max: ユーザーが1日あたり見る求人の最大数
            like_probability_multiplier: like確率の調整係数
        
        Returns:
            ユーザーインタラクションログのDataFrame
        """
        print("\n🔨 Generating realistic user interaction logs...")
        
        logs = []
        unique_users = self.df['User_ID'].unique()
        
        # 各ユーザーごとにログを生成
        for idx, user_id in enumerate(unique_users):
            if (idx + 1) % 10000 == 0:
                print(f"   Processing user {idx + 1}/{len(unique_users)}...")
            
            user_data = self.df[self.df['User_ID'] == user_id].copy()
            
            # Match_Scoreが高い順にソート（ユーザーはマッチ度の高い求人から見る）
            user_data_sorted = user_data.sort_values('Match_Score', ascending=False)
            
            # ユーザーが1日あたり見る求人数（ランダム）
            num_views = np.random.randint(views_per_user_min, views_per_user_max + 1)
            
            # 上位N件を見る
            viewed_jobs = user_data_sorted.head(num_views)
            
            # 見た順番にタイムスタンプを生成（過去30日間）
            base_date = datetime.now()
            
            for view_idx, (_, row) in enumerate(viewed_jobs.iterrows()):
                # タイムスタンプ: 過去30日間のランダムな時刻
                days_ago = np.random.randint(0, 30)
                hours_ago = np.random.randint(0, 24)
                minutes_ago = np.random.randint(0, 60)
                
                timestamp = base_date - timedelta(
                    days=days_ago,
                    hours=hours_ago,
                    minutes=minutes_ago
                )
                
                # Match_Scoreに基づいて、確率的にlike/dislikeを決定
                # Match_Scoreが高いほどlikeしやすい
                # ただし、Recommended=1の場合は確実にlike
                if row['Recommended'] == 1:
                    action = 'like'
                    confidence = 1.0
                else:
                    # Match_Scoreに基づく確率
                    like_probability = row['Match_Score'] * like_probability_multiplier
                    
                    # 確率的に決定
                    action = 'like' if np.random.random() < like_probability else 'dislike'
                    confidence = like_probability
                
                # スワイプ時間（ミリ秒）- 短いほどdislikeしやすい
                if action == 'like':
                    swipe_duration_ms = np.random.randint(2000, 10000)  # 2-10秒
                else:
                    swipe_duration_ms = np.random.randint(500, 2000)  # 0.5-2秒
                
                logs.append({
                    'user_id': int(user_id),
                    'job_id': int(row['Job_ID']),
                    'action': action,
                    'timestamp': timestamp.isoformat(),
                    'match_score': float(row['Match_Score']),
                    'swipe_duration_ms': int(swipe_duration_ms),
                    'confidence': float(confidence),
                    'user_skills': row['User_Skills'],
                    'job_requirements': row['Job_Requirements']
                })
        
        logs_df = pd.DataFrame(logs)
        print(f"\n✅ Generated {len(logs_df):,} interaction logs")
        print(f"   - Likes: {(logs_df['action'] == 'like').sum():,} ({(logs_df['action'] == 'like').sum() / len(logs_df) * 100):.1f}%)")
        print(f"   - Dislikes: {(logs_df['action'] == 'dislike').sum():,} ({(logs_df['action'] == 'dislike').sum() / len(logs_df) * 100):.1f}%)")
        
        return logs_df
    
    def generate_simple_logs(self) -> pd.DataFrame:
        """
        シンプルなログ生成（Recommended列をそのまま使用）
        """
        print("\n🔨 Generating simple interaction logs...")
        
        logs = []
        
        for _, row in self.df.iterrows():
            # Recommended=1 → like, Recommended=0 → dislike
            action = 'like' if row['Recommended'] == 1 else 'dislike'
            
            # タイムスタンプは現在時刻（ダミー）
            timestamp = datetime.now()
            
            logs.append({
                'user_id': int(row['User_ID']),
                'job_id': int(row['Job_ID']),
                'action': action,
                'timestamp': timestamp.isoformat(),
                'match_score': float(row['Match_Score']),
                'user_skills': row['User_Skills'],
                'job_requirements': row['Job_Requirements']
            })
        
        logs_df = pd.DataFrame(logs)
        print(f"✅ Generated {len(logs_df):,} interaction logs")
        
        return logs_df
    
    def save_logs(self, logs_df: pd.DataFrame, output_path: str, format: str = 'csv'):
        """
        ログを保存
        
        Args:
            logs_df: ログのDataFrame
            output_path: 出力パス
            format: 保存形式 ('csv', 'json', 'parquet')
        """
        print(f"\n💾 Saving logs to {output_path}...")
        
        if format == 'csv':
            logs_df.to_csv(output_path, index=False)
        elif format == 'json':
            logs_df.to_json(output_path, orient='records', indent=2)
        elif format == 'parquet':
            logs_df.to_parquet(output_path, index=False)
        
        print(f"   ✅ Saved successfully!")
        
        # 統計情報を表示
        print(f"\n📊 Log Statistics:")
        print(f"   - Total logs: {len(logs_df):,}")
        print(f"   - Unique users: {logs_df['user_id'].nunique():,}")
        print(f"   - Unique jobs: {logs_df['job_id'].nunique():,}")
        print(f"   - Likes: {(logs_df['action'] == 'like').sum():,}")
        print(f"   - Dislikes: {(logs_df['action'] == 'dislike').sum():,}")
        
        # ユーザーごとの平均インタラクション数
        user_interactions = logs_df.groupby('user_id').size()
        print(f"   - Avg interactions per user: {user_interactions.mean():.2f}")
        print(f"   - Min interactions per user: {user_interactions.min()}")
        print(f"   - Max interactions per user: {user_interactions.max()}")


def main():
    """
    メイン実行関数
    """
    print("=" * 60)
    print("🚀 ユーザーインタラクションログ生成ツール")
    print("=" * 60)
    
    # ログ生成器を初期化
    generator = UserInteractionLogGenerator('Job Datsset.csv')
    
    # 生成方法を選択
    print("\n生成方法を選択してください:")
    print("1. 現実的なログ生成（推奨）- タイムスタンプ、スワイプ時間など含む")
    print("2. シンプルなログ生成 - Recommended列をそのまま使用")
    
    choice = input("\n選択 (1 or 2, default: 1): ").strip() or "1"
    
    if choice == "1":
        logs_df = generator.generate_realistic_logs(
            views_per_user_min=5,
            views_per_user_max=20,
            like_probability_multiplier=0.9
        )
        output_file = 'user_interaction_logs_realistic.csv'
    else:
        logs_df = generator.generate_simple_logs()
        output_file = 'user_interaction_logs_simple.csv'
    
    # ログを保存
    generator.save_logs(logs_df, output_file, format='csv')
    
    print("\n" + "=" * 60)
    print("✅ 完了!")
    print("=" * 60)
    print(f"\n📁 出力ファイル: {output_file}")
    print("\n💡 このログを使って協調フィルタリングを実装できます！")


if __name__ == '__main__':
    main()

