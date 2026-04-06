/**
 * 文章业务逻辑服务
 *
 * 职责：
 * 1. 文章数据聚合
 * 2. 业务规则处理
 * 3. 阅读时间计算
 * 4. 相邻文章获取
 * 5. 搜索结果处理
 *
 * 依赖：数据层 (src/lib/data/)
 */

import type { PostMeta, ISODateString } from '@/lib/data/types';
import {
  getAllPosts,
  getAllPostMetas,
  getPostBySlug,
  getPostMetaBySlug,
  getAllCategories,
  getAllTags,
  getPostsByCategory,
  getPostsByTag,
  getWebBannerPath,
  parseDate,
} from '@/lib/data/posts';

// ============================================
// 类型定义
// ============================================

/**
 * 相邻文章
 */
export interface AdjacentPosts {
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
}

/**
 * 相邻文章信息
 */
export interface AdjacentPost {
  slug: string;
  title: string;
}

/**
 * 文章统计
 */
export interface PostStats {
  totalPosts: number;
  totalCategories: number;
  totalTags: number;
  averageReadingTime: number;
}

/**
 * 归档项
 */
export interface ArchiveItem {
  year: number;
  month: number;
  posts: PostMeta[];
}

/**
 * 搜索结果
 */
export interface SearchResult {
  post: PostMeta;
  relevance: number;
  matchedFields: string[];
}

// ============================================
// 阅读时间计算
// ============================================

/**
 * 计算阅读时间
 * @param content 文章内容
 * @param wordsPerMinute 每分钟阅读字数（中文约 300，英文约 200）
 * @returns 阅读时间（分钟）
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 300
): number {
  if (!content) return 0;

  // 统计中文字符
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;

  // 统计英文单词
  const englishWords = content
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // 中文按字符计算，英文按单词计算
  const totalReadingTime = Math.ceil(chineseChars / wordsPerMinute + englishWords / 200);

  return Math.max(1, totalReadingTime);
}

// ============================================
// 相邻文章
// ============================================

/**
 * 获取相邻文章
 * @param currentSlug 当前文章 slug
 * @returns 上一篇和下一篇文章
 */
export function getAdjacentPosts(currentSlug: string): AdjacentPosts {
  const posts = getAllPostMetas();
  const currentIndex = posts.findIndex(post => post.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  // 按日期排序后，索引 +1 是更早的文章（prev），-1 是更新的文章（next）
  const prev = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
  const next = currentIndex > 0 ? posts[currentIndex - 1] : null;

  return {
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
  };
}

// ============================================
// 日期格式化
// ============================================

/**
 * 格式化日期
 * @param dateString ISO 日期字符串
 * @param format 格式类型
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  dateString: ISODateString,
  format: 'full' | 'short' | 'iso' = 'full'
): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '无效日期';
  }

  switch (format) {
    case 'short':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    case 'iso':
      return date.toISOString().split('T')[0];

    case 'full':
    default:
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  }
}

/**
 * 获取相对时间描述
 * @param dateString ISO 日期字符串
 * @returns 相对时间描述
 */
export function getRelativeTime(dateString: ISODateString): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 30) return `${diffDays} 天前`;
  if (diffMonths < 12) return `${diffMonths} 个月前`;
  return `${diffYears} 年前`;
}

// ============================================
// 归档
// ============================================

/**
 * 按年月归档文章
 * @returns 归档列表
 */
export function getArchives(): ArchiveItem[] {
  const posts = getAllPostMetas();
  const archives = new Map<string, ArchiveItem>();

  posts.forEach(post => {
    const date = new Date(post.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    if (!archives.has(key)) {
      archives.set(key, {
        year,
        month,
        posts: [],
      });
    }

    archives.get(key)!.posts.push(post);
  });

  return Array.from(archives.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

// ============================================
// 搜索
// ============================================

/**
 * 搜索文章
 * @param query 搜索关键词
 * @param limit 结果限制
 * @returns 搜索结果
 */
export function searchPosts(query: string, limit: number = 10): SearchResult[] {
  if (!query.trim()) return [];

  const posts = getAllPostMetas();
  const searchTerm = query.toLowerCase().trim();
  const searchTerms = searchTerm.split(/\s+/);

  const results: SearchResult[] = posts.map(post => {
    const matchedFields: string[] = [];
    let relevance = 0;

    // 标题匹配（权重最高）
    const titleLower = post.title.toLowerCase();
    if (titleLower.includes(searchTerm)) {
      matchedFields.push('title');
      relevance += titleLower === searchTerm ? 10 : 5;
    }

    // 标签匹配
    const matchingTags = post.tags.filter(tag =>
      tag.toLowerCase().includes(searchTerm)
    );
    if (matchingTags.length > 0) {
      matchedFields.push('tags');
      relevance += matchingTags.length * 3;
    }

    // 分类匹配
    if (post.category.toLowerCase().includes(searchTerm)) {
      matchedFields.push('category');
      relevance += 3;
    }

    // 摘要匹配
    const excerptLower = post.excerpt.toLowerCase();
    const excerptMatches = searchTerms.filter(term =>
      excerptLower.includes(term)
    ).length;
    if (excerptMatches > 0) {
      matchedFields.push('excerpt');
      relevance += excerptMatches * 2;
    }

    return {
      post,
      relevance,
      matchedFields,
    };
  });

  return results
    .filter(result => result.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

// ============================================
// 统计
// ============================================

/**
 * 获取博客统计
 * @returns 统计数据
 */
export function getPostStats(): PostStats {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  const totalReadingTime = posts.reduce((sum, post) => {
    return sum + calculateReadingTime(post.content);
  }, 0);

  return {
    totalPosts: posts.length,
    totalCategories: categories.length,
    totalTags: tags.length,
    averageReadingTime: posts.length > 0 ? Math.round(totalReadingTime / posts.length) : 0,
  };
}

// ============================================
// 数据导出（重新导出数据层函数）
// ============================================

export {
  getAllPosts,
  getAllPostMetas,
  getPostBySlug,
  getPostMetaBySlug,
  getAllCategories,
  getAllTags,
  getPostsByCategory,
  getPostsByTag,
  getWebBannerPath,
  parseDate,
};
