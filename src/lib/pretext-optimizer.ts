/**
 * Pretext 性能优化器
 * 
 * 提供高级缓存、批量处理和性能监控功能
 */

import { 
  prepareWithSegments, 
  layoutWithLines,
  clearCache,
  type PreparedTextWithSegments,
  type LayoutLine
} from '@chenglou/pretext';

// 全局配置
const CONFIG = {
  MAX_CACHE_SIZE: 50,
  WIDTH_TOLERANCE: 5,
  DEBOUNCE_MS: 16,
  BATCH_SIZE: 10,
} as const;

// 缓存条目接口
interface CacheEntry {
  prepared: PreparedTextWithSegments;
  layouts: Map<number, LayoutLine[]>;
  lastAccessed: number;
  accessCount: number;
}

// 性能指标
interface PerformanceMetrics {
  prepareTime: number;
  layoutTime: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * LRU 缓存管理器
 */
class LRUCache<K, V> extends Map<K, V> {
  private maxSize: number;

  constructor(maxSize: number) {
    super();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = super.get(key);
    if (value !== undefined) {
      // 移动到末尾（最新）
      super.delete(key);
      super.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): this {
    if (super.has(key)) {
      super.delete(key);
    } else if (super.size >= this.maxSize) {
      // 删除最旧的
      const firstKey = super.keys().next().value;
      if (firstKey !== undefined) {
        super.delete(firstKey);
      }
    }
    super.set(key, value);
    return this;
  }
}

/**
 * Pretext 优化器类
 */
class PretextOptimizer {
  private contentCache: LRUCache<string, CacheEntry>;
  private metrics: PerformanceMetrics;
  private pendingLayouts: Map<string, number[]>;
  private rafId: number | null = null;

  constructor() {
    this.contentCache = new LRUCache(CONFIG.MAX_CACHE_SIZE);
    this.metrics = {
      prepareTime: 0,
      layoutTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.pendingLayouts = new Map();
  }

  /**
   * 准备文本（带缓存）
   */
  prepare(content: string, fontString: string): PreparedTextWithSegments {
    const cacheKey = `${content}::${fontString}`;
    const cached = this.contentCache.get(cacheKey);

    if (cached) {
      cached.lastAccessed = Date.now();
      cached.accessCount++;
      this.metrics.cacheHits++;
      return cached.prepared;
    }

    const startTime = performance.now();
    const prepared = prepareWithSegments(content, fontString, {
      whiteSpace: 'normal',
    });
    this.metrics.prepareTime += performance.now() - startTime;
    this.metrics.cacheMisses++;

    // 存入缓存
    this.contentCache.set(cacheKey, {
      prepared,
      layouts: new Map(),
      lastAccessed: Date.now(),
      accessCount: 1,
    });

    return prepared;
  }

  /**
   * 执行布局（带缓存和批量处理）
   */
  layout(
    content: string,
    fontString: string,
    width: number,
    lineHeight: number
  ): LayoutLine[] {
    const cacheKey = `${content}::${fontString}`;
    const entry = this.contentCache.get(cacheKey);

    if (!entry) {
      // 需要先准备文本
      this.prepare(content, fontString);
      return this.layout(content, fontString, width, lineHeight);
    }

    // 检查布局缓存
    for (const [cachedWidth, lines] of entry.layouts) {
      if (Math.abs(cachedWidth - width) <= CONFIG.WIDTH_TOLERANCE) {
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        this.metrics.cacheHits++;
        return lines;
      }
    }

    // 执行布局
    const startTime = performance.now();
    const result = layoutWithLines(entry.prepared, width, lineHeight);
    this.metrics.layoutTime += performance.now() - startTime;
    this.metrics.cacheMisses++;

    // 缓存布局结果
    entry.layouts.set(width, result.lines);

    // 限制单个内容的布局缓存
    if (entry.layouts.size > 20) {
      const firstKey = entry.layouts.keys().next().value;
      if (firstKey !== undefined) {
        entry.layouts.delete(firstKey);
      }
    }

    return result.lines;
  }

  /**
   * 批量布局（用于初始加载多个尺寸）
   */
  batchLayout(
    content: string,
    fontString: string,
    widths: number[],
    lineHeight: number
  ): Map<number, LayoutLine[]> {
    const results = new Map<number, LayoutLine[]>();
    
    // 先准备一次
    this.prepare(content, fontString);

    // 批量执行
    for (const width of widths) {
      const lines = this.layout(content, fontString, width, lineHeight);
      results.set(width, lines);
    }

    return results;
  }

  /**
   * 延迟布局（用于响应式）
   */
  debouncedLayout(
    content: string,
    fontString: string,
    width: number,
    lineHeight: number,
    callback: (lines: LayoutLine[]) => void
  ): void {
    // 取消之前的请求
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    // 使用 RAF 节流
    this.rafId = requestAnimationFrame(() => {
      const lines = this.layout(content, fontString, width, lineHeight);
      callback(lines);
      this.rafId = null;
    });
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 重置性能指标
   */
  resetMetrics(): void {
    this.metrics = {
      prepareTime: 0,
      layoutTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    contentCount: number;
    totalLayouts: number;
    hitRate: number;
  } {
    let totalLayouts = 0;
    for (const entry of this.contentCache.values()) {
      totalLayouts += entry.layouts.size;
    }

    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = total > 0 ? this.metrics.cacheHits / total : 0;

    return {
      contentCount: this.contentCache.size,
      totalLayouts,
      hitRate,
    };
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.contentCache.clear();
    clearCache(); // 清空 Pretext 内部缓存
  }

  /**
   * 预加载内容
   */
  preload(contents: Array<{ content: string; fontString: string }>): void {
    for (const { content, fontString } of contents) {
      // 使用 requestIdleCallback 避免阻塞主线程
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          this.prepare(content, fontString);
        }, { timeout: 100 });
      } else {
        setTimeout(() => {
          this.prepare(content, fontString);
        }, 0);
      }
    }
  }
}

// 单例实例
let optimizerInstance: PretextOptimizer | null = null;

export function getPretextOptimizer(): PretextOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new PretextOptimizer();
  }
  return optimizerInstance;
}

export { PretextOptimizer, CONFIG };
export type { CacheEntry, PerformanceMetrics };
