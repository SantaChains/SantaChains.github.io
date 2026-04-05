'use client';

import { useEffect, useRef } from 'react';

/**
 * Markdown 图片处理器
 * 为 Markdown 渲染的 HTML 中的图片添加懒加载和淡入效果
 */
interface MarkdownImageProcessorProps {
  children: React.ReactNode;
  className?: string;
}

export function MarkdownImageProcessor({
  children,
  className = '',
}: MarkdownImageProcessorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const images = containerRef.current.querySelectorAll('img.markdown-image');

    images.forEach((img) => {
      // 添加初始样式
      const imageElement = img as HTMLImageElement;
      imageElement.style.opacity = '0';
      imageElement.style.transition = 'opacity 0.5s ease-in-out';

      // 如果已经加载完成，直接显示
      if (imageElement.complete) {
        imageElement.style.opacity = '1';
      } else {
        // 添加加载事件监听
        imageElement.addEventListener('load', () => {
          imageElement.style.opacity = '1';
        });
        imageElement.addEventListener('error', () => {
          // 加载失败时显示占位
          imageElement.style.opacity = '0.5';
        });
      }
    });
  }, [children]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export default MarkdownImageProcessor;
