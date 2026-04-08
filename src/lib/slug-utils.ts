/**
 * Slug 处理工具函数
 *
 * 提供对中文、标点符号等特殊字符的完整支持
 */

/**
 * 编码 slug 用于 URL
 * 保留中文字符和常见标点，只对必要字符进行编码
 * @param slug 原始 slug
 * @returns URL 安全的 slug
 */
export function encodeSlug(slug: string): string {
  if (!slug) return '';

  // 使用 encodeURIComponent 对整个 slug 进行编码
  // 这样可以确保中文、标点符号都能正确处理
  return encodeURIComponent(slug);
}

/**
 * 解码 URL 中的 slug
 * @param encodedSlug URL 编码的 slug
 * @returns 原始 slug
 */
export function decodeSlug(encodedSlug: string): string {
  if (!encodedSlug) return '';

  try {
    // 先尝试解码，如果已经是解码状态则直接返回
    const decoded = decodeURIComponent(encodedSlug);
    // 防止双重解码导致的问题
    if (decoded === encodedSlug) {
      return encodedSlug;
    }
    return decoded;
  } catch {
    // 解码失败，返回原始值
    return encodedSlug;
  }
}

/**
 * 标准化 slug
 * 用于比较和查找，统一处理大小写和空白字符
 * @param slug 原始 slug
 * @returns 标准化后的 slug
 */
export function normalizeSlug(slug: string): string {
  if (!slug) return '';

  return slug
    .trim()
    .replace(/\s+/g, ' ') // 多个空格转为单个
    .replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''); // 去除 BOM 和特殊空白
}

/**
 * 验证 slug 是否有效
 * @param slug 要验证的 slug
 * @returns 验证结果
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;

  const normalized = normalizeSlug(slug);

  // 不能为空
  if (normalized.length === 0) return false;

  // 不能全是空白字符
  if (/^\s*$/.test(normalized)) return false;

  // 长度限制（避免过长）
  if (normalized.length > 500) return false;

  return true;
}

/**
 * 生成文件系统安全的文件名
 * 如果 slug 包含文件系统不支持的字符，进行转义
 * @param slug 原始 slug
 * @returns 文件系统安全的文件名
 */
export function toFileSystemSafeName(slug: string): string {
  if (!slug) return '';

  // Windows 和 Unix 文件系统保留字符
  // Windows: < > : " / \ | ? *
  // Unix: /
  // 我们将这些字符替换为全角字符或下划线
  return slug
    .replace(/</g, '＜')
    .replace(/>/g, '＞')
    .replace(/:/g, '：')
    .replace(/"/g, '＂')
    .replace(/\//g, '／')
    .replace(/\\/g, '＼')
    .replace(/\|/g, '｜')
    .replace(/\?/g, '？')
    .replace(/\*/g, '＊')
    .replace(/\x00/g, '') // 移除 null 字符
    .trim();
}

/**
 * 从文件系统名称还原 slug
 * @param fileName 文件名
 * @returns 原始 slug
 */
export function fromFileSystemSafeName(fileName: string): string {
  if (!fileName) return '';

  return fileName
    .replace(/＜/g, '<')
    .replace(/＞/g, '>')
    .replace(/：/g, ':')
    .replace(/＂/g, '"')
    .replace(/／/g, '/')
    .replace(/＼/g, '\\')
    .replace(/｜/g, '|')
    .replace(/？/g, '?')
    .replace(/＊/g, '*')
    .trim();
}

/**
 * 创建 slug 映射
 * 用于处理 frontmatter slug 和文件名之间的映射关系
 */
export class SlugMap {
  private map = new Map<string, string>();
  private reverseMap = new Map<string, string>();

  /**
   * 添加映射
   * @param slug frontmatter 中的 slug
   * @param fileName 文件名（不含扩展名）
   */
  add(slug: string, fileName: string): void {
    const normalizedSlug = normalizeSlug(slug);
    const normalizedFileName = normalizeSlug(fileName);

    this.map.set(normalizedSlug, normalizedFileName);
    this.reverseMap.set(normalizedFileName, normalizedSlug);
  }

  /**
   * 根据 slug 查找文件名
   * @param slug 文章 slug
   * @returns 文件名或 undefined
   */
  getFileName(slug: string): string | undefined {
    return this.map.get(normalizeSlug(slug));
  }

  /**
   * 根据文件名查找 slug
   * @param fileName 文件名
   * @returns slug 或 undefined
   */
  getSlug(fileName: string): string | undefined {
    return this.reverseMap.get(normalizeSlug(fileName));
  }

  /**
   * 检查是否存在
   * @param slug 文章 slug
   */
  has(slug: string): boolean {
    return this.map.has(normalizeSlug(slug));
  }

  /**
   * 获取所有 slug
   */
  getAllSlugs(): string[] {
    return Array.from(this.map.keys());
  }

  /**
   * 检查是否有重复
   */
  hasDuplicates(): boolean {
    const seen = new Set<string>();
    for (const slug of this.map.keys()) {
      if (seen.has(slug)) return true;
      seen.add(slug);
    }
    return false;
  }

  /**
   * 获取重复的 slug
   */
  getDuplicates(): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const slug of this.map.keys()) {
      if (seen.has(slug)) {
        duplicates.add(slug);
      }
      seen.add(slug);
    }

    return Array.from(duplicates);
  }
}
