#!/usr/bin/env python3
"""
データセット統合スクリプト
3つのデータセットを統合して、完全な求人情報データベースを構築する
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import json
from pathlib import Path


class DatasetIntegrator:
    """データセット統合クラス"""
    
    def __init__(self):
        self.job_recommendation_df: Optional[pd.DataFrame] = None
        self.linkedin_jobs_df: Optional[pd.DataFrame] = None
        self.salary_df: Optional[pd.DataFrame] = None
        self.integrated_df: Optional[pd.DataFrame] = None
    
    def load_job_recommendation(self, filepath: str) -> pd.DataFrame:
        """
        現在のJob Recommendation Datasetを読み込む
        """
        print(f"📖 Loading Job Recommendation Dataset from {filepath}...")
        df = pd.read_csv(filepath)
        
        # スキルをリストに変換
        df['User_Skills_List'] = df['User_Skills'].str.split(', ')
        df['Job_Requirements_List'] = df['Job_Requirements'].str.split(', ')
        
        print(f"   ✅ Loaded {len(df)} rows")
        print(f"   📊 Unique Users: {df['User_ID'].nunique()}")
        print(f"   📊 Unique Jobs: {df['Job_ID'].nunique()}")
        
        self.job_recommendation_df = df
        return df
    
    def load_linkedin_jobs(self, filepath: str) -> pd.DataFrame:
        """
        LinkedIn Job Postings Datasetを読み込む
        """
        print(f"📖 Loading LinkedIn Job Postings from {filepath}...")
        df = pd.read_csv(filepath)
        
        # job_idを標準化（小文字/大文字の統一）
        if 'job_id' in df.columns:
            df['job_id'] = df['job_id'].astype(int)
        elif 'Job_ID' in df.columns:
            df['job_id'] = df['Job_ID'].astype(int)
            df = df.rename(columns={'Job_ID': 'job_id'})
        
        print(f"   ✅ Loaded {len(df)} rows")
        print(f"   📊 Unique Jobs: {df['job_id'].nunique()}")
        
        self.linkedin_jobs_df = df
        return df
    
    def load_salary_data(self, filepath: str) -> pd.DataFrame:
        """
        Data Science Job Salaries Datasetを読み込む
        """
        print(f"📖 Loading Salary Data from {filepath}...")
        df = pd.read_csv(filepath)
        
        # job_titleを標準化
        if 'job_title' in df.columns:
            df['job_title_normalized'] = df['job_title'].str.lower().str.strip()
        
        print(f"   ✅ Loaded {len(df)} rows")
        
        self.salary_df = df
        return df
    
    def normalize_job_requirements(self, requirements: str) -> List[str]:
        """
        スキル要件を正規化してリストに変換
        """
        if pd.isna(requirements):
            return []
        return [skill.strip() for skill in str(requirements).split(',')]
    
    def match_jobs_by_skills(self, tolerance: float = 0.7) -> pd.DataFrame:
        """
        スキル要件を使ってJob_IDとjob_idをマッチング
        """
        if self.job_recommendation_df is None or self.linkedin_jobs_df is None:
            raise ValueError("必要なデータセットが読み込まれていません")
        
        print("\n🔍 Matching jobs by skill requirements...")
        
        # ユニークなJob_IDとJob_Requirementsの組み合わせを取得
        job_requirements = self.job_recommendation_df[
            ['Job_ID', 'Job_Requirements']
        ].drop_duplicates()
        
        # スキルマッチング用の辞書を作成
        job_id_mapping = {}
        
        for _, row in job_requirements.iterrows():
            job_id = row['Job_ID']
            requirements = set(self.normalize_job_requirements(row['Job_Requirements']))
            
            # LinkedIn Datasetとマッチング
            for _, linkedin_row in self.linkedin_jobs_df.iterrows():
                linkedin_id = linkedin_row['job_id']
                
                # job_requirementsカラムがあるか確認
                if 'job_requirements' in linkedin_row:
                    linkedin_reqs = set(
                        self.normalize_job_requirements(linkedin_row['job_requirements'])
                    )
                elif 'requirements' in linkedin_row:
                    linkedin_reqs = set(
                        self.normalize_job_requirements(linkedin_row['requirements'])
                    )
                else:
                    continue
                
                # スキルの一致度を計算
                if len(requirements) > 0 and len(linkedin_reqs) > 0:
                    intersection = requirements.intersection(linkedin_reqs)
                    union = requirements.union(linkedin_reqs)
                    similarity = len(intersection) / len(union) if len(union) > 0 else 0
                    
                    if similarity >= tolerance:
                        if job_id not in job_id_mapping:
                            job_id_mapping[job_id] = []
                        job_id_mapping[job_id].append({
                            'linkedin_id': linkedin_id,
                            'similarity': similarity
                        })
        
        print(f"   ✅ Matched {len(job_id_mapping)} jobs")
        return job_id_mapping
    
    def integrate_datasets(
        self,
        use_skill_matching: bool = True,
        fallback_to_id_match: bool = True
    ) -> pd.DataFrame:
        """
        3つのデータセットを統合
        """
        print("\n🔗 Integrating datasets...")
        
        if self.job_recommendation_df is None:
            raise ValueError("Job Recommendation Datasetが読み込まれていません")
        
        # ステップ1: Job Recommendation Datasetをベースに
        integrated = self.job_recommendation_df.copy()
        
        # ステップ2: LinkedIn Datasetと結合（Job_IDで直接マッチ）
        if self.linkedin_jobs_df is not None:
            print("   📎 Merging with LinkedIn Job Postings...")
            
            if use_skill_matching:
                # スキルマッチングを使用
                job_mapping = self.match_jobs_by_skills()
                # 最良のマッチを選択
                mapping_df = pd.DataFrame([
                    {
                        'Job_ID': job_id,
                        'linkedin_job_id': matches[0]['linkedin_id'],
                        'skill_similarity': matches[0]['similarity']
                    }
                    for job_id, matches in job_mapping.items()
                    if len(matches) > 0
                ])
                
                # LinkedInデータを結合
                linkedin_merged = mapping_df.merge(
                    self.linkedin_jobs_df,
                    left_on='linkedin_job_id',
                    right_on='job_id',
                    how='left',
                    suffixes=('', '_linkedin')
                )
                
                integrated = integrated.merge(
                    linkedin_merged[['Job_ID'] + [
                        col for col in linkedin_merged.columns 
                        if col not in ['Job_ID', 'linkedin_job_id']
                    ]],
                    on='Job_ID',
                    how='left'
                )
            elif fallback_to_id_match:
                # Job_IDで直接マッチ
                integrated = integrated.merge(
                    self.linkedin_jobs_df,
                    left_on='Job_ID',
                    right_on='job_id',
                    how='left',
                    suffixes=('', '_linkedin')
                )
            
            print(f"   ✅ Merged LinkedIn data: {integrated['job_title'].notna().sum()} jobs matched")
        
        # ステップ3: Salary Datasetと結合（job_titleでマッチ）
        if self.salary_df is not None and 'job_title' in integrated.columns:
            print("   💰 Merging with Salary Data...")
            
            # job_titleを正規化
            integrated['job_title_normalized'] = integrated['job_title'].str.lower().str.strip()
            
            # 給与データを集約（同じ職種の平均給与を計算）
            salary_agg = self.salary_df.groupby('job_title_normalized').agg({
                'salary_in_usd': ['mean', 'median', 'min', 'max', 'count']
            }).reset_index()
            
            salary_agg.columns = [
                'job_title_normalized',
                'avg_salary_usd',
                'median_salary_usd',
                'min_salary_usd',
                'max_salary_usd',
                'salary_data_count'
            ]
            
            integrated = integrated.merge(
                salary_agg,
                on='job_title_normalized',
                how='left'
            )
            
            print(f"   ✅ Merged salary data: {integrated['avg_salary_usd'].notna().sum()} jobs matched")
        
        self.integrated_df = integrated
        print(f"\n✅ Integration complete! Total rows: {len(integrated)}")
        
        return integrated
    
    def save_integrated_dataset(self, output_path: str, format: str = 'csv'):
        """
        統合されたデータセットを保存
        """
        if self.integrated_df is None:
            raise ValueError("統合データがありません。先にintegrate_datasets()を実行してください")
        
        print(f"\n💾 Saving integrated dataset to {output_path}...")
        
        if format == 'csv':
            self.integrated_df.to_csv(output_path, index=False)
        elif format == 'parquet':
            self.integrated_df.to_parquet(output_path, index=False)
        elif format == 'json':
            self.integrated_df.to_json(output_path, orient='records', indent=2)
        
        print(f"   ✅ Saved successfully!")
    
    def generate_mapping_report(self, output_path: str):
        """
        マッピング結果のレポートを生成
        """
        if self.integrated_df is None:
            raise ValueError("統合データがありません")
        
        report = {
            'total_rows': len(self.integrated_df),
            'unique_users': self.integrated_df['User_ID'].nunique() if 'User_ID' in self.integrated_df else 0,
            'unique_jobs': self.integrated_df['Job_ID'].nunique() if 'Job_ID' in self.integrated_df else 0,
            'linkedin_matched': self.integrated_df['job_title'].notna().sum() if 'job_title' in self.integrated_df else 0,
            'salary_matched': self.integrated_df['avg_salary_usd'].notna().sum() if 'avg_salary_usd' in self.integrated_df else 0,
            'columns': list(self.integrated_df.columns)
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"📊 Mapping report saved to {output_path}")
        return report


def main():
    """
    メイン実行関数
    """
    print("=" * 60)
    print("🚀 データセット統合ツール")
    print("=" * 60)
    
    integrator = DatasetIntegrator()
    
    # データセットを読み込む
    # 注: 実際のファイルパスに置き換えてください
    try:
        integrator.load_job_recommendation('Job Datsset.csv')
    except FileNotFoundError:
        print("⚠️  Job Recommendation Datasetが見つかりません")
    
    # LinkedIn Dataset（ダウンロード後にパスを指定）
    linkedin_path = input("\n📁 LinkedIn Job Postings CSVのパス (Enterでスキップ): ").strip()
    if linkedin_path and Path(linkedin_path).exists():
        integrator.load_linkedin_jobs(linkedin_path)
    
    # Salary Dataset（ダウンロード後にパスを指定）
    salary_path = input("📁 Salary Dataset CSVのパス (Enterでスキップ): ").strip()
    if salary_path and Path(salary_path).exists():
        integrator.load_salary_data(salary_path)
    
    # データセットを統合
    if integrator.job_recommendation_df is not None:
        integrated = integrator.integrate_datasets(
            use_skill_matching=True,
            fallback_to_id_match=True
        )
        
        # 統合データを保存
        output_file = 'integrated_job_dataset.csv'
        integrator.save_integrated_dataset(output_file)
        
        # レポートを生成
        integrator.generate_mapping_report('integration_report.json')
        
        print("\n" + "=" * 60)
        print("✅ 統合完了!")
        print("=" * 60)
    else:
        print("\n❌ 統合するデータセットがありません")


if __name__ == '__main__':
    main()

