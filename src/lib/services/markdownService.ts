/**
 * Markdown 处理服务
 *
 * 职责：
 * 1. Markdown 转 HTML
 * 2. WikiLink 处理
 * 3. 代码高亮
 * 4. 内容后处理
 *
 * 依赖：数据层 (src/lib/data/)
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import type { Post, PostMeta } from '@/lib/data/types';
import { processContentImages } from '@/lib/data/posts';

// ============================================
// 类型定义
// ============================================

/**
 * WikiLink 类型
 */
export interface WikiLink {
  raw: string;
  filename: string;
  display?: string;
}

/**
 * Markdown 处理选项
 */
export interface MarkdownProcessOptions {
  allowDangerousHtml?: boolean;
  processImages?: boolean;
  processWikiLinks?: boolean;
}

// ============================================
// 常量
// ============================================

/** WikiLink 正则表达式 */
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// ============================================
// WikiLink 处理
// ============================================

/**
 * 解析 WikiLinks
 * @param content 要解析的内容
 * @returns WikiLink 数组
 */
export function parseWikiLinks(content: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;

  // 重置正则表达式 lastIndex
  WIKI_LINK_REGEX.lastIndex = 0;

  while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
    const [raw, filename, display] = match;
    links.push({
      raw,
      filename: filename.trim(),
      display: display?.trim(),
    });
  }

  return links;
}

/**
 * 将 WikiLinks 转换为 HTML 链接
 * @param content 原始内容
 * @param posts 文章索引数组
 * @returns 转换后的内容
 */
export function transformWikiLinksToHtml(content: string, posts: PostMeta[]): string {
  // 创建 slug 集合用于快速查找
  const slugSet = new Set(posts.map(post => post.slug));
  const titleToSlug = new Map(posts.map(post => [post.title, post.slug]));

  return content.replace(WIKI_LINK_REGEX, (match, filename, display) => {
    const linkText = display?.trim() || filename.trim();
    const targetSlug = filename.trim().replace(/\.md$/, '');

    // 检查目标文章是否存在（通过 slug 或标题）
    const exists = slugSet.has(targetSlug) ||
      (titleToSlug.has(filename.trim()) && slugSet.has(titleToSlug.get(filename.trim())!));

    if (exists) {
      return `<a href="/posts/${targetSlug}" class="wikilink">${linkText}</a>`;
    }

    // 文章不存在，添加缺失标记
    return `<a href="/posts/${targetSlug}" class="wikilink wikilink-missing">${linkText}</a>`;
  });
}

/**
 * 处理 Obsidian 内部链接
 * @param content 原始内容
 * @param posts 文章列表
 * @returns 处理后的内容
 */
export function processObsidianLinks(content: string, posts: PostMeta[]): string {
  const titleToSlug = new Map<string, string>();
  posts.forEach(post => {
    titleToSlug.set(post.title, post.slug);
    titleToSlug.set(post.slug, post.slug);
  });

  return content.replace(WIKI_LINK_REGEX, (match, link, display) => {
    const linkText = display || link;
    const slug = titleToSlug.get(link) || titleToSlug.get(link.replace(/\.md$/, ''));

    if (slug) {
      return `[${linkText}](/posts/${slug})`;
    }

    // 如果没找到对应文章，保留原文本但不创建链接
    return linkText;
  });
}

// ============================================
// Markdown 转 HTML
// ============================================

/**
 * 将 Markdown 转换为 HTML
 * @param markdown Markdown 内容
 * @param options 处理选项
 * @returns HTML 内容
 */
export async function markdownToHtml(
  markdown: string,
  options: MarkdownProcessOptions = {}
): Promise<string> {
  const {
    allowDangerousHtml = true,
    processImages = true,
  } = options;

  // 预处理图片路径
  let processedMarkdown = markdown;
  if (processImages) {
    processedMarkdown = processContentImages(markdown);
  }

  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkHtml, { allowDangerousHtml })
      .process(processedMarkdown);

    return result.toString();
  } catch (error) {
    console.error('[markdownService] Markdown 转 HTML 失败:', error);
    // 回退：返回转义后的原始内容
    return escapeHtml(processedMarkdown);
  }
}

/**
 * 处理 Markdown 内容（同步版本，简单处理）
 * @param content Markdown 内容
 * @returns 处理后的 HTML
 */
export function processMarkdown(content: string): string {
  let html = content;

  // 处理代码块
  html = html.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    '<pre class="code-block"><code>$2</code></pre>'
  );

  // 处理行内代码
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="inline-code">$1</code>'
  );

  // 处理标题
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 处理粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // 处理斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 处理删除线
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // 处理图片（预处理过的路径）
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="markdown-image" loading="lazy" />'
  );

  // 处理链接
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="markdown-link" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // 处理引用块
  html = html.replace(
    /^> (.*$)/gim,
    '<blockquote>$1</blockquote>'
  );

  // 处理任务列表
  html = html.replace(
    /^\s*[-*+] \[x\] (.*$)/gim,
    '<li class="task-list-item"><input type="checkbox" checked disabled /> $1</li>'
  );
  html = html.replace(
    /^\s*[-*+] \[ \] (.*$)/gim,
    '<li class="task-list-item"><input type="checkbox" disabled /> $1</li>'
  );

  // 处理无序列表
  html = html.replace(
    /^\s*[-*+] (.*$)/gim,
    '<li class="list-item">$1</li>'
  );

  // 处理有序列表
  html = html.replace(
    /^\s*\d+\. (.*$)/gim,
    '<li class="list-item ordered">$1</li>'
  );

  // 处理水平分割线
  html = html.replace(
    /^---+$/gim,
    '<hr class="divider" />'
  );

  // 处理表格
  html = processTables(html);

  // 处理段落
  html = processParagraphs(html);

  // 包裹列表项
  html = wrapListItems(html);

  return html;
}

/**
 * 处理段落
 */
function processParagraphs(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      continue;
    }

    // 检查是否是块级元素
    const isBlockElement = /^<(h[1-6]|pre|blockquote|hr|li|ul|ol|img)/.test(trimmed);
    const isClosingTag = /^<\//.test(trimmed);

    if (isBlockElement || isClosingTag) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(line);
    } else {
      if (!inParagraph) {
        result.push('<p class="paragraph">');
        inParagraph = true;
      }
      result.push(line);
    }
  }

  if (inParagraph) {
    result.push('</p>');
  }

  return result.join('\n');
}

/**
 * 包裹列表项
 */
function wrapListItems(html: string): string {
  // 包裹任务列表
  html = html.replace(
    /(<li class="task-list-item">.*?<\/li>\n?)+/g,
    (match) => `<ul class="task-list">\n${match}</ul>`
  );

  // 包裹无序列表
  html = html.replace(
    /(<li class="list-item">.*?<\/li>\n?)+/g,
    (match) => `<ul class="unordered-list">\n${match}</ul>`
  );

  // 包裹有序列表
  html = html.replace(
    /(<li class="list-item ordered">.*?<\/li>\n?)+/g,
    (match) => `<ol class="ordered-list">\n${match}</ol>`
  );

  return html;
}

/**
 * 处理 Markdown 表格
 */
function processTables(html: string): string {
  const tableRegex = /(\|[^\n]+\|\n)(\|[-:\|\s]+\|\n)((?:\|[^\n]+\|\n?)+)/g;

  return html.replace(tableRegex, (match, headerRow, separator, bodyRows) => {
    // 解析表头
    const headers = headerRow
      .split('|')
      .map((cell: string) => cell.trim())
      .filter((cell: string) => cell);

    if (headers.length === 0) return match;

    // 解析对齐方式
    const aligns = separator
      .split('|')
      .map((cell: string) => cell.trim())
      .filter((cell: string) => cell)
      .map((cell: string) => {
        if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
        if (cell.endsWith(':')) return 'right';
        return 'left';
      });

    // 解析表格体
    const rows = bodyRows
      .trim()
      .split('\n')
      .filter((row: string) => row.trim())
      .map((row: string) => {
        return row
          .split('|')
          .map((cell: string) => cell.trim())
          .filter((cell: string) => cell);
      })
      .filter((row: string[]) => row.length > 0);

    if (rows.length === 0) return match;

    // 构建 HTML 表格
    let tableHtml = '<div class="table-wrapper">\n<table class="markdown-table">\n';

    // 表头
    tableHtml += '  <thead>\n    <tr>\n';
    headers.forEach((header: string, index: number) => {
      const align = aligns[index] || 'left';
      tableHtml += `      <th style="text-align: ${align}">${escapeHtml(header)}</th>\n`;
    });
    tableHtml += '    </tr>\n  </thead>\n';

    // 表格体
    tableHtml += '  <tbody>\n';
    rows.forEach((row: string[]) => {
      tableHtml += '    <tr>\n';
      row.forEach((cell: string, index: number) => {
        const align = aligns[index] || 'left';
        tableHtml += `      <td style="text-align: ${align}">${escapeHtml(cell)}</td>\n`;
      });
      tableHtml += '    </tr>\n';
    });
    tableHtml += '  </tbody>\n';

    tableHtml += '</table>\n</div>';

    return tableHtml;
  });
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================
// 完整处理流程
// ============================================

/**
 * 完整处理文章 Markdown 内容
 * @param content Markdown 内容
 * @param posts 所有文章元数据（用于 WikiLink）
 * @returns 处理后的 HTML
 */
export async function processPostContent(
  content: string,
  posts: PostMeta[]
): Promise<string> {
  // 1. 转换 Markdown 为 HTML
  let html = await markdownToHtml(content, {
    processImages: true,
    processWikiLinks: false, // WikiLinks 单独处理
  });

  // 2. 处理 WikiLinks
  html = transformWikiLinksToHtml(html, posts);

  return html;
}
