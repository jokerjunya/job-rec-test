'use client';

import { useState, useEffect } from 'react';
import { SwipeableCard } from '@/components/SwipeableCard';
import { SwipeActions } from '@/components/SwipeActions';
import { Job } from '@/lib/schema';
import { AnimatePresence } from 'framer-motion';

const DEFAULT_USER_ID = 1; // デフォルトユーザーID

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState(DEFAULT_USER_ID);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/jobs?userId=${userId}&limit=10`);
      const data = await response.json();
      setJobs(data.jobs || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentJob = jobs[currentIndex];
    if (!currentJob) return;

    const action = direction === 'right' ? 'like' : 'dislike';

    try {
      // インタラクションを保存
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          job_id: currentJob.job_id,
          action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save interaction');
      }

      // 保存成功後、次の求人に進む
      if (currentIndex < jobs.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // 求人がなくなったら新しい求人を取得
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error saving interaction:', error);
      // エラーが発生した場合でも、ユーザーエクスペリエンスのために次の求人に進む
      // （ネットワークエラーの場合、後で再試行できるようにする）
      if (currentIndex < jobs.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        await fetchJobs();
      }
    }
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">求人を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">全ての求人を見ました</h2>
          <p className="text-muted-foreground mb-4">
            新しい求人を取得するには、しばらく待ってから再読み込みしてください。
          </p>
          <button
            onClick={fetchJobs}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  const visibleJobs = jobs.slice(currentIndex, currentIndex + 3);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Job Swipe
          </h1>
          <p className="text-muted-foreground text-lg">
            スワイプして興味のある求人を見つけましょう
          </p>
        </div>

        <div className="relative h-[600px] w-full">
          <AnimatePresence mode="wait">
            {visibleJobs.map((job, index) => (
              <SwipeableCard
                key={job.job_id}
                job={job}
                onSwipe={handleSwipe}
                index={index}
              />
            ))}
          </AnimatePresence>

          {visibleJobs.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">求人がありません</p>
            </div>
          )}
        </div>

        <SwipeActions
          onSwipeLeft={() => handleButtonSwipe('left')}
          onSwipeRight={() => handleButtonSwipe('right')}
          disabled={currentIndex >= jobs.length}
        />

        <div className="text-center text-sm text-muted-foreground">
          <p className="font-medium">
            残り: <span className="text-primary font-bold">{Math.max(0, jobs.length - currentIndex - 1)}</span>件
          </p>
        </div>
      </div>
    </main>
  );
}
