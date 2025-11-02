'use client';

import { useSwipeable } from 'react-swipeable';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { JobCard } from './JobCard';
import { Job } from '@/lib/schema';

interface SwipeableCardProps {
  job: Job;
  onSwipe: (direction: 'left' | 'right') => void;
  index: number;
}

export function SwipeableCard({ job, onSwipe, index }: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 0.5, 1, 0.5, 0]);
  const scale = useTransform(x, [-300, 0, 300], [0.9, 1, 0.9]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      animate(x, -500, { duration: 0.3 }).then(() => {
        onSwipe('left');
      });
    },
    onSwipedRight: () => {
      animate(x, 500, { duration: 0.3 }).then(() => {
        onSwipe('right');
      });
    },
    trackMouse: true,
    trackTouch: true,
    delta: 50,
  });

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      animate(x, 500, { duration: 0.3 }).then(() => {
        onSwipe('right');
      });
    } else if (info.offset.x < -threshold) {
      animate(x, -500, { duration: 0.3 }).then(() => {
        onSwipe('left');
      });
    } else {
      animate(x, 0, { duration: 0.3 });
    }
  };

  return (
    <motion.div
      {...handlers}
      className="absolute w-full"
      style={{
        x,
        rotate,
        opacity,
        scale,
        zIndex: 100 - index,
        cursor: 'grab',
      }}
      whileDrag={{ cursor: 'grabbing' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ x: index === 0 ? (x.get() > 0 ? 1000 : -1000) : 0, opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="relative">
        {index === 0 && (
          <motion.div
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-2">
              <motion.div
                className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ opacity: x.get() < -50 ? 1 : 0.3 }}
              >
                ← スキップ
              </motion.div>
              <motion.div
                className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ opacity: x.get() > 50 ? 1 : 0.3 }}
              >
                いいね →
              </motion.div>
            </div>
          </motion.div>
        )}
        <JobCard job={job} />
      </div>
    </motion.div>
  );
}

