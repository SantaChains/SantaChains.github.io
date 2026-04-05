'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  delay?: number;
}

/**
 * 打字机效果组件
 * 逐字显示文本，配合闪烁光标动画
 */
export function TypewriterText({ text, delay = 0 }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-5 bg-[var(--accent-red)] ml-1 align-middle"
      />
    </span>
  );
}

export default TypewriterText;
