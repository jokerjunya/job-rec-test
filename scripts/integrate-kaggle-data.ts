#!/usr/bin/env ts-node
/**
 * Kaggleデータセットを統合してデータベースを更新するスクリプト
 * 
 * 使用方法:
 *   1. Kaggleからデータセットをダウンロード（例: LinkedIn Job Postings Dataset）
 *   2. このスクリプトを実行してデータを統合
 * 
 * 例:
 *   ts-node scripts/integrate-kaggle-data.ts --linkedin linkedin_jobs.csv --salary salaries.csv
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const dbPath = path.join(process.cwd(), 'data', 'jobs.db');

interface LinkedInJobRow {
  job_id?: string;
  Job_ID?: string;
  job_title?: string;
  title?: string;
  company_name?: string;
  company?: string;
  location?: string;
  job_description?: string;
  description?: string;
  job_requirements?: string;
  requirements?: string;
  salary_range?: string;
  salary?: string;
  employment_type?: string;
  experience_level?: string;
  [key: string]: any;
}

interface SalaryRow {
  job_title?: string;
  salary_in_usd?: string;
  salary?: string;
  company_location?: string;
  experience_level?: string;
  employment_type?: string;
  [key: string]: any;
}

function normalizeColumnName(col: string): string {
  return col.toLowerCase().replace(/[_\s]+/g, '_');
}

function loadCsvFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }
  
  console.log(`📖 CSVファイルを読み込み中: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  });
  
  console.log(`   ✅ ${records.length}件のレコードを読み込みました`);
  return records;
}

function integrateLinkedInData(linkedinPath: string): void {
  console.log('\n🔗 LinkedInデータを統合中...');
  
  const records = loadCsvFile(linkedinPath) as LinkedInJobRow[];
  const db = new Database(dbPath);
  
  // カラム名を正規化してマッピング
  const firstRecord = records[0];
  const columnMap: Record<string, string> = {};
  
  // 一般的なカラム名のマッピング
  const columnMappings: Record<string, string[]> = {
    job_id: ['job_id', 'jobid', 'id', 'job_id'],
    job_title: ['job_title', 'title', 'position', 'role'],
    company_name: ['company_name', 'company', 'companyname', 'employer'],
    location: ['location', 'city', 'location_name'],
    job_description: ['job_description', 'description', 'desc', 'job_desc'],
    job_requirements: ['job_requirements', 'requirements', 'reqs', 'skills'],
    salary_range: ['salary_range', 'salary', 'compensation'],
    employment_type: ['employment_type', 'type', 'employment'],
    experience_level: ['experience_level', 'level', 'seniority'],
  };
  
  // カラム名を検出
  for (const [standardName, variants] of Object.entries(columnMappings)) {
    for (const variant of variants) {
      const found = Object.keys(firstRecord).find(
        col => normalizeColumnName(col) === normalizeColumnName(variant)
      );
      if (found) {
        columnMap[standardName] = found;
        break;
      }
    }
  }
  
  console.log(`   📋 検出されたカラムマッピング:`, columnMap);
  
  // データベースのjob_idとマッチング
  const updateStmt = db.prepare(`
    UPDATE jobs
    SET job_title = COALESCE(?, job_title),
        company_name = COALESCE(?, company_name),
        location = COALESCE(?, location),
        job_description = COALESCE(?, job_description),
        salary_range = COALESCE(?, salary_range),
        employment_type = COALESCE(?, employment_type),
        experience_level = COALESCE(?, experience_level)
    WHERE job_id = ?
  `);
  
  let matched = 0;
  let updated = 0;
  
  // Job_IDで直接マッチングを試行
  for (const record of records) {
    const jobId = record[columnMap.job_id] || record.Job_ID || record.job_id;
    if (!jobId) continue;
    
    const jobIdNum = parseInt(String(jobId));
    if (isNaN(jobIdNum)) continue;
    
    // データベースに存在するか確認
    const exists = db.prepare('SELECT job_id FROM jobs WHERE job_id = ?').get(jobIdNum);
    if (!exists) continue;
    
    matched++;
    
    const jobTitle = record[columnMap.job_title] || record.title || record.job_title;
    const companyName = record[columnMap.company_name] || record.company || record.company_name;
    const location = record[columnMap.location] || record.location;
    const jobDescription = record[columnMap.job_description] || record.description || record.job_description;
    const jobRequirements = record[columnMap.job_requirements] || record.requirements || record.job_requirements;
    const salaryRange = record[columnMap.salary_range] || record.salary || record.salary_range;
    const employmentType = record[columnMap.employment_type] || record.employment_type;
    const experienceLevel = record[columnMap.experience_level] || record.experience_level;
    
    // 既存のデータを上書きしない（NULLの場合のみ更新）
    updateStmt.run(
      jobTitle || null,
      companyName || null,
      location || null,
      jobDescription || null,
      salaryRange || null,
      employmentType || null,
      experienceLevel || null,
      jobIdNum
    );
    
    if (jobTitle || companyName || location) {
      updated++;
    }
  }
  
  console.log(`   ✅ ${matched}件の求人をマッチング、${updated}件を更新しました`);
  
  db.close();
}

function integrateSalaryData(salaryPath: string): void {
  console.log('\n💰 給与データを統合中...');
  
  const records = loadCsvFile(salaryPath) as SalaryRow[];
  const db = new Database(dbPath);
  
  // job_titleでグループ化して平均給与を計算
  const salaryMap = new Map<string, {
    avgSalary: number;
    count: number;
    experienceLevel?: string;
    employmentType?: string;
  }>();
  
  for (const record of records) {
    const jobTitle = record.job_title;
    if (!jobTitle) continue;
    
    const salary = parseFloat(record.salary_in_usd || record.salary || '0');
    if (isNaN(salary) || salary <= 0) continue;
    
    const normalizedTitle = jobTitle.toLowerCase().trim();
    const existing = salaryMap.get(normalizedTitle) || { avgSalary: 0, count: 0 };
    
    salaryMap.set(normalizedTitle, {
      avgSalary: (existing.avgSalary * existing.count + salary) / (existing.count + 1),
      count: existing.count + 1,
      experienceLevel: record.experience_level || existing.experienceLevel,
      employmentType: record.employment_type || existing.employmentType,
    });
  }
  
  console.log(`   📊 ${salaryMap.size}種類の職種の給与データを集計しました`);
  
  // データベースのjob_titleとマッチング
  const updateStmt = db.prepare(`
    UPDATE jobs
    SET salary_range = COALESCE(?, salary_range),
        experience_level = COALESCE(experience_level, ?),
        employment_type = COALESCE(employment_type, ?)
    WHERE LOWER(TRIM(job_title)) = ?
  `);
  
  let updated = 0;
  for (const [normalizedTitle, salaryData] of salaryMap.entries()) {
    const salaryRange = `$${Math.round(salaryData.avgSalary / 1000)}k - $${Math.round(salaryData.avgSalary * 1.2 / 1000)}k`;
    
    const result = updateStmt.run(
      salaryRange,
      salaryData.experienceLevel || null,
      salaryData.employmentType || null,
      normalizedTitle
    );
    
    if (result.changes > 0) {
      updated += result.changes;
    }
  }
  
  console.log(`   ✅ ${updated}件の求人の給与情報を更新しました`);
  
  db.close();
}

function main() {
  const args = process.argv.slice(2);
  
  console.log('=' .repeat(60));
  console.log('🚀 Kaggleデータセット統合ツール');
  console.log('=' .repeat(60));
  
  // 引数解析
  let linkedinPath: string | null = null;
  let salaryPath: string | null = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--linkedin' && i + 1 < args.length) {
      linkedinPath = args[i + 1];
      i++;
    } else if (args[i] === '--salary' && i + 1 < args.length) {
      salaryPath = args[i + 1];
      i++;
    }
  }
  
  // 対話的に入力を受け取る
  if (!linkedinPath && !salaryPath) {
    console.log('\n📁 データセットファイルのパスを入力してください（Enterでスキップ）:');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question('LinkedIn Job Postings CSV: ', (linkedin: string) => {
      if (linkedin.trim()) linkedinPath = linkedin.trim();
      
      rl.question('Salary Dataset CSV: ', (salary: string) => {
        if (salary.trim()) salaryPath = salary.trim();
        
        rl.close();
        executeIntegration(linkedinPath, salaryPath);
      });
    });
  } else {
    executeIntegration(linkedinPath, salaryPath);
  }
}

function executeIntegration(linkedinPath: string | null, salaryPath: string | null): void {
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ データベースが見つかりません: ${dbPath}`);
    console.error('   先に update-jobs-with-titles.ts を実行してください');
    process.exit(1);
  }
  
  try {
    if (linkedinPath) {
      integrateLinkedInData(linkedinPath);
    }
    
    if (salaryPath) {
      integrateSalaryData(salaryPath);
    }
    
    if (!linkedinPath && !salaryPath) {
      console.log('\n⚠️  統合するデータセットが指定されていません');
      console.log('   使用方法: ts-node scripts/integrate-kaggle-data.ts --linkedin <path> --salary <path>');
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 統合が完了しました！');
    console.log('='.repeat(60));
    console.log('\n💡 次のステップ:');
    console.log('   1. ts-node scripts/export-json.ts を実行してJSONを更新');
    console.log('   2. アプリケーションを再起動して新しいデータを確認');
    
  } catch (error: any) {
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { integrateLinkedInData, integrateSalaryData };

