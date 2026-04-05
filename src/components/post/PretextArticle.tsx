'use client';

import { useMemo } from 'react';
import { MarkdownContent } from './MarkdownContent';
import type { PretextArticleProps } from '@/types/pretext';

/**
 * 文章渲染组件
 * 
 * 使用 MarkdownContent 直接渲染文章内容
 * 提供清晰的排版和良好的阅读体验
 */
export function PretextArticle({
  content,
  className = '',
}: PretextArticleProps) {
  // 清理内容（移除 frontmatter 如果存在）
  const cleanContent = useMemo(() => {
    // 如果内容以 --- 开头，移除 frontmatter
    if (content.trim().startsWith('---')) {
      const parts = content.split('---');
      if (parts.length >= 3) {
        return parts.slice(2).join('---').trim();
      }
    }
    return content;
  }, [content]);

  return (
    <article className={`article-content ${className}`}>
      <MarkdownContent content={cleanContent} />
    </article>
  );
}

export default PretextArticle;
