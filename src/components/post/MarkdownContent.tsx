/**
 * Markdown 内容渲染组件
 *
 * 功能：
 * 1. 将 Markdown 转换为 HTML
 * 2. 图片懒加载和淡入效果
 * 3. 代码高亮
 * 4. 代码块复制按钮
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

  // 设置图片淡入效果和代码块复制功能
  useEffect(() => {
    if (!containerRef.current) return;

    // 先清理旧的事件监听器
    cleanupImageListeners();

    const container = containerRef.current;

    // 设置图片淡入效果
    const images = container.querySelectorAll('img.markdown-image');
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

    // 设置代码块复制功能
    const copyButtons = container.querySelectorAll('.code-copy-btn');
    const copyHandlers: { btn: HTMLElement; handler: () => void }[] = [];

    copyButtons.forEach((btn) => {
      const button = btn as HTMLElement;
      const code = decodeURIComponent(button.dataset.original || button.dataset.code || '');

      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(code);
          button.classList.add('copied');
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
          button.title = '已复制';

          setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
            button.title = '复制代码';
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
        }
      };

      button.addEventListener('click', handleCopy);
      copyHandlers.push({ btn: button, handler: handleCopy });
    });

    // 清理函数
    return () => {
      cleanupImageListeners();
      copyHandlers.forEach(({ btn, handler }) => {
        btn.removeEventListener('click', handler);
      });
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
