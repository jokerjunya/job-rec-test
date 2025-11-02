#!/usr/bin/env ts-node
/**
 * SQLiteデータベースからFirestoreにデータを移行するスクリプト
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const dbPath = path.join(process.cwd(), 'data', 'jobs.db');

// Firebase Admin SDKの初期化
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // 環境変数からサービスアカウントキーを取得
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      // JSON文字列として提供されている場合
      try {
        const serviceAccountJson = JSON.parse(serviceAccount);
        initializeApp({
          credential: cert(serviceAccountJson as any),
        });
      } catch (error) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEYの解析に失敗しました');
        throw error;
      }
    } else {
      // サービスアカウントキーファイルのパスを確認
      const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                     path.join(process.cwd(), 'firebase-service-account.json');
      
      if (fs.existsSync(keyPath)) {
        initializeApp({
          credential: cert(keyPath),
        });
      } else {
        // デフォルトの認証情報を使用（gcloud認証）
        console.log('⚠️  サービスアカウントキーが見つかりません。gcloud認証を使用します。');
        initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'job-swipe-app-2025',
        });
      }
    }
  }
  
  return getFirestore();
}

async function migrateToFirestore() {
  console.log('🚀 SQLiteからFirestoreへのデータ移行を開始します...\n');
  
  // SQLiteデータベースの確認
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ データベースが見つかりません: ${dbPath}`);
    console.error('   先に npm run import-csv を実行してください');
    process.exit(1);
  }
  
  // Firebase Admin SDKを初期化
  const db = initializeFirebaseAdmin();
  const sqliteDb = new Database(dbPath);
  
  try {
    // Jobsコレクションへの移行
    console.log('📊 Jobsコレクションへの移行中...');
    const jobs = sqliteDb.prepare('SELECT * FROM jobs').all() as any[];
    
    const batch = db.batch();
    let jobCount = 0;
    
    for (const job of jobs) {
      const jobRef = db.collection('jobs').doc(job.job_id.toString());
      batch.set(jobRef, {
        job_id: job.job_id,
        job_requirements: job.job_requirements,
        job_title: job.job_title || null,
        company_name: job.company_name || null,
        location: job.location || null,
        job_description: job.job_description || null,
        salary_range: job.salary_range || null,
        employment_type: job.employment_type || null,
        experience_level: job.experience_level || null,
        match_score: job.match_score || null,
        recommended: job.recommended || 0,
      });
      
      jobCount++;
      
      // Firestoreのバッチ書き込み制限（500件）に達したらコミット
      if (jobCount % 500 === 0) {
        await batch.commit();
        console.log(`   ✅ ${jobCount}件の求人を移行しました...`);
      }
    }
    
    // 残りのデータをコミット
    if (jobCount % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Jobsコレクションへの移行完了: ${jobCount}件\n`);
    
    // Usersコレクションへの移行
    console.log('👥 Usersコレクションへの移行中...');
    const users = sqliteDb.prepare('SELECT * FROM users').all() as any[];
    
    const userBatch = db.batch();
    let userCount = 0;
    
    for (const user of users) {
      const userRef = db.collection('users').doc(user.user_id.toString());
      userBatch.set(userRef, {
        user_id: user.user_id,
        user_skills: user.user_skills,
      });
      
      userCount++;
      
      if (userCount % 500 === 0) {
        await userBatch.commit();
        console.log(`   ✅ ${userCount}件のユーザーを移行しました...`);
      }
    }
    
    if (userCount % 500 !== 0) {
      await userBatch.commit();
    }
    
    console.log(`✅ Usersコレクションへの移行完了: ${userCount}件\n`);
    
    // UserInteractionsコレクションへの移行（既存データがある場合）
    console.log('💬 UserInteractionsコレクションへの移行中...');
    const interactions = sqliteDb.prepare('SELECT * FROM user_interactions').all() as any[];
    
    if (interactions.length > 0) {
      const interactionBatch = db.batch();
      let interactionCount = 0;
      
      for (const interaction of interactions) {
        const interactionRef = db.collection('user_interactions').doc(interaction.interaction_id.toString());
        interactionBatch.set(interactionRef, {
          interaction_id: interaction.interaction_id,
          user_id: interaction.user_id,
          job_id: interaction.job_id,
          action: interaction.action,
          timestamp: interaction.timestamp ? new Date(interaction.timestamp) : new Date(),
        });
        
        interactionCount++;
        
        if (interactionCount % 500 === 0) {
          await interactionBatch.commit();
          console.log(`   ✅ ${interactionCount}件のインタラクションを移行しました...`);
        }
      }
      
      if (interactionCount % 500 !== 0) {
        await interactionBatch.commit();
      }
      
      console.log(`✅ UserInteractionsコレクションへの移行完了: ${interactionCount}件\n`);
    } else {
      console.log('ℹ️  移行するインタラクションデータがありません\n');
    }
    
    // 統計情報を表示
    console.log('📊 移行完了統計:');
    console.log(`   - Jobs: ${jobCount}件`);
    console.log(`   - Users: ${userCount}件`);
    console.log(`   - Interactions: ${interactions.length}件`);
    
    sqliteDb.close();
    
    console.log('\n✨ データ移行が完了しました！');
    
  } catch (error: any) {
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error(error.stack);
    sqliteDb.close();
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  migrateToFirestore()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 移行に失敗しました:', error);
      process.exit(1);
    });
}

export { migrateToFirestore };

