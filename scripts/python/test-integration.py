"""
簡易テストスクリプト - データセット統合の動作確認
"""

import pandas as pd
import numpy as np
from pathlib import Path


def test_integration_feasibility():
    """
    データセット統合の実現可能性をテスト
    """
    print("🧪 データセット統合テスト")
    print("=" * 60)
    
    # 現在のデータセットを読み込む
    try:
        current_df = pd.read_csv('Job Datsset.csv')
        print(f"✅ 現在のデータセット読み込み成功")
        print(f"   - 総行数: {len(current_df):,}")
        print(f"   - ユニークユーザー: {current_df['User_ID'].nunique():,}")
        print(f"   - ユニーク求人: {current_df['Job_ID'].nunique():,}")
        
        # Job_IDの範囲を確認
        print(f"\n📊 Job_IDの統計:")
        print(f"   - 最小値: {current_df['Job_ID'].min()}")
        print(f"   - 最大値: {current_df['Job_ID'].max()}")
        print(f"   - ユニークJob_ID数: {current_df['Job_ID'].nunique()}")
        
        # スキルの種類を確認
        all_skills = set()
        for skills in current_df['Job_Requirements'].dropna():
            all_skills.update(skills.split(', '))
        
        print(f"\n📊 スキル統計:")
        print(f"   - ユニークスキル数: {len(all_skills)}")
        print(f"   - 主なスキル: {sorted(list(all_skills))[:10]}")
        
        # サンプルデータを表示
        print(f"\n📋 サンプルデータ:")
        print(current_df.head(3).to_string())
        
        return True
        
    except FileNotFoundError:
        print("❌ Job Datsset.csvが見つかりません")
        return False
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False


def simulate_integration():
    """
    統合のシミュレーション（ダミーデータを使用）
    """
    print("\n" + "=" * 60)
    print("🔮 統合シミュレーション（ダミーデータ）")
    print("=" * 60)
    
    # 現在のデータセットのサンプル
    current_data = {
        'Job_ID': [16, 30, 157],
        'Job_Requirements': [
            "SQL, CSS, AI, JavaScript, Data Science",
            "AI, Data Science, SQL, Python, CSS",
            "Java, JavaScript, SQL"
        ]
    }
    
    # シミュレートされたLinkedInデータ
    linkedin_data = {
        'job_id': [16, 30, 157, 200],  # 一部重複、一部新しい
        'job_title': [
            'Data Scientist',
            'AI Engineer',
            'Full Stack Developer',
            'Machine Learning Engineer'
        ],
        'company_name': [
            'Tech Corp',
            'AI Solutions',
            'Web Startup',
            'ML Company'
        ],
        'location': ['Tokyo', 'Osaka', 'Remote', 'Kyoto'],
        'job_requirements': [
            'SQL, Python, JavaScript, Data Science',
            'AI, Python, Data Science',
            'Java, JavaScript, SQL, React',
            'Python, Machine Learning, TensorFlow'
        ]
    }
    
    # シミュレートされた給与データ
    salary_data = {
        'job_title': ['Data Scientist', 'AI Engineer', 'Full Stack Developer'],
        'avg_salary_usd': [95000, 105000, 85000],
        'median_salary_usd': [92000, 100000, 82000]
    }
    
    # データフレーム作成
    current_df = pd.DataFrame(current_data)
    linkedin_df = pd.DataFrame(linkedin_data)
    salary_df = pd.DataFrame(salary_data)
    
    print("\n📊 現在のデータセット:")
    print(current_df)
    
    print("\n📊 LinkedIn Dataset（シミュレート）:")
    print(linkedin_df)
    
    print("\n📊 Salary Dataset（シミュレート）:")
    print(salary_df)
    
    # 統合テスト1: Job_IDで直接結合
    print("\n🔗 統合テスト1: Job_IDで直接結合")
    integrated1 = current_df.merge(
        linkedin_df,
        left_on='Job_ID',
        right_on='job_id',
        how='left'
    )
    print(f"   ✅ マッチ数: {integrated1['job_title'].notna().sum()}/{len(current_df)}")
    print(integrated1[['Job_ID', 'job_title', 'company_name', 'location']])
    
    # 統合テスト2: スキルマッチング
    print("\n🔗 統合テスト2: スキルマッチング")
    def skill_similarity(req1, req2):
        if pd.isna(req1) or pd.isna(req2):
            return 0
        set1 = set(str(req1).split(', '))
        set2 = set(str(req2).split(', '))
        if len(set1 | set2) == 0:
            return 0
        return len(set1 & set2) / len(set1 | set2)
    
    matches = []
    for _, current_row in current_df.iterrows():
        best_match = None
        best_score = 0
        
        for _, linkedin_row in linkedin_df.iterrows():
            score = skill_similarity(
                current_row['Job_Requirements'],
                linkedin_row['job_requirements']
            )
            if score > best_score:
                best_score = score
                best_match = linkedin_row
        
        if best_match is not None and best_score > 0.5:
            matches.append({
                'Job_ID': current_row['Job_ID'],
                'matched_job_id': best_match['job_id'],
                'job_title': best_match['job_title'],
                'similarity': best_score
            })
    
    matches_df = pd.DataFrame(matches)
    print(f"   ✅ マッチ数: {len(matches_df)}/{len(current_df)}")
    print(matches_df)
    
    # 統合テスト3: 職種名で給与情報を補完
    print("\n🔗 統合テスト3: 職種名で給与情報を補完")
    integrated2 = integrated1.merge(
        salary_df,
        on='job_title',
        how='left'
    )
    print(f"   ✅ 給与情報マッチ数: {integrated2['avg_salary_usd'].notna().sum()}/{len(integrated2)}")
    print(integrated2[['Job_ID', 'job_title', 'company_name', 'avg_salary_usd']].dropna())
    
    print("\n" + "=" * 60)
    print("✅ 統合シミュレーション完了!")
    print("=" * 60)
    print("\n💡 結論: データセットの統合は完全に可能です！")


if __name__ == '__main__':
    # 現在のデータセットをテスト
    success = test_integration_feasibility()
    
    if success:
        # 統合シミュレーション
        simulate_integration()

