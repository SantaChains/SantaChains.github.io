import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 获取 Web 可用的 banner 路径
export function getWebBannerPath(bannerPath: string): string {
  if (!bannerPath) return '';
  if (bannerPath.startsWith('/')) return bannerPath;
  return `/posts/${bannerPath}`;
}

// 格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 计算阅读时间
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
