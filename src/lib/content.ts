/**
 * 内容处理模块（向后兼容）
 *
 * @deprecated 请使用新的分层架构：
 * - 数据访问：@/lib/data
 * - 业务逻辑：@/lib/services
 *
 * 此文件保留用于向后兼容，将在未来版本中移除
 */

import {
  getAllPosts,
  getPostBySlug,
  getAllCategories,
  getAllTags,
  getPostImages,
  processContentImages,
  processBannerPath,
  parseDate,
} from './data/posts';

import type { Post, PostMeta } from './data/types';

// 重新导出，保持向后兼容
export {
  getAllPosts,
  getPostBySlug,
  getAllCategories,
  getAllTags,
  getPostImages,
  processContentImages,
  processBannerPath,
  parseDate,
};

export type { Post, PostMeta };

// 为了完全兼容旧代码，导出默认对象
export default {
  getAllPosts,
  getPostBySlug,
  getAllCategories,
  getAllTags,
  getPostImages,
  processContentImages,
  processBannerPath,
  parseDate,
};
