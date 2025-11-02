'use client';

import { Button } from '@/components/ui/button';
import { X, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface SwipeActionsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
}

export function SwipeActions({ onSwipeLeft, onSwipeRight, disabled }: SwipeActionsProps) {
  return (
    <div className="flex justify-center gap-6 mt-8">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={onSwipeLeft}
          disabled={disabled}
          className="rounded-full w-20 h-20 p-0 border-2 border-red-300 hover:bg-red-50 hover:border-red-500 dark:hover:bg-red-950 transition-all duration-200"
        >
          <X className="h-10 w-10 text-red-500" />
        </Button>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={onSwipeRight}
          disabled={disabled}
          className="rounded-full w-20 h-20 p-0 border-2 border-green-300 hover:bg-green-50 hover:border-green-500 dark:hover:bg-green-950 transition-all duration-200"
        >
          <Heart className="h-10 w-10 text-green-500 fill-green-500" />
        </Button>
      </motion.div>
    </div>
  );
}

