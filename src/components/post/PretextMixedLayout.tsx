'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  prepareWithSegments, 
  layoutNextLine,
  type LayoutLine,
  type LayoutCursor 
} from '@chenglou/pretext';
import { useFontLoader } from '@/hooks/useFontLoader';
import Image from 'next/image';

// 字体配置
const FONT_FAMILY = '"Arima-Regular", "WenQuanWeiMiHei", "CangErJinKai03", system-ui, sans-serif';
const FONT_WEIGHT = 400;
const FONT_STYLE = 'normal';

interface MixedContentItem {
  type: 'text' | 'image';
  content?: string;
  src?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  float?: 'left' | 'right' | 'none';
}

interface PretextMixedLayoutProps {
  items: MixedContentItem[];
  className?: string;
  fontSize?: number;
  lineHeight?: number;
  containerMaxWidth?: number;
}

interface LayoutBlock {
  type: 'text' | 'image';
  lines?: LayoutLine[];
  image?: MixedContentItem;
  y: number;
  height: number;
  width: number;
  x: number;
}

/**
 * 图文混排布局组件
 * 
 * 核心功能:
 * 1. 文字环绕图片 - 使用 Pretext 的 layoutNextLine 实现
 * 2. 动态宽度计算 - 根据图片位置计算每行可用宽度
 * 3. 精确布局 - 每行独立计算，支持复杂混排
 * 
 * 布局算法:
 * - 遇到图片时，根据 float 属性预留空间
 * - 文字行根据当前 y 位置判断是否处于图片区域
 * - 使用 cursor 迭代处理，支持跨段落布局
 */
export function PretextMixedLayout({
  items,
  className = '',
  fontSize = 17,
  lineHeight = 28,
  containerMaxWidth = 800,
}: PretextMixedLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);
  const [containerWidth, setContainerWidth] = useState(containerMaxWidth);
  const { fontsLoaded } = useFontLoader(['Arima-Regular', 'WenQuanWeiMiHei', 'CangErJinKai03']);

  const fontString = useMemo(() => {
    return `${FONT_STYLE} ${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
  }, [fontSize]);

  // 执行混排布局
  const performMixedLayout = useCallback(() => {
    if (!fontsLoaded || !containerRef.current) return;

    const width = containerRef.current.clientWidth || containerMaxWidth;
    setContainerWidth(width);

    const newBlocks: LayoutBlock[] = [];
    let currentY = 0;

    // 预处理：收集所有图片的位置信息
    const imageBlocks: Array<{
      item: MixedContentItem;
      y: number;
      height: number;
      width: number;
      x: number;
    }> = [];

    items.forEach((item) => {
      if (item.type === 'image' && item.src) {
        const imgWidth = item.width || 300;
        const imgHeight = item.height || 200;
        const float = item.float || 'none';
        
        const x = float === 'right' ? width - imgWidth : 0;
        
        imageBlocks.push({
          item,
          y: currentY,
          height: imgHeight,
          width: imgWidth,
          x,
        });

        newBlocks.push({
          type: 'image',
          image: item,
          y: currentY,
          height: imgHeight,
          width: imgWidth,
          x,
        });

        currentY += imgHeight + lineHeight; // 图片后加行间距
      } else if (item.type === 'text' && item.content) {
        // 准备文本
        const prepared = prepareWithSegments(item.content, fontString, {
          whiteSpace: 'normal',
        });

        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
        const textLines: LayoutLine[] = [];
        let textHeight = 0;

        // 逐行布局，考虑图片遮挡
        while (true) {
          // 计算当前 y 位置的可用宽度
          let availableWidth = width;

          // 检查是否有图片影响当前行
          for (const img of imageBlocks) {
            const lineYStart = currentY + textHeight;
            const lineYEnd = lineYStart + lineHeight;

            // 如果行与图片区域重叠
            if (lineYStart < img.y + img.height && lineYEnd > img.y) {
              if (img.item.float === 'left') {
                availableWidth = width - img.width - 20; // 20px 间距
              } else if (img.item.float === 'right') {
                availableWidth = width - img.width - 20;
              }
            }
          }

          // 布局下一行 - 使用正确的 API
          const line = layoutNextLine(prepared, cursor, availableWidth);
          if (!line) break;

          textLines.push(line);
          
          cursor = line.end;
          textHeight += lineHeight;
        }

        if (textLines.length > 0) {
          newBlocks.push({
            type: 'text',
            lines: textLines,
            y: currentY,
            height: textHeight,
            width,
            x: 0,
          });

          currentY += textHeight;
        }
      }
    });

    setBlocks(newBlocks);
  }, [items, fontString, lineHeight, containerMaxWidth, fontsLoaded]);

  // 监听尺寸变化
  useEffect(() => {
    if (!fontsLoaded || !containerRef.current) return;

    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        const entry = entries[0];
        if (entry && Math.abs(entry.contentRect.width - containerWidth) > 10) {
          performMixedLayout();
        }
      });
    };

    // 初始布局
    performMixedLayout();

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [fontsLoaded, performMixedLayout, containerWidth]);

  if (!fontsLoaded) {
    return (
      <div className={`pretext-mixed-loading ${className}`}>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pretext-mixed-layout ${className}`}
      style={{
        position: 'relative',
        fontFamily: FONT_FAMILY,
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeight}px`,
      }}
    >
      {blocks.map((block, index) => {
        if (block.type === 'image' && block.image) {
          return (
            <figure
              key={`img-${index}`}
              className={`pretext-mixed-image float-${block.image.float || 'none'}`}
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
                margin: 0,
              }}
            >
              <Image
                src={block.image.src!}
                alt={block.image.alt || ''}
                width={block.width}
                height={block.height}
                className="rounded-lg object-cover"
                style={{ width: '100%', height: '100%' }}
              />
              {block.image.caption && (
                <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                  {block.image.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        if (block.type === 'text' && block.lines) {
          return (
            <div
              key={`text-${index}`}
              className="pretext-mixed-text"
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                width: block.width,
              }}
            >
              {block.lines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className="pretext-mixed-line"
                  style={{
                    lineHeight: `${lineHeight}px`,
                    textAlign: 'justify',
                    textIndent: lineIndex === 0 ? '0' : '2em',
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export type { MixedContentItem, LayoutBlock };
