#!/usr/bin/env ts-node
/**
 * Jobデータにjob_titleを追加するスクリプト
 * Job_Requirementsから職種名を推測・生成する
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'jobs.db');

// スキルから職種名へのマッピング
const skillToJobTitleMap: Record<string, string[]> = {
  'Machine Learning': ['Machine Learning Engineer', 'ML Engineer', 'Data Scientist'],
  'Data Science': ['Data Scientist', 'Data Analyst', 'Data Engineer'],
  'AI': ['AI Engineer', 'Machine Learning Engineer', 'AI Researcher'],
  'Python': ['Python Developer', 'Software Engineer', 'Backend Developer'],
  'Java': ['Java Developer', 'Software Engineer', 'Backend Developer'],
  'JavaScript': ['JavaScript Developer', 'Frontend Developer', 'Full Stack Developer'],
  'C++': ['C++ Developer', 'Software Engineer', 'Systems Engineer'],
  'SQL': ['Database Administrator', 'Data Engineer', 'Backend Developer'],
  'HTML': ['Frontend Developer', 'Web Developer', 'UI Developer'],
  'CSS': ['Frontend Developer', 'Web Developer', 'UI/UX Developer'],
};

// スキル組み合わせから職種を推測
function inferJobTitle(jobRequirements: string): string {
  const skills = jobRequirements.split(',').map(s => s.trim());
  const skillLower = skills.map(s => s.toLowerCase());
  
  // スキルから職種候補を収集
  const jobTitleCandidates: Map<string, number> = new Map();
  
  for (const skill of skills) {
    for (const [key, titles] of Object.entries(skillToJobTitleMap)) {
      if (skill.toLowerCase().includes(key.toLowerCase())) {
        titles.forEach(title => {
          jobTitleCandidates.set(title, (jobTitleCandidates.get(title) || 0) + 1);
        });
      }
    }
  }
  
  // 最も一致度の高い職種を選択
  if (jobTitleCandidates.size > 0) {
    const sorted = Array.from(jobTitleCandidates.entries())
      .sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }
  
  // フォールバック: 主要スキルから推測
  if (skillLower.includes('machine learning') || skillLower.includes('ml')) {
    return 'Machine Learning Engineer';
  }
  if (skillLower.includes('data science') || skillLower.includes('data science')) {
    return 'Data Scientist';
  }
  if (skillLower.includes('javascript') && skillLower.includes('html')) {
    return 'Full Stack Developer';
  }
  if (skillLower.includes('python')) {
    return 'Python Developer';
  }
  if (skillLower.includes('java')) {
    return 'Java Developer';
  }
  
  // デフォルト
  return 'Software Engineer';
}

// 会社名を生成（ランダムな会社名リストから）
const companyNames = [
  'TechCorp Solutions',
  'DataWorks Inc.',
  'CloudTech Systems',
  'AI Innovations',
  'Digital Dynamics',
  'CodeForge Technologies',
  'InnovateLabs',
  'SmartSolutions Ltd.',
  'TechVenture Inc.',
  'FutureSystems',
];

function generateCompanyName(jobId: number): string {
  const index = jobId % companyNames.length;
  return companyNames[index];
}

// 場所を生成
const locations = [
  'Tokyo, Japan',
  'San Francisco, USA',
  'New York, USA',
  'London, UK',
  'Berlin, Germany',
  'Singapore',
  'Sydney, Australia',
  'Toronto, Canada',
  'Remote',
  'Hybrid',
];

function generateLocation(jobId: number): string {
  const index = jobId % locations.length;
  return locations[index];
}

async function updateJobsWithTitles() {
  console.log('🚀 Jobデータにjob_titleを追加します...\n');
  
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ データベースが見つかりません: ${dbPath}`);
    process.exit(1);
  }
  
  const db = new Database(dbPath);
  
  // 既存のjobsテーブルにカラムを追加（存在しない場合）
  try {
    db.exec(`
      ALTER TABLE jobs ADD COLUMN job_title TEXT;
      ALTER TABLE jobs ADD COLUMN company_name TEXT;
      ALTER TABLE jobs ADD COLUMN location TEXT;
      ALTER TABLE jobs ADD COLUMN job_description TEXT;
      ALTER TABLE jobs ADD COLUMN salary_range TEXT;
      ALTER TABLE jobs ADD COLUMN employment_type TEXT;
      ALTER TABLE jobs ADD COLUMN experience_level TEXT;
    `);
    console.log('✅ データベーススキーマを更新しました');
  } catch (error: any) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  カラムは既に存在します');
    } else {
      console.warn('⚠️  スキーマ更新でエラー:', error.message);
    }
  }
  
  // 全求人を取得
  const jobs = db.prepare('SELECT job_id, job_requirements FROM jobs').all() as Array<{
    job_id: number;
    job_requirements: string;
  }>;
  
  console.log(`📊 ${jobs.length}件の求人を処理します...\n`);
  
  // 更新用のステートメント
  const updateStmt = db.prepare(`
    UPDATE jobs
    SET job_title = ?,
        company_name = ?,
        location = ?,
        job_description = ?,
        salary_range = ?,
        employment_type = ?,
        experience_level = ?
    WHERE job_id = ?
  `);
  
  // トランザクションで一括更新
  const updateMany = db.transaction((jobsToUpdate: typeof jobs) => {
    let updated = 0;
    for (const job of jobsToUpdate) {
      // job_titleが既に存在する場合はスキップ
      const existing = db.prepare('SELECT job_title FROM jobs WHERE job_id = ?').get(job.job_id) as { job_title: string | null };
      
      if (existing.job_title) {
        continue; // 既にjob_titleがある場合はスキップ
      }
      
      const jobTitle = inferJobTitle(job.job_requirements);
      const companyName = generateCompanyName(job.job_id);
      const location = generateLocation(job.job_id);
      
      // 給与範囲を生成（経験レベルに基づいて）
      const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];
      const experienceLevel = experienceLevels[job.job_id % experienceLevels.length];
      
      const salaryRanges: Record<string, string> = {
        'Entry Level': '$50,000 - $80,000',
        'Mid Level': '$80,000 - $120,000',
        'Senior Level': '$120,000 - $180,000',
        'Executive': '$180,000+',
      };
      
      const salaryRange = salaryRanges[experienceLevel];
      const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
      const employmentType = employmentTypes[job.job_id % employmentTypes.length];
      
      // 簡易的なjob_descriptionを生成
      const jobDescription = `We are looking for a ${jobTitle} with expertise in ${job.job_requirements}. Join our team at ${companyName} to work on exciting projects.`;
      
      updateStmt.run(
        jobTitle,
        companyName,
        location,
        jobDescription,
        salaryRange,
        employmentType,
        experienceLevel,
        job.job_id
      );
      
      updated++;
      
      if (updated % 1000 === 0) {
        console.log(`   ✅ ${updated}件を更新しました...`);
      }
    }
    return updated;
  });
  
  const updatedCount = updateMany(jobs);
  
  console.log(`\n✅ 完了！${updatedCount}件の求人を更新しました`);
  
  // 統計情報を表示
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(job_title) as with_title,
      COUNT(DISTINCT job_title) as unique_titles
    FROM jobs
  `).get() as { total: number; with_title: number; unique_titles: number };
  
  console.log('\n📊 更新後の統計:');
  console.log(`   - 総求人数: ${stats.total}`);
  console.log(`   - job_titleがある求人: ${stats.with_title}`);
  console.log(`   - ユニークな職種数: ${stats.unique_titles}`);
  
  db.close();
}

// スクリプト実行
if (require.main === module) {
  updateJobsWithTitles()
    .then(() => {
      console.log('\n✨ 処理が完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ エラーが発生しました:', error);
      process.exit(1);
    });
}

export { updateJobsWithTitles, inferJobTitle };

