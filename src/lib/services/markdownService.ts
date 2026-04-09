/**
 * Markdown 处理服务
 *
 * 职责：
 * 1. Markdown 转 HTML
 * 2. WikiLink 处理
 * 3. 代码高亮 (Shiki)
 * 4. 内容后处理
 *
 * 依赖：数据层 (src/lib/data/)
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { codeToHtml } from 'shiki';
import type { PostMeta } from '@/lib/data/types';
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

/** 代码块正则表达式 */
const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;

// ============================================
// Shiki 代码高亮
// ============================================

/**
 * 语言映射表 - 将常见别名映射到 Shiki 支持的语言
 */
const LANGUAGE_MAP: Record<string, string> = {
  'cuda': 'cpp',        // CUDA 使用 C++ 高亮
  'vue': 'html',        // Vue 使用 HTML 高亮
  'shell': 'bash',      // Shell 使用 Bash 高亮
  'zsh': 'bash',        // Zsh 使用 Bash 高亮
  'sh': 'bash',         // Sh 使用 Bash 高亮
  'py': 'python',       // Py 使用 Python 高亮
  'js': 'javascript',   // JS 使用 JavaScript 高亮
  'ts': 'typescript',   // TS 使用 TypeScript 高亮
  'jsx': 'javascript',  // JSX 使用 JavaScript 高亮
  'tsx': 'typescript',  // TSX 使用 TypeScript 高亮
  'yml': 'yaml',        // YML 使用 YAML 高亮
  'md': 'markdown',     // MD 使用 Markdown 高亮
  'rb': 'ruby',         // RB 使用 Ruby 高亮
  'go': 'go',           // Go 保持
  'golang': 'go',       // Golang 映射到 Go
  'rs': 'rust',         // RS 使用 Rust 高亮
};

/**
 * 获取 Shiki 支持的语言标识
 * @param lang 原始语言标识
 * @returns 映射后的语言标识
 */
function getShikiLanguage(lang: string): string {
  const normalizedLang = lang.toLowerCase().trim();
  return LANGUAGE_MAP[normalizedLang] || normalizedLang;
}

/**
 * 使用 Shiki 高亮代码块
 * @param code 代码内容
 * @param language 语言标识
 * @returns 带高亮和复制功能的 HTML
 */
async function highlightCodeBlock(code: string, language?: string): Promise<string> {
  const trimmedCode = code.trim();
  const rawLang = language || 'text';
  const displayLang = language || '';
  const shikiLang = getShikiLanguage(rawLang);

  try {
    // 使用 Shiki 进行语法高亮 - 浅色模式使用 github-light
    const highlightedHtml = await codeToHtml(trimmedCode, {
      lang: shikiLang === 'text' ? 'plaintext' : shikiLang,
      theme: 'github-light',
    });

    // 提取代码内容（用于行号计算）
    const lines = trimmedCode.split('\n');
    const lineCount = lines.length;

    // 生成行号 HTML
    const lineNumbersHtml = Array.from({ length: lineCount }, (_, i) =>
      `<span class="line-number" aria-hidden="true">${i + 1}</span>`
    ).join('\n');

    // 使用 base64 编码存储原始代码 (兼容 Node.js 和浏览器环境)
    const codeDataAttr = Buffer.from(trimmedCode, 'utf-8').toString('base64');

    // 构建完整的代码块 HTML
    return `
      <div class="code-block-wrapper">
        ${displayLang ? `<div class="code-language">${escapeHtml(displayLang)}</div>` : ''}
        <div class="code-block-container">
          <div class="line-numbers" aria-hidden="true">
            ${lineNumbersHtml}
          </div>
          <div class="code-content">
            ${highlightedHtml}
          </div>
        </div>
        <button class="code-copy-btn" data-code="${codeDataAttr}" title="复制代码">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        </button>
      </div>
    `;
  } catch (error) {
    // Shiki 高亮失败时回退到普通代码块
    console.warn(`[markdownService] Shiki 高亮失败 (${rawLang}):`, error);
    const escapedCode = escapeHtml(trimmedCode);
    const codeDataAttr = Buffer.from(trimmedCode, 'utf-8').toString('base64');

    return `
      <div class="code-block-wrapper">
        ${displayLang ? `<div class="code-language">${escapeHtml(displayLang)}</div>` : ''}
        <pre class="code-block"><code>${escapedCode}</code></pre>
        <button class="code-copy-btn" data-code="${codeDataAttr}" title="复制代码">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        </button>
      </div>
    `;
  }
}

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
  const slugSet = new Set(posts.map(post => post.slug));
  const titleToSlug = new Map(posts.map(post => [slugify(post.title), post.slug]));

  return content.replace(WIKI_LINK_REGEX, (match, filename, display) => {
    const linkText = escapeHtml(display?.trim() || filename.trim());
    const targetSlug = slugify(filename.trim().replace(/\.md$/, ''));

    let finalSlug: string | undefined = titleToSlug.get(targetSlug);
    let exists = false;

    if (finalSlug) {
      exists = true;
    } else if (slugSet.has(targetSlug)) {
      finalSlug = targetSlug;
      exists = true;
    }

    if (exists && finalSlug) {
      return `<a href="/posts/${escapeHtml(encodeURIComponent(finalSlug))}" class="wikilink">${linkText}</a>`;
    }

    return `<a href="/posts/${escapeHtml(encodeURIComponent(targetSlug))}" class="wikilink wikilink-missing">${linkText}</a>`;
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
    titleToSlug.set(slugify(post.title), post.slug);
    titleToSlug.set(post.slug, post.slug);
  });

  return content.replace(WIKI_LINK_REGEX, (match, link, display) => {
    const linkText = escapeHtml(display || link);
    const slug = titleToSlug.get(slugify(link)) || titleToSlug.get(slugify(link.replace(/\.md$/, '')));

    if (slug) {
      return `[${linkText}](/posts/${escapeHtml(encodeURIComponent(slug))})`;
    }

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

  // 提取并临时替换代码块 - 使用 HTML 注释标记避免被 Markdown 处理器处理
  const codeBlocks: Array<{ index: number; promise: Promise<string> }> = [];
  let codeBlockIndex = 0;

  processedMarkdown = processedMarkdown.replace(
    CODE_BLOCK_REGEX,
    (match, language, code) => {
      codeBlocks.push({
        index: codeBlockIndex,
        promise: highlightCodeBlock(code, language),
      });
      // 使用 HTML 注释作为占位符，不会被 Markdown 处理器处理为段落
      const placeholder = `<!--CODE_BLOCK_${codeBlockIndex}-->`;
      codeBlockIndex++;
      return placeholder;
    }
  );

  try {
    // 使用 unified 处理 Markdown
    // Pipeline: Markdown AST -> HTML AST -> HTML string
    const result = await unified()
      .use(remarkParse)
      .use(remarkMath)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml })
      .use(rehypeKatex, {
        strict: false,
        throwOnError: false,
        errorColor: '#cc0000',
      })
      .use(rehypeStringify, { allowDangerousHtml })
      .process(processedMarkdown);

    let html = result.toString();

    // 恢复代码块（替换占位符为高亮后的 HTML）
    for (const { index, promise } of codeBlocks) {
      const highlightedCode = await promise;
      const placeholder = `<!--CODE_BLOCK_${index}-->`;
      html = html.replace(placeholder, highlightedCode);
    }

    return html;
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

  // 处理代码块 - 使用简化版本（无高亮）
  html = html.replace(
    CODE_BLOCK_REGEX,
    (match, language, code) => {
      const trimmedCode = code.trim();
      const lang = language ? escapeHtml(language) : '';
      const escapedCode = escapeHtml(trimmedCode);
      const langLabel = lang ? `<div class="code-language">${lang}</div>` : '';
      const codeDataAttr = Buffer.from(trimmedCode, 'utf-8').toString('base64');

      // 计算行号
      const lines = trimmedCode.split('\n');
      const lineCount = lines.length;
      const lineNumbersHtml = Array.from({ length: lineCount }, (_, i) =>
        `<span class="line-number" aria-hidden="true">${i + 1}</span>`
      ).join('\n');

      return `
        <div class="code-block-wrapper">
          ${langLabel}
          <div class="code-block-container">
            <div class="line-numbers" aria-hidden="true">
              ${lineNumbersHtml}
            </div>
            <div class="code-content">
              <pre class="code-block"><code>${escapedCode}</code></pre>
            </div>
          </div>
          <button class="code-copy-btn" data-code="${codeDataAttr}" title="复制代码">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          </button>
        </div>
      `;
    }
  );

  // 处理行内代码
  html = html.replace(
    /`([^`]+)`/g,
    (_, code) => `<code class="inline-code">${escapeHtml(code)}</code>`
  );

  // 处理删除线 (优先处理，避免与其他语法冲突)
  html = html.replace(/~~(.*?)~~/g, (_, text) => `<del>${escapeHtml(text)}</del>`);

  // 处理高亮 (Obsidian 语法 ==text==)
  html = html.replace(/==(.*?)==/g, (_, text) => `<mark class="highlight">${escapeHtml(text)}</mark>`);

  // 处理粗体和斜体 (嵌套处理：先处理内层斜体，再处理外层粗体)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, (_, text) => `<strong><em>${escapeHtml(text)}</em></strong>`);
  html = html.replace(/___(.*?)___/g, (_, text) => `<strong><em>${escapeHtml(text)}</em></strong>`);
  html = html.replace(/\*\*(.*?)\*\*/g, (_, text) => `<strong>${escapeHtml(text)}</strong>`);
  html = html.replace(/__(.*?)__/g, (_, text) => `<strong>${escapeHtml(text)}</strong>`);
  html = html.replace(/\*(.*?)\*/g, (_, text) => `<em>${escapeHtml(text)}</em>`);
  html = html.replace(/_(.*?)_/g, (_, text) => `<em>${escapeHtml(text)}</em>`);

  // 处理标题 (添加 id 属性用于 TOC 跳转，与 TOC 组件的 slug 生成逻辑一致)
  // 使用单个处理函数共享计数器以处理重复 ID
  let headingIndex = 0;
  const headingIdCounts = new Map<string, number>();

  html = html.replace(/^(#{1,6})\s+(.+)$/gim, (_, hashes, text) => {
    const level = hashes.length;
    const trimmedText = text.trim();
    let baseId = slugify(trimmedText);

    if (!baseId) {
      baseId = `heading-${headingIndex}`;
      headingIndex++;
    }

    const count = headingIdCounts.get(baseId) || 0;
    const id = count > 0 ? `${baseId}-${count}` : baseId;
    headingIdCounts.set(baseId, count + 1);

    return `<h${level} id="${escapeHtml(id)}">${escapeHtml(trimmedText)}</h${level}>`;
  });

  // 处理图片（预处理过的路径）
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="markdown-image" loading="lazy" />`
  );

  // 处理链接
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, text, href) => `<a href="${escapeHtml(href)}" class="markdown-link" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
  );

  // 处理引用块 (支持 > text 和 >text 两种格式)
  html = html.replace(
    /^&gt;\s?(.*$)/gim,
    (_, text) => `<blockquote>${escapeHtml(text)}</blockquote>`
  );

  // 处理任务列表
  html = html.replace(
    /^\s*[-*+] \[x\] (.*$)/gim,
    (_, text) => `<li class="task-list-item"><input type="checkbox" checked disabled /> ${escapeHtml(text)}</li>`
  );
  html = html.replace(
    /^\s*[-*+] \[ \] (.*$)/gim,
    (_, text) => `<li class="task-list-item"><input type="checkbox" disabled /> ${escapeHtml(text)}</li>`
  );

  // 处理无序列表
  html = html.replace(
    /^\s*[-*+] (.*$)/gim,
    (_, text) => `<li class="list-item">${escapeHtml(text)}</li>`
  );

  // 处理有序列表
  html = html.replace(
    /^\s*\d+\. (.*$)/gim,
    (_, text) => `<li class="list-item ordered">${escapeHtml(text)}</li>`
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

/**
 * 统一的 Slug 生成函数 (用于 WikiLink 和标题 ID)
 * 规则：
 * - 保留原始大小写
 * - 移除非字母数字、中文、日文、连字符的字符
 * - 空格替换为 -
 * - 多个 - 合并为 1 个
 * - 去除首尾 -
 */
function slugify(text: string): string {
  return text
    .replace(/[^\w\s\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
