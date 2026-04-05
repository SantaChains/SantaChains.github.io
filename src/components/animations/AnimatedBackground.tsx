'use client';

import { motion } from 'framer-motion';

/**
 * 动画背景组件
 * 包含多个浮动光晕效果，使用川端康成配色
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* 红色光晕 - 左上 */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-red)]/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* 绿色光晕 - 右下 */}
      <motion.div
        className="absolute top-3/4 right-1/4 w-80 h-80 bg-[var(--accent-green)]/5 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* 紫色光晕 - 中心 */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-purple)]/3 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export default AnimatedBackground;
