/**
 * 阅读进度条组件
 *
 * 功能：
 * 1. 显示文章阅读进度
 * 2. 平滑滚动指示
 * 3. 自动隐藏/显示
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadingProgressProps {
  /** 目标容器选择器 */
  targetSelector?: string;
  /** 进度条颜色 */
  color?: string;
  /** 是否显示百分比 */
  showPercentage?: boolean;
}

/**
 * 阅读进度条组件
 */
export function ReadingProgress({
  targetSelector = 'article',
  color = 'var(--accent-red)',
  showPercentage = true,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const calculateProgress = useCallback(() => {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const documentHeight = target.scrollHeight;

    // 计算可见区域
    const visibleTop = Math.max(0, -rect.top);

    // 计算进度
    if (rect.top > 0) {
      // 文章还没滚动到顶部
      setProgress(0);
    } else if (rect.bottom <= windowHeight) {
      // 文章已经完全滚动过去
      setProgress(100);
    } else {
      // 正在阅读中
      const scrollProgress = (visibleTop / (documentHeight - windowHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollProgress)));
    }
  }, [targetSelector]);

  useEffect(() => {
    // 检查文章是否可见
    const checkVisibility = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setIsVisible(rect.top < window.innerHeight && rect.bottom > 0);
      }
    };

    // 初始检查
    checkVisibility();
    calculateProgress();

    // 监听滚动
    const handleScroll = () => {
      checkVisibility();
      calculateProgress();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateProgress);
    };
  }, [calculateProgress, targetSelector]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent"
        >
          {/* 进度条背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/50 to-transparent" />

          {/* 进度条 */}
          <motion.div
            className="h-full transition-all duration-150 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />

          {/* 百分比显示 */}
          {showPercentage && progress > 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-4 top-2 px-2 py-1 text-xs font-medium rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-sm"
              style={{ color }}
            >
              {Math.round(progress)}%
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 圆形阅读进度指示器
 * 适合放在固定位置
 */
export function CircularReadingProgress({
  targetSelector = 'article',
  size = 48,
  strokeWidth = 3,
  color = 'var(--accent-red)',
}: ReadingProgressProps & { size?: number; strokeWidth?: number }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const calculateProgress = useCallback(() => {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const documentHeight = target.scrollHeight;

    if (rect.top > 0) {
      setProgress(0);
    } else if (rect.bottom <= windowHeight) {
      setProgress(100);
    } else {
      const visibleTop = Math.max(0, -rect.top);
      const scrollProgress = (visibleTop / (documentHeight - windowHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollProgress)));
    }
  }, [targetSelector]);

  useEffect(() => {
    const checkVisibility = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setIsVisible(rect.top < window.innerHeight && rect.bottom > 0);
      }
    };

    checkVisibility();
    calculateProgress();

    const handleScroll = () => {
      checkVisibility();
      calculateProgress();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateProgress);
    };
  }, [calculateProgress, targetSelector]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 right-8 z-50"
        >
          <div
            className="relative rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-lg cursor-pointer hover:scale-110 transition-transform"
            style={{ width: size, height: size }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="回到顶部"
          >
            <svg
              width={size}
              height={size}
              className="transform -rotate-90"
            >
              {/* 背景圆环 */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth={strokeWidth}
              />
              {/* 进度圆环 */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
              />
            </svg>
            {/* 百分比文字 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium" style={{ color }}>
                {Math.round(progress)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReadingProgress;
