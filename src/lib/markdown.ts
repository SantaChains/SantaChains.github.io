/**
 * Markdown 处理模块（向后兼容）
 *
 * @deprecated 请使用新的分层架构：
 * - Markdown 处理：@/lib/services/markdownService
 * - 数据访问：@/lib/data
 *
 * 此文件保留用于向后兼容，将在未来版本中移除
 */

import {
  markdownToHtml,
  processMarkdown,
  transformWikiLinksToHtml,
  parseWikiLinks,
  processPostContent,
} from './services/markdownService';

import {
  getAllPosts,
  getPostBySlug,
  getAllPostMetas,
  processContentImages,
  processBannerPath,
  parseDate,
} from './data/posts';

import type { Post, PostMeta } from './data/types';

// 重新导出类型，保持向后兼容
export type { Post, PostMeta };

// 重新导出函数，保持向后兼容
export {
  // Markdown 处理
  markdownToHtml,
  processMarkdown,
  transformWikiLinksToHtml,
  parseWikiLinks,
  processPostContent,
  // 数据访问
  getAllPosts,
  getPostBySlug,
  getAllPostMetas,
  processContentImages,
  processBannerPath,
  parseDate,
};

/**
 * 构建文章索引（向后兼容）
 * @deprecated 请使用 getAllPostMetas()
 */
export function buildPostIndex(): PostMeta[] {
  return getAllPostMetas();
}

// WikiLink 类型（向后兼容）
export interface WikiLink {
  raw: string;
  filename: string;
  display?: string;
}
