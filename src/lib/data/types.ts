/**
 * 数据层统一类型定义
 *
 * 所有数据相关的类型定义集中在此文件，确保类型一致性
 */

// ============================================
// 基础类型
// ============================================

/**
 * 文章状态
 */
export type PostStatus = 'draft' | 'published' | 'archived';

/**
 * 日期字段 - 统一使用 ISO 8601 格式字符串
 */
export type ISODateString = string;

// ============================================
// 文章类型
// ============================================

/**
 * 文章基础接口
 * 包含文章的所有字段定义
 */
export interface Post {
  /** 文章唯一标识（URL 友好） */
  slug: string;
  /** 文章标题 */
  title: string;
  /** 文章内容（Markdown 格式） */
  content: string;
  /** 发布日期（ISO 8601 格式） */
  date: ISODateString;
  /** 创建日期（ISO 8601 格式） */
  created: ISODateString;
  /** 更新日期（ISO 8601 格式，可选） */
  updated?: ISODateString;
  /** 是否为草稿 */
  draft: boolean;
  /** 文章分类 */
  category: string;
  /** 文章标签列表 */
  tags: string[];
  /** 文章摘要 */
  excerpt: string;
  /** 横幅图片路径（可选） */
  banner?: string;
  /** 是否显示阅读时间 */
  readingTime: boolean;
  /** 源文件名（不含扩展名，用于静态生成 URL） */
  fileName?: string;
}

/**
 * 文章元数据接口
 * 不包含 content 字段，用于列表展示
 */
export type PostMeta = Omit<Post, 'content'>;

/**
 * 文章摘要接口
 * 用于文章列表的最小信息
 */
export interface PostSummary {
  slug: string;
  title: string;
  date: ISODateString;
  category: string;
  tags: string[];
  excerpt: string;
  banner?: string;
}

// ============================================
// Frontmatter 类型
// ============================================

/**
 * Markdown Frontmatter 原始数据
 */
export interface PostFrontmatter {
  /** 文章标题 */
  title?: string;
  /** 文章 slug（URL 友好标识，可选，默认使用文件名） */
  slug?: string;
  date?: string | number | Date;
  created?: string | number | Date;
  updated?: string | number | Date;
  draft?: boolean;
  category?: string;
  tags?: string[];
  excerpt?: string;
  banner?: string;
  readingTime?: boolean;
}

// ============================================
// 缓存类型
// ============================================

/**
 * 缓存条目接口
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  size: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
}

// ============================================
// 错误类型
// ============================================

/**
 * 数据访问错误
 */
export class DataAccessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'DataAccessError';
  }
}

/**
 * 文章未找到错误
 */
export class PostNotFoundError extends DataAccessError {
  constructor(slug: string) {
    super(`文章未找到: ${slug}`, 'POST_NOT_FOUND');
    this.name = 'PostNotFoundError';
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends DataAccessError {
  constructor(message: string, cause?: unknown) {
    super(message, 'FILE_SYSTEM_ERROR', cause);
    this.name = 'FileSystemError';
  }
}

// ============================================
// 常量
// ============================================

/** 文章目录路径 */
export const POSTS_DIRECTORY = 'src/posts/content' as const;

/** 草稿目录路径（静态构建时跳过） */
export const DRAFTS_DIRECTORY = 'src/posts/drafts' as const;

/** 默认缓存 TTL（5分钟） */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/** 最大缓存条目数 */
export const MAX_CACHE_SIZE = 100;

/** 摘要默认长度 */
export const DEFAULT_EXCERPT_LENGTH = 150;
