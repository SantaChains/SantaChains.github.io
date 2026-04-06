/**
 * Pretext 内容渲染组件
 *
 * 核心优化:
 * 1. 全局优化器 - 跨组件共享缓存
 * 2. 智能预加载 - 预测用户行为提前准备
 * 3. 增量渲染 - 大数据量分片渲染
 * 4. 性能监控 - 实时追踪渲染指标
 * 5. 内存管理 - 自动清理过期缓存
 * 6. 组件卸载清理 - 防止内存泄漏
 */

'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { prepareWithSegments, layoutWithLines, type LayoutLine } from '@chenglou/pretext';
import { useFontLoader } from '@/hooks/useFontLoader';
import { getPretextOptimizer } from '@/lib/pretext-optimizer';
import type {
  PretextContentProps,
  LayoutInfo,
  LineRenderInfo,
  PerformanceMetrics,
} from '@/types/pretext';
import { DEFAULT_FONT_CONFIG } from '@/types/pretext';

// 字体配置常量
const FONT_FAMILY = DEFAULT_FONT_CONFIG.family;
const FONT_WEIGHT = DEFAULT_FONT_CONFIG.weight;
const FONT_STYLE = DEFAULT_FONT_CONFIG.style;

/**
 * Pretext 内容组件
 */
export function PretextContent({
  content,
  className = '',
  fontSize = DEFAULT_FONT_CONFIG.size,
  lineHeight = DEFAULT_FONT_CONFIG.lineHeight,
  enableOptimization = true,
  onLayoutComplete,
  onMetricsUpdate,
}: PretextContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LineRenderInfo[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const optimizerRef = useRef(enableOptimization ? getPretextOptimizer() : null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { fontsLoaded, isLoading } = useFontLoader([
    'Arima-Regular',
    'WenQuanWeiMiHei',
    'CangErJinKai03',
  ]);

  // 构建字体字符串
  const fontString = useMemo(() => {
    return `${FONT_STYLE} ${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
  }, [fontSize]);

  // 清理所有副作用
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // 分片渲染大数据量
  const renderInChunks = useCallback((layoutLines: LayoutLine[], renderTime: number) => {
    const CHUNK_SIZE = 50;
    const totalLines = layoutLines.length;
    let currentIndex = 0;

    const renderChunk = () => {
      if (abortControllerRef.current?.signal.aborted) return;

      const endIndex = Math.min(currentIndex + CHUNK_SIZE, totalLines);
      const chunk = layoutLines.slice(0, endIndex);

      const renderLines: LineRenderInfo[] = chunk.map((line, index) => ({
        text: line.text,
        width: line.width,
        isFirstLine: index === 0,
      }));

      setLines(renderLines);
      setRenderProgress(Math.round((endIndex / totalLines) * 100));

      if (endIndex < totalLines) {
        currentIndex = endIndex;
        rafIdRef.current = requestAnimationFrame(renderChunk);
      } else {
        setIsReady(true);
        onLayoutComplete?.({
          lineCount: totalLines,
          totalHeight: totalLines * lineHeight,
          lines: layoutLines,
          renderTime,
        });
      }
    };

    renderChunk();
  }, [lineHeight, onLayoutComplete]);

  // 执行布局 - 使用优化器
  const performLayout = useCallback((width: number) => {
    if (width <= 0) return;

    const startTime = performance.now();
    let layoutLines: LayoutLine[];

    if (optimizerRef.current && enableOptimization) {
      layoutLines = optimizerRef.current.layout(content, fontString, width, lineHeight);

      if (onMetricsUpdate) {
        const metrics = optimizerRef.current.getMetrics();
        const stats = optimizerRef.current.getCacheStats();
        onMetricsUpdate({
          ...metrics,
          hitRate: stats.hitRate,
        });
      }
    } else {
      const prepared = prepareWithSegments(content, fontString, { whiteSpace: 'normal' });
      const result = layoutWithLines(prepared, width, lineHeight);
      layoutLines = result.lines;
    }

    const renderTime = performance.now() - startTime;

    if (layoutLines.length > 100) {
      renderInChunks(layoutLines, renderTime);
    } else {
      const renderLines: LineRenderInfo[] = layoutLines.map((line) => ({
        text: line.text,
        width: line.width,
        isFirstLine: false,
      }));
      setLines(renderLines);
      setIsReady(true);
      setRenderProgress(100);

      onLayoutComplete?.({
        lineCount: layoutLines.length,
        totalHeight: layoutLines.length * lineHeight,
        lines: layoutLines,
        renderTime,
      });
    }
  }, [content, fontString, lineHeight, enableOptimization, onLayoutComplete, onMetricsUpdate, renderInChunks]);

  // 初始化布局
  useEffect(() => {
    if (!fontsLoaded || !containerRef.current) return;

    cleanup();

    abortControllerRef.current = new AbortController();

    rafIdRef.current = requestAnimationFrame(() => {
      if (containerRef.current && !abortControllerRef.current?.signal.aborted) {
        performLayout(containerRef.current.clientWidth);
      }
    });

    return () => {
      cleanup();
    };
  }, [fontsLoaded, performLayout, cleanup]);

  // 监听容器尺寸变化
  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const container = containerRef.current;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const entry = entries[0];
        if (entry && !abortControllerRef.current?.signal.aborted) {
          performLayout(entry.contentRect.width);
        }
      }, 100);
    };

    if ('ResizeObserver' in window) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(container);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [isReady, performLayout]);

  // 加载状态
  if (isLoading || !fontsLoaded) {
    return (
      <div className={`pretext-loading ${className}`}>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-muted rounded"
              style={{ width: `${85 + (i % 3) * 5}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pretext-content ${className}`}
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeight}px`,
        textAlign: 'justify',
        hyphens: 'auto',
        overflowWrap: 'break-word',
        contain: 'layout style paint',
      }}
    >
      {renderProgress < 100 && lines.length > 100 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${renderProgress}%` }}
          />
        </div>
      )}

      {lines.map((line, index) => (
        <div
          key={index}
          className="pretext-line"
          style={{
            lineHeight: `${lineHeight}px`,
            marginBottom: '0',
            textAlign: 'justify',
            textIndent: index === 0 ? '0' : '2em',
            willChange: 'transform',
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}

export type { LayoutInfo, LineRenderInfo, PerformanceMetrics };
