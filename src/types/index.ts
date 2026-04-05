/**
 * 全局类型定义
 *
 * 注意：所有数据相关类型已迁移到 src/lib/data/types.ts
 * 此文件保留用于向后兼容，新代码应直接从 @/lib/data 导入
 */

// 重新导出数据层类型，保持向后兼容
export type {
  Post,
  PostMeta,
  PostSummary,
  PostFrontmatter,
  ISODateString,
  PostStatus,
  CacheEntry,
  CacheStats,
  // 错误类
  DataAccessError,
  PostNotFoundError,
  FileSystemError,
} from '@/lib/data/types';
