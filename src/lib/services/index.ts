/**
 * 业务逻辑层统一导出
 *
 * 职责：
 * - 文章业务逻辑
 * - Markdown 处理
 * - 数据聚合和转换
 */

// 文章服务
export type {
  AdjacentPosts,
  AdjacentPost,
  PostStats,
  ArchiveItem,
} from './postService';

export {
  // 阅读时间
  calculateReadingTime,
  // 相邻文章
  getAdjacentPosts,
  // 日期格式化
  formatDate,
  getRelativeTime,
  // 归档
  getArchives,
  // 统计
  getPostStats,
  // 数据访问（重新导出）
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
} from './postService';

// Markdown 服务
export type {
  WikiLink,
  MarkdownProcessOptions,
} from './markdownService';

export {
  // WikiLink 处理
  parseWikiLinks,
  transformWikiLinksToHtml,
  processObsidianLinks,
  // Markdown 处理
  markdownToHtml,
  processMarkdown,
  processPostContent,
} from './markdownService';
