/**
 * 文章详情页
 *
 * 使用新的分层架构：
 * - 数据层：@/lib/data
 * - 业务逻辑层：@/lib/services
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Calendar, Clock, FolderOpen, Tag, RefreshCw } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';
import { TableOfContents } from '@/components/post/TableOfContents';
import { ReadingProgress } from '@/components/post/ReadingProgress';

// 从业务逻辑层导入
import {
  getPostBySlug,
  getAllPostMetas,
  getAdjacentPosts,
  calculateReadingTime,
  formatDate,
  getWebBannerPath,
  markdownToHtml,
  transformWikiLinksToHtml,
} from '@/lib/services';

import type { Post } from '@/lib/data/types';

// ============================================
// 类型定义
// ============================================

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ============================================
// 元数据生成
// ============================================

/**
 * 生成所有静态路径
 * 注意：静态导出时需要返回 URL 编码后的 slug
 * 开发模式下 Next.js 会比较编码后的 URL 路径
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const posts = getAllPostMetas();
  return posts.map((post) => ({
    // 返回 URL 编码后的 slug，与 URL 路径匹配
    slug: encodeURIComponent(post.slug),
  }));
}

/**
 * 生成页面元数据
 */
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: '文章未找到',
      description: '抱歉，您访问的文章不存在。',
    };
  }

  return {
    title: `${post.title} | Santachains Blog`,
    description: post.excerpt,
    keywords: [...post.tags, post.category],
    authors: [{ name: 'Santachains' }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated,
      tags: post.tags,
      images: post.banner ? [`/posts/${post.banner}`] : undefined,
    },
  };
}

// ============================================
// 子组件
// ============================================

/**
 * 文章头部组件
 */
function PostHeader({ post, readingTime }: { post: Post; readingTime: number }) {
  return (
    <header className="mb-8 md:mb-12">
      {/* 分类和日期 */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <Link
          href={`/categories/${encodeURIComponent(post.category)}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent-red transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          {post.category}
        </Link>
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {formatDate(post.date)}
        </span>
        {post.readingTime && (
          <>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {readingTime} 分钟阅读
            </span>
          </>
        )}
        {post.updated && (
          <>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
              更新于 {formatDate(post.updated)}
            </span>
          </>
        )}
      </div>

      {/* 标题 */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient mb-4 md:mb-6 leading-tight">
        {post.title}
      </h1>

      {/* 标签 */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          {post.tags.map((tag) => (
            <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent-red/10 hover:text-accent-red hover:border-accent-red/30 transition-colors"
              >
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

/**
 * 封面图组件
 */
function PostBanner({ banner, title }: { banner?: string; title: string }) {
  if (!banner) return null;

  const webBannerPath = getWebBannerPath(banner);

  return (
    <div className="mb-8 md:mb-12">
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl shadow-2xl overflow-hidden">
        <OptimizedImage
          src={webBannerPath}
          alt={title}
          fill
          priority
          className="rounded-xl"
          containerClassName="absolute inset-0"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

/**
 * 文章导航组件
 */
function PostNavigation({
  prev,
  next,
}: {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-12 md:mt-16 pt-8 border-t border-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 上一篇 */}
        {prev ? (
          <Link
            href={`/posts/${encodeURIComponent(prev.slug)}`}
            className="group flex flex-col p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-transparent hover:border-border"
          >
            <span className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              上一篇
            </span>
            <span className="font-medium text-foreground group-hover:text-accent-red transition-colors line-clamp-2">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {/* 下一篇 */}
        {next ? (
          <Link
            href={`/posts/${encodeURIComponent(next.slug)}`}
            className="group flex flex-col p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-transparent hover:border-border text-right sm:text-left sm:items-end"
          >
            <span className="text-sm text-muted-foreground mb-1 flex items-center gap-1 sm:flex-row-reverse">
              下一篇
              <ArrowRight className="w-4 h-4" />
            </span>
            <span className="font-medium text-foreground group-hover:text-accent-red transition-colors line-clamp-2">
              {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </nav>
  );
}

// ============================================
// 主页面组件
// ============================================

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // 计算阅读时间
  const readingTime = calculateReadingTime(post.content);

  // 获取相邻文章
  const { prev, next } = getAdjacentPosts(slug);

  // 获取所有文章用于 WikiLink 解析
  const allPosts = getAllPostMetas();

  // 转换 Markdown 为 HTML
  const htmlContent = await markdownToHtml(post.content);

  // 转换 WikiLinks 为 HTML 链接
  const processedContent = transformWikiLinksToHtml(htmlContent, allPosts);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 阅读进度条 */}
      <ReadingProgress targetSelector="article" />

      {/* 简化的雾气层 */}
      <div className="mist-layer" />

      {/* 主内容区域 */}
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8">
        {/* 返回按钮 */}
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent-red transition-colors mb-6 md:mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文章列表
        </Link>

        {/* 文章容器 */}
        <div className="max-w-4xl mx-auto">
          {/* 文章头部 */}
          <PostHeader post={post} readingTime={readingTime} />

          {/* 封面图 */}
          <PostBanner banner={post.banner} title={post.title} />

          {/* 文章主体 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 lg:gap-12">
            {/* 左侧：文章内容 */}
            <article className="min-w-0">
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* 文章导航 */}
              <PostNavigation prev={prev} next={next} />

              {/* 文章底部 */}
              <footer className="mt-12 pt-8 border-t border-border">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-muted-foreground text-sm text-center sm:text-left">
                    感谢阅读！如果觉得有帮助，欢迎分享。
                  </p>
                  <Link
                    href="/posts"
                    className="inline-flex items-center gap-2 text-accent-red hover:text-accent-red/80 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    查看更多文章
                  </Link>
                </div>
              </footer>
            </article>

            {/* 右侧：目录导航 (桌面端显示) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents content={post.content} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* 背景元素 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-red/3 rounded-full blur-xl animate-pulse-slow"
        />
        <div
          className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent-green/3 rounded-full blur-xl animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>
    </div>
  );
}
