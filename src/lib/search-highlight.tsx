'use client';

/**
 * 搜索结果高亮组件
 */

import { Fragment } from 'react';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 高亮文本中的匹配词
 * @param text 原始文本
 * @param query 搜索词
 * @returns React 节点数组
 */
export function highlightMatch(
  text: string,
  query: string
): React.ReactNode[] {
  if (!query.trim()) {
    return [text];
  }

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark
          key={index}
          className="bg-accent-red/20 text-accent-red px-0.5 rounded"
        >
          {part}
        </mark>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
