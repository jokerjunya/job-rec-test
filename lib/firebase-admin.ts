/**
 * Firebase Admin SDK設定（サーバーサイド用）
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

// Firebase Admin SDKの初期化
export function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }
  
  if (getApps().length === 0) {
    // 環境変数からサービスアカウントキーを取得
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        adminApp = initializeApp({
          credential: cert(serviceAccount as any),
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
        adminApp = initializeApp({
          credential: cert(keyPath),
        });
      } else {
        // デフォルトの認証情報を使用（gcloud認証または環境変数）
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }
    }
  } else {
    adminApp = getApps()[0];
  }
  
  return adminApp;
}

// Firestore Adminインスタンス取得
export function getFirestoreAdmin(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getFirebaseAdminApp());
  }
  
  return adminDb;
}

