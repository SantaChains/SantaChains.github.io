/**
 * 文章数据访问层
 *
 * 职责：
 * 1. 文件系统操作（读取 Markdown 文件）
 * 2. 数据解析（Frontmatter、内容处理）
 * 3. 数据转换（日期格式、路径处理）
 * 4. 错误处理
 *
 * 注意：此层不处理业务逻辑，只负责原始数据访问
 *
 * 中文和标点符号支持：
 * - slug 支持中文、英文、标点符号
 * - 使用 encodeURIComponent/decodeURIComponent 处理 URL 编码
 * - 文件系统操作使用原生中文支持
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type {
  Post,
  PostMeta,
  PostSummary,
  PostFrontmatter,
  ISODateString,
} from './types';
import {
  POSTS_DIRECTORY,
  DEFAULT_EXCERPT_LENGTH,
  PostNotFoundError,
  FileSystemError,
} from './types';
import { getPostsCache } from './cache';

// ============================================
// 路径配置
// ============================================

/** 文章目录绝对路径 */
const getPostsDirectory = (): string => {
  return path.join(process.cwd(), POSTS_DIRECTORY);
};

// ============================================
// 日期处理
// ============================================

/**
 * 解析日期为 ISO 8601 格式
 * @param dateValue 原始日期值
 * @returns ISO 8601 格式字符串
 */
export function parseDate(dateValue: string | number | Date | undefined): ISODateString {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (typeof dateValue === 'string') {
    // Obsidian created 格式: yyyy-MM-dd'T'HH:mm
    const obsidianFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (obsidianFormat.test(dateValue)) {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    // 简单日期格式: yyyy-MM-dd
    const simpleFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (simpleFormat.test(dateValue)) {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    // 其他格式，直接尝试解析
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (dateValue instanceof Date) {
    if (!isNaN(dateValue.getTime())) {
      return dateValue.toISOString();
    }
  }

  // 回退到当前时间
  return new Date().toISOString();
}

// ============================================
// 路径处理
// ============================================

/**
 * 文件名到完整路径的映射缓存
 * 用于支持最短路径查找
 */
let imagePathMap: Map<string, string> | null = null;

/**
 * 构建图片文件名到完整路径的映射
 * 扫描 images 目录及其子目录，建立文件名索引
 */
function buildImagePathMap(): Map<string, string> {
  const map = new Map<string, string>();
  const imagesDir = path.join(process.cwd(), 'public', 'posts', 'images');
  
  if (!fs.existsSync(imagesDir)) {
    return map;
  }

  function scanDirectory(dir: string, relativePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath, entryRelativePath);
      } else if (entry.isFile()) {
        map.set(entry.name.toLowerCase(), entryRelativePath);
      }
    }
  }

  scanDirectory(imagesDir);
  return map;
}

/**
 * 获取图片路径映射（懒加载）
 */
function getImagePathMap(): Map<string, string> {
  if (!imagePathMap) {
    imagePathMap = buildImagePathMap();
  }
  return imagePathMap;
}

/**
 * 通过最短路径查找图片
 * @param filename 文件名（不带路径或带部分路径）
 * @returns 标准化的图片路径
 */
function findImageByShortestPath(filename: string): string {
  const map = getImagePathMap();
  
  // 提取文件名部分
  const basename = path.basename(filename).toLowerCase();
  
  // 直接查找
  if (map.has(basename)) {
    return `images/${map.get(basename)!}`;
  }
  
  // 如果没找到，尝试使用提供的路径
  if (filename.includes('/')) {
    const cleanPath = filename.replace(/^\.\//, '').replace(/^images\//, '');
    return `images/${cleanPath}`;
  }
  
  // 默认返回
  return `images/${filename}`;
}

/**
 * 处理 banner 图片路径
 * 支持多种格式：
 * - 最短路径: "rustprograming.png" → 自动查找
 * - Obsidian 风格: "[[rustprograming.png]]"
 * - 完整路径: "images/rustprograming.png"
 * - 子目录路径: "images/photos/rustprograming.png"
 * - 相对路径: "./images/rustprograming.png"
 * @param bannerPath 原始路径
 * @returns 标准化路径
 */
export function processBannerPath(bannerPath: string | undefined): string | undefined {
  if (!bannerPath) return undefined;

  // 移除末尾斜杠
  const cleanPath = bannerPath.replace(/\/$/, '');

  // 验证是否包含文件名
  const hasFilename = cleanPath.split('/').pop()?.includes('.');
  if (!hasFilename) {
    console.warn(`[posts] Invalid banner path (no filename): ${bannerPath}`);
    return undefined;
  }

  // 已经是绝对路径
  if (cleanPath.startsWith('/')) {
    return cleanPath;
  }

  // 处理 Obsidian 风格 [[image.jpg]]
  if (cleanPath.startsWith('[[') && cleanPath.endsWith(']]')) {
    const filename = cleanPath.slice(2, -2);
    return findImageByShortestPath(filename);
  }

  // 处理相对路径 ./images/xxx.jpg
  if (cleanPath.startsWith('./images/')) {
    const filename = cleanPath.replace('./images/', '');
    return findImageByShortestPath(filename);
  }

  // 处理已经有 images/ 前缀的路径
  if (cleanPath.startsWith('images/')) {
    const filename = cleanPath.replace('images/', '');
    return findImageByShortestPath(filename);
  }

  // 最短路径：直接用文件名查找
  return findImageByShortestPath(cleanPath);
}

/**
 * 获取 Web 可用的 banner 路径
 * @param bannerPath 原始路径
 * @returns Web 路径
 */
export function getWebBannerPath(bannerPath: string | undefined): string {
  if (!bannerPath) return '';
  if (bannerPath.startsWith('/')) return bannerPath;
  return `/posts/${bannerPath}`;
}

// ============================================
// 内容处理
// ============================================

/**
 * 生成文章摘要
 * @param content 文章内容
 * @param excerpt 预定义的摘要
 * @param maxLength 最大长度
 * @returns 摘要文本
 */
export function generateExcerpt(
  content: string,
  excerpt?: string,
  maxLength: number = DEFAULT_EXCERPT_LENGTH
): string {
  if (excerpt) return excerpt;

  const cleanContent = content.replace(/[#*`\[\]]/g, '').trim();

  if (cleanContent.length > maxLength) {
    return cleanContent.slice(0, maxLength) + '...';
  }

  return cleanContent;
}

/**
 * 处理内容中的图片路径
 * 支持多种格式：
 * - 最短路径: ![alt](rustprograming.png) → 自动查找
 * - Obsidian 风格: ![[rustprograming.png]]
 * - 完整路径: ![alt](images/rustprograming.png)
 * - 子目录路径: ![alt](images/photos/rustprograming.png)
 * - 相对路径: ![alt](./images/rustprograming.png)
 * @param content Markdown 内容
 * @returns 处理后的内容
 */
export function processContentImages(content: string): string {
  // 处理 Obsidian 图片: ![[image.jpg]] 或 ![[subdir/image.jpg]]
  content = content.replace(
    /!\[\[([^\]]+)\]\]/g,
    (match, imagePath) => {
      const processedPath = findImageByShortestPath(imagePath);
      const webPath = getWebBannerPath(processedPath);
      return `![${path.basename(imagePath)}](${webPath})`;
    }
  );

  // 处理 Markdown 图片: ![alt](./images/xxx.jpg)
  content = content.replace(
    /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g,
    (match, alt, imagePath) => {
      const processedPath = findImageByShortestPath(imagePath);
      const webPath = getWebBannerPath(processedPath);
      return `![${alt}](${webPath})`;
    }
  );

  // 处理 Markdown 图片: ![alt](images/xxx.jpg)
  content = content.replace(
    /!\[([^\]]*)\]\(images\/([^)]+)\)/g,
    (match, alt, imagePath) => {
      const processedPath = findImageByShortestPath(imagePath);
      const webPath = getWebBannerPath(processedPath);
      return `![${alt}](${webPath})`;
    }
  );

  // 处理最短路径 Markdown 图片: ![alt](rustprograming.png)
  // 只有当路径不包含 / 且不以 http(s):// 开头时才处理
  content = content.replace(
    /!\[([^\]]*)\]\((?!(?:https?:\/\/|\/))([^\/)]+\.[^\/)]+)\)/g,
    (match, alt, imagePath) => {
      const processedPath = findImageByShortestPath(imagePath);
      const webPath = getWebBannerPath(processedPath);
      return `![${alt}](${webPath})`;
    }
  );

  return content;
}

// ============================================
// slug 到文件名映射缓存
// ============================================

/**
 * slug 到文件名的映射缓存
 * key: slug (URL 友好标识)
 * value: 文件名 (不含 .md 扩展名)
 */
let slugToFileNameMap: Map<string, string> | null = null;

/**
 * 构建 slug 到文件名的映射
 * 扫描所有文章文件，读取 frontmatter 中的 slug，建立映射关系
 */
function buildSlugToFileNameMap(): Map<string, string> {
  const postsDir = getPostsDirectory();
  const map = new Map<string, string>();
  
  const fileNames = fs.readdirSync(postsDir).filter(name => name.endsWith('.md'));
  
  fileNames.forEach(fileName => {
    const filePath = path.join(postsDir, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    
    const fileSlug = fileName.replace(/\.md$/, '');
    const frontmatterSlug = data.slug as string | undefined;
    const actualSlug = frontmatterSlug || fileSlug;
    
    map.set(actualSlug, fileSlug);
  });
  
  return map;
}

/**
 * 获取 slug 到文件名的映射（懒加载）
 */
function getSlugToFileNameMap(): Map<string, string> {
  if (!slugToFileNameMap) {
    slugToFileNameMap = buildSlugToFileNameMap();
  }
  return slugToFileNameMap;
}

/**
 * 根据 slug 查找对应的文件名
 * @param slug 文章 slug
 * @returns 文件名（不含 .md）或 null
 */
function findFileNameBySlug(slug: string): string | null {
  const map = getSlugToFileNameMap();
  return map.get(slug) || null;
}

// ============================================
// 文件操作
// ============================================

/**
 * 确保目录存在
 * @param dir 目录路径
 */
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      throw new FileSystemError(`无法创建目录: ${dir}`, error);
    }
  }
}

/**
 * 获取所有文章文件名
 * @returns 文件名列表
 */
export function getPostFileNames(): string[] {
  const postsDir = getPostsDirectory();

  try {
    ensureDirectoryExists(postsDir);
    return fs.readdirSync(postsDir).filter(name => name.endsWith('.md'));
  } catch (error) {
    if (error instanceof FileSystemError) throw error;
    throw new FileSystemError('无法读取文章目录', error);
  }
}

/**
 * 读取文章文件内容
 * @param slugOrFileName 文章 slug 或文件名
 * @returns 原始文件内容
 */
export function readPostFile(slugOrFileName: string): string {
  const postsDir = getPostsDirectory();
  // 解码 URL 编码的 slug（支持中文）
  const decoded = decodeURIComponent(slugOrFileName);
  
  // 首先尝试直接按文件名读取
  let filePath = path.join(postsDir, `${decoded}.md`);
  
  // 如果直接读取失败，尝试通过 slug 映射查找
  if (!fs.existsSync(filePath)) {
    const fileName = findFileNameBySlug(decoded);
    if (fileName) {
      filePath = path.join(postsDir, `${fileName}.md`);
    }
  }

  try {
    if (!fs.existsSync(filePath)) {
      throw new PostNotFoundError(slugOrFileName);
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error instanceof PostNotFoundError) throw error;
    throw new FileSystemError(`无法读取文章文件: ${slugOrFileName}`, error);
  }
}

// ============================================
// 数据解析
// ============================================

/**
 * 解析文章数据
 * @param slug 文章 slug
 * @param fileContent 文件内容
 * @returns 解析后的文章数据
 */
export function parsePost(fileSlug: string, fileContent: string): Post {
  const { data, content } = matter(fileContent);
  const frontmatter = data as PostFrontmatter;

  // 优先使用 frontmatter 中的 slug，否则使用文件名
  const slug = frontmatter.slug || fileSlug;

  // 解析日期
  const date = parseDate(frontmatter.created || frontmatter.date);
  const created = frontmatter.created ? parseDate(frontmatter.created) : date;
  const updated = frontmatter.updated ? parseDate(frontmatter.updated) : undefined;

  // 处理 banner 路径
  const banner = processBannerPath(frontmatter.banner);

  // 处理内容图片
  const processedContent = processContentImages(content);

  // 生成摘要
  const excerpt = generateExcerpt(processedContent, frontmatter.excerpt);

  return {
    slug,
    title: frontmatter.title || '无标题',
    date,
    created,
    updated,
    draft: frontmatter.draft || false,
    category: frontmatter.category || '未分类',
    tags: frontmatter.tags || [],
    excerpt,
    banner,
    readingTime: frontmatter.readingTime !== false,
    content: processedContent,
  };
}

/**
 * 解析文章元数据（不包含内容）
 * @param slug 文章 slug
 * @param fileContent 文件内容
 * @returns 文章元数据
 */
export function parsePostMeta(slug: string, fileContent: string): PostMeta {
  const post = parsePost(slug, fileContent);
  const { content: _content, ...meta } = post;
  void _content;
  return meta;
}

/**
 * 解析文章摘要
 * @param slug 文章 slug
 * @param fileContent 文件内容
 * @returns 文章摘要
 */
export function parsePostSummary(slug: string, fileContent: string): PostSummary {
  const meta = parsePostMeta(slug, fileContent);
  return {
    slug: meta.slug,
    title: meta.title,
    date: meta.date,
    category: meta.category,
    tags: meta.tags,
    excerpt: meta.excerpt,
    banner: meta.banner,
  };
}

// ============================================
// 数据查询
// ============================================

/**
 * 获取所有文章
 * @param includeDrafts 是否包含草稿
 * @returns 文章列表
 */
export function getAllPosts(includeDrafts: boolean = false): Post[] {
  const cache = getPostsCache();
  const cacheKey = `all-posts-${includeDrafts}`;
  const cached = cache.get(cacheKey) as Post[] | undefined;

  if (cached !== undefined) {
    return cached;
  }

  const fileNames = getPostFileNames();

  const posts = fileNames
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      try {
        const content = readPostFile(slug);
        return parsePost(slug, content);
      } catch (error) {
        console.error(`[posts] 解析文章失败: ${slug}`, error);
        return null;
      }
    })
    .filter((post): post is Post => post !== null)
    .filter(post => includeDrafts || !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  cache.set(cacheKey, posts);
  return posts;
}

/**
 * 获取所有文章元数据
 * @param includeDrafts 是否包含草稿
 * @returns 文章元数据列表
 */
export function getAllPostMetas(includeDrafts: boolean = false): PostMeta[] {
  const posts = getAllPosts(includeDrafts);
  return posts.map(({ content, ...meta }) => {
    void content;
    return meta;
  });
}

/**
 * 根据 slug 获取文章
 * @param slug 文章 slug
 * @returns 文章数据或 null
 */
export function getPostBySlug(slug: string): Post | null {
  const cache = getPostsCache();
  // 解码 URL 编码的 slug（支持中文文件名）
  const decodedSlug = decodeURIComponent(slug);
  const cacheKey = `post-${decodedSlug}`;
  const cached = cache.get(cacheKey) as Post | undefined;

  if (cached !== undefined) {
    return cached;
  }

  try {
    const content = readPostFile(decodedSlug);
    const post = parsePost(decodedSlug, content);

    if (post.draft) {
      return null; // 草稿不通过此接口返回
    }

    cache.set(cacheKey, post);
    return post;
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      return null;
    }
    throw error;
  }
}

/**
 * 根据 slug 获取文章元数据
 * @param slug 文章 slug
 * @returns 文章元数据或 null
 */
export function getPostMetaBySlug(slug: string): PostMeta | null {
  const post = getPostBySlug(slug);
  if (!post) return null;

  const { content, ...meta } = post;
  void content;
  return meta;
}

// ============================================
// 分类和标签
// ============================================

/**
 * 获取所有分类
 * @returns 分类列表
 */
export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories).sort();
}

/**
 * 获取所有标签
 * @returns 标签列表
 */
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set(posts.flatMap(post => post.tags));
  return Array.from(tags).sort();
}

/**
 * 根据分类获取文章
 * @param category 分类名称
 * @returns 文章列表
 */
export function getPostsByCategory(category: string): Post[] {
  const posts = getAllPosts();
  return posts.filter(post => post.category === category);
}

/**
 * 根据标签获取文章
 * @param tag 标签名称
 * @returns 文章列表
 */
export function getPostsByTag(tag: string): Post[] {
  const posts = getAllPosts();
  return posts.filter(post => post.tags.includes(tag));
}

// ============================================
// 图片提取
// ============================================

/**
 * 获取文章中的所有图片
 * @param slug 文章 slug
 * @returns 图片 URL 列表
 */
export function getPostImages(slug: string): string[] {
  const post = getPostBySlug(slug);
  if (!post) return [];

  const images: string[] = [];

  // 提取 Markdown 图片
  const mdImages = post.content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
  mdImages.forEach(img => {
    const match = img.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (match) {
      images.push(match[2]);
    }
  });

  // 提取 Obsidian 图片
  const obsidianImages = post.content.match(/!\[\[([^\]]+)\]\]/g) || [];
  obsidianImages.forEach(img => {
    const match = img.match(/!\[\[([^\]]+)\]\]/);
    if (match) {
      images.push(`/posts/images/${match[1]}`);
    }
  });

  return images;
}
