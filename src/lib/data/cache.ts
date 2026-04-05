/**
 * 数据缓存管理模块
 *
 * 提供线程安全的内存缓存实现，包含：
 * - LRU 淘汰策略
 * - TTL 过期机制
 * - 大小限制
 * - 统计信息
 */

import type { CacheEntry, CacheStats } from './types';
import { DEFAULT_CACHE_TTL, MAX_CACHE_SIZE } from './types';

/**
 * LRU 缓存管理器
 *
 * 特性：
 * 1. 基于 Map 实现，保持插入顺序
 * 2. 自动淘汰最久未使用的条目
 * 3. 支持 TTL 过期
 * 4. 线程安全（单线程环境）
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;
  private defaultTtl: number;
  private hitCount: number;
  private missCount: number;

  constructor(maxSize: number = MAX_CACHE_SIZE, defaultTtl: number = DEFAULT_CACHE_TTL) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值或 undefined
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (entry === undefined) {
      this.missCount++;
      return undefined;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }

    // 移动到末尾（最新使用）
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hitCount++;

    return entry.data;
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 自定义 TTL（毫秒）
   */
  set(key: K, value: V, ttl?: number): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    });
  }

  /**
   * 删除缓存条目
   * @param key 缓存键
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 检查键是否存在
   * @param key 缓存键
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry === undefined) return false;

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    // 清理过期条目后返回大小
    this.cleanup();
    return this.cache.size;
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0,
    };
  }

  /**
   * 清理过期条目
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取所有键
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

/**
 * 文章缓存实例
 * 全局单例，用于缓存文章数据
 */
let postsCacheInstance: LRUCache<string, unknown> | null = null;

/**
 * 获取文章缓存实例
 */
export function getPostsCache(): LRUCache<string, unknown> {
  if (postsCacheInstance === null) {
    postsCacheInstance = new LRUCache(MAX_CACHE_SIZE, DEFAULT_CACHE_TTL);
  }
  return postsCacheInstance;
}

/**
 * 清除文章缓存
 */
export function clearPostsCache(): void {
  if (postsCacheInstance !== null) {
    postsCacheInstance.clear();
  }
}

/**
 * 缓存装饰器
 * 用于自动缓存函数结果
 */
export function withCache<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const cache = new LRUCache<string, ReturnType<T>>(MAX_CACHE_SIZE, ttl ?? DEFAULT_CACHE_TTL);

  return function (...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * 异步缓存装饰器
 */
export function withAsyncCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const cache = new LRUCache<string, Awaited<ReturnType<T>>>(MAX_CACHE_SIZE, ttl ?? DEFAULT_CACHE_TTL);

  return async function (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args) as Awaited<ReturnType<T>>;
    cache.set(key, result);
    return result;
  } as T;
}
