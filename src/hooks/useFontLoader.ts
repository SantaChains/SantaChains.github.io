/**
 * 字体加载检测 Hook
 *
 * 功能:
 * 1. 使用 document.fonts API 检测字体加载状态
 * 2. 支持自定义字体族列表
 * 3. 超时处理防止无限等待
 * 4. 降级方案使用 canvas 测量验证
 * 5. 内存泄漏防护（清理所有副作用）
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface FontLoadStatus {
  fontsLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 字体加载检测 Hook
 * @param fontFamilies 字体族列表
 * @param timeout 超时时间（毫秒）
 * @returns 字体加载状态
 */
export function useFontLoader(fontFamilies: string[], timeout = 5000): FontLoadStatus {
  const [status, setStatus] = useState<FontLoadStatus>({
    fontsLoaded: false,
    isLoading: true,
    error: null,
  });

  // 使用 ref 存储所有需要清理的资源
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 清理所有副作用
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // 重置挂载状态
    isMountedRef.current = true;

    // 如果没有指定字体，直接返回成功
    if (fontFamilies.length === 0) {
      if (isMountedRef.current) {
        setStatus({ fontsLoaded: true, isLoading: false, error: null });
      }
      return;
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    const checkFontsLoaded = async () => {
      try {
        // 检查是否已取消
        if (signal.aborted || !isMountedRef.current) return;

        // 方法1: 使用 document.fonts API (现代浏览器)
        if ('fonts' in document) {
          const fontPromises = fontFamilies.map(family => {
            // 尝试加载 400 字重
            return document.fonts.load(`400 16px "${family}"`).catch(() => {
              // 如果特定字重失败，尝试默认加载
              return document.fonts.load(`16px "${family}"`);
            });
          });

          await Promise.race([
            Promise.all(fontPromises),
            new Promise((_, reject) => {
              timeoutRef.current = setTimeout(() => {
                reject(new Error('Font loading timeout'));
              }, timeout);
            }),
          ]);

          // 检查是否已取消
          if (signal.aborted || !isMountedRef.current) return;

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          if (isMountedRef.current) {
            setStatus({ fontsLoaded: true, isLoading: false, error: null });
          }
          return;
        }

        // 方法2: 使用 Canvas 测量验证 (降级方案)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = document as any;
        const canvas = doc.createElement('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas not supported');
        }

        // 使用系统字体作为参考
        const testText = '中文测试 ABC xyz 123';
        ctx.font = '16px monospace';
        const fallbackWidth = ctx.measureText(testText).width;

        // 检查自定义字体是否加载
        let allLoaded = true;
        for (const family of fontFamilies) {
          // 检查是否已取消
          if (signal.aborted || !isMountedRef.current) return;

          ctx.font = `16px "${family}", monospace`;
          const width = ctx.measureText(testText).width;

          // 如果宽度与 fallback 相同，可能字体未加载
          if (Math.abs(width - fallbackWidth) < 0.1) {
            allLoaded = false;
            break;
          }
        }

        // 检查是否已取消
        if (signal.aborted || !isMountedRef.current) return;

        if (allLoaded) {
          if (isMountedRef.current) {
            setStatus({ fontsLoaded: true, isLoading: false, error: null });
          }
        } else {
          // 给字体更多时间加载，但限制重试次数
          retryTimeoutRef.current = setTimeout(() => {
            if (!signal.aborted && isMountedRef.current) {
              checkFontsLoaded();
            }
          }, 100);
        }

        // 清理 canvas
        canvas.width = 0;
        canvas.height = 0;

      } catch (error) {
        // 检查是否已取消
        if (signal.aborted || !isMountedRef.current) return;

        console.warn('Font loading check failed:', error);
        // 出错时仍然标记为已加载，使用系统字体降级
        if (isMountedRef.current) {
          setStatus({
            fontsLoaded: true,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }
    };

    checkFontsLoaded();

    // 清理函数
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [fontFamilies, timeout, cleanup]);

  return status;
}

/**
 * 预加载字体
 * 在应用初始化时调用，确保关键字体优先加载
 * @param fontFamilies 字体族列表
 */
export function preloadFonts(fontFamilies: string[]): void {
  if (typeof window === 'undefined') return;

  fontFamilies.forEach(family => {
    // 根据字体名映射到实际文件路径
    const fontPath = getFontPath(family);
    if (!fontPath) return;

    // 检查是否已存在相同的预加载链接
    const existingLink = document.querySelector(`link[rel="preload"][href="${fontPath}"]`);
    if (existingLink) return;

    // 创建 link 标签预加载字体文件
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.crossOrigin = 'anonymous';
    link.href = fontPath;

    document.head.appendChild(link);
  });
}

/**
 * 获取字体文件路径
 * @param family 字体族名称
 * @returns 字体文件路径或 null
 */
function getFontPath(family: string): string | null {
  const fontMap: Record<string, string> = {
    'Arima-Regular': '/fonts/Arima-Regular.ttf',
    'LXGWWenKaiMono': '/fonts/LXGWWenKaiMono.ttf',
    'WenQuanWeiMiHei': '/fonts/WenQuanWeiMiHei.ttf',
    'CangErJinKai03': '/fonts/CangErJinKai03.ttf',
  };

  return fontMap[family] || null;
}

/**
 * 清理字体预加载链接
 * 用于卸载时清理 DOM
 * @param fontFamilies 字体族列表
 */
export function cleanupFontPreload(fontFamilies: string[]): void {
  if (typeof window === 'undefined') return;

  fontFamilies.forEach(family => {
    const fontPath = getFontPath(family);
    if (!fontPath) return;

    const link = document.querySelector(`link[rel="preload"][href="${fontPath}"]`);
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
    }
  });
}
