/**
 * Markdown 内容渲染组件
 *
 * 功能：
 * 1. 将 Markdown 转换为 HTML
 * 2. 图片懒加载和淡入效果
 * 3. 代码高亮
 */

'use client';

import { useMemo, useRef, useEffect, useCallback } from 'react';
import { processMarkdown } from '@/lib/services/markdownService';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Markdown 内容组件
 * @param content Markdown 内容
 * @param className 自定义类名
 */
export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageListenersRef = useRef<Map<HTMLImageElement, { load: () => void; error: () => void }>>(new Map());

  // 处理 Markdown 内容
  const processedContent = useMemo(() => {
    return processMarkdown(content);
  }, [content]);

  // 清理图片事件监听器
  const cleanupImageListeners = useCallback(() => {
    imageListenersRef.current.forEach((listeners, img) => {
      img.removeEventListener('load', listeners.load);
      img.removeEventListener('error', listeners.error);
    });
    imageListenersRef.current.clear();
  }, []);

  // 设置图片淡入效果
  useEffect(() => {
    if (!containerRef.current) return;

    // 先清理旧的事件监听器
    cleanupImageListeners();

    const images = containerRef.current.querySelectorAll('img.markdown-image');

    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      imageElement.style.opacity = '0';
      imageElement.style.transition = 'opacity 0.5s ease-in-out';

      const handleLoad = () => {
        imageElement.style.opacity = '1';
      };

      const handleError = () => {
        imageElement.style.opacity = '0.5';
      };

      // 存储监听器以便后续清理
      imageListenersRef.current.set(imageElement, {
        load: handleLoad,
        error: handleError,
      });

      if (imageElement.complete) {
        handleLoad();
      } else {
        imageElement.addEventListener('load', handleLoad);
        imageElement.addEventListener('error', handleError);
      }
    });

    // 清理函数
    return () => {
      cleanupImageListeners();
    };
  }, [processedContent, cleanupImageListeners]);

  return (
    <div
      ref={containerRef}
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

export default MarkdownContent;
