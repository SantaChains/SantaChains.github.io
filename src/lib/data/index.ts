/**
 * 数据层统一导出
 *
 * 职责：
 * - 类型定义
 * - 数据访问（文件系统操作）
 * - 缓存管理
 */

// 类型定义
export type {
  Post,
  PostMeta,
  PostSummary,
  PostFrontmatter,
  ISODateString,
  PostStatus,
  CacheEntry,
  CacheStats,
} from './types';

// 错误类
export {
  DataAccessError,
  PostNotFoundError,
  FileSystemError,
} from './types';

// 常量
export {
  POSTS_DIRECTORY,
  DEFAULT_CACHE_TTL,
  MAX_CACHE_SIZE,
  DEFAULT_EXCERPT_LENGTH,
} from './types';

// 缓存管理
export {
  LRUCache,
  getPostsCache,
  clearPostsCache,
  withCache,
  withAsyncCache,
} from './cache';

// 文章数据访问
export {
  // 日期处理
  parseDate,
  // 路径处理
  processBannerPath,
  getWebBannerPath,
  // 内容处理
  generateExcerpt,
  processContentImages,
  // 文件操作
  getPostFileNames,
  readPostFile,
  // 数据解析
  parsePost,
  parsePostMeta,
  parsePostSummary,
  // 数据查询
  getAllPosts,
  getAllPostMetas,
  getPostBySlug,
  getPostMetaBySlug,
  // 分类和标签
  getAllCategories,
  getAllTags,
  getPostsByCategory,
  getPostsByTag,
  // 图片提取
  getPostImages,
} from './posts';
