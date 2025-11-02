// データベーススキーマの型定義

export interface Job {
  job_id: number;
  job_requirements: string;
  job_title?: string;
  company_name?: string;
  location?: string;
  job_description?: string;
  salary_range?: string;
  employment_type?: string;
  experience_level?: string;
  match_score?: number;
  recommended?: number;
}

export interface User {
  user_id: number;
  user_skills: string;
}

export interface UserInteraction {
  interaction_id?: number;
  user_id: number;
  job_id: number;
  action: 'like' | 'dislike' | 'skip';
  timestamp?: string;
}

export interface JobWithDetails extends Job {
  // 将来的に追加される可能性のあるフィールド
  job_title?: string;
  company_name?: string;
  location?: string;
  salary_range?: string;
}

