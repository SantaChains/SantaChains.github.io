/**
 * 搜索优化工具
 *
 * 功能：
 * 1. 防抖搜索 - 减少频繁搜索
 * 2. 关键词高亮 - 搜索结果中高亮匹配词
 * 3. 模糊匹配 - 支持多关键词搜索
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// 防抖 Hook
// ============================================

/**
 * 防抖 Hook
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// 防抖回调 Hook
// ============================================

/**
 * 防抖回调 Hook
 * @param callback 回调函数
 * @param delay 延迟时间
 * @returns 防抖后的回调
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

// ============================================
// 搜索匹配器
// ============================================

export interface SearchMatch {
  field: 'title' | 'excerpt' | 'tags' | 'category';
  value: string;
  score: number;
}

export interface SearchablePost {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  category: string;
  date: string;
}

/**
 * 转义正则特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 高级搜索函数
 * @param posts 文章列表
 * @param query 搜索词
 * @param options 搜索选项
 * @returns 匹配的文章和分数
 */
export function searchPosts<T extends SearchablePost>(
  posts: T[],
  query: string,
  options: {
    threshold?: number;
    boostTitle?: number;
    boostExcerpt?: number;
    boostTags?: number;
    boostCategory?: number;
  } = {}
): Array<{ post: T; score: number; matches: SearchMatch[] }> {
  const {
    threshold = 0,
    boostTitle = 10,
    boostExcerpt = 5,
    boostTags = 3,
    boostCategory = 1,
  } = options;

  if (!query.trim()) {
    return posts.map((post) => ({ post, score: 0, matches: [] }));
  }

  const searchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  const results = posts.map((post) => {
    const matches: SearchMatch[] = [];
    let totalScore = 0;

    // 标题匹配
    const titleLower = post.title.toLowerCase();
    for (const term of searchTerms) {
      if (titleLower.includes(term)) {
        matches.push({ field: 'title', value: post.title, score: boostTitle });
        totalScore += boostTitle;
        break;
      }
    }

    // 摘要匹配
    const excerptLower = post.excerpt.toLowerCase();
    let excerptScore = 0;
    for (const term of searchTerms) {
      if (excerptLower.includes(term)) {
        const count = (excerptLower.match(new RegExp(escapeRegex(term), 'g')) || [])
          .length;
        excerptScore += boostExcerpt * count;
      }
    }
    if (excerptScore > 0) {
      matches.push({ field: 'excerpt', value: post.excerpt, score: excerptScore });
      totalScore += excerptScore;
    }

    // 标签匹配
    for (const tag of post.tags) {
      const tagLower = tag.toLowerCase();
      for (const term of searchTerms) {
        if (tagLower.includes(term)) {
          matches.push({ field: 'tags', value: tag, score: boostTags });
          totalScore += boostTags;
          break;
        }
      }
    }

    // 分类匹配
    const categoryLower = post.category.toLowerCase();
    for (const term of searchTerms) {
      if (categoryLower.includes(term)) {
        matches.push({
          field: 'category',
          value: post.category,
          score: boostCategory,
        });
        totalScore += boostCategory;
        break;
      }
    }

    return {
      post,
      score: totalScore,
      matches,
    };
  });

  return results
    .filter((result) => result.score > threshold)
    .sort((a, b) => b.score - a.score);
}

// ============================================
// 搜索历史 Hook
// ============================================

const SEARCH_HISTORY_KEY = 'blog_search_history';
const MAX_HISTORY_SIZE = 10;

/**
 * 搜索历史 Hook
 */
export function useSearchHistory(): {
  history: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
} {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setHistory((prev) => {
      const filtered = prev.filter((item) => item !== query);
      const updated = [query, ...filtered].slice(0, MAX_HISTORY_SIZE);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // ignore
    }
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== query);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  return { history, addToHistory, clearHistory, removeFromHistory };
}

// ============================================
// 虚拟列表 Hook（简化版）
// ============================================

/**
 * 虚拟滚动 Hook（用于大量搜索结果）
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    onScroll,
    totalItems: items.length,
  };
}
