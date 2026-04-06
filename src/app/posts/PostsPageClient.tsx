/**
 * 文章列表页客户端组件
 *
 * 使用新的分层架构：
 * - 数据层：@/lib/data
 * - 业务逻辑层：@/lib/services
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PostCard } from '@/components/post/PostCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StaggerList, StaggerItem } from '@/components/animation';
import {
  Search,
  FolderOpen,
  Tag,
  Grid3X3,
  List,
  X,
} from 'lucide-react';
import type { PostMeta } from '@/lib/data/types';

// ============================================================
// 类型定义
// ============================================================

type ViewMode = 'grid' | 'list';
type SortMode = 'date' | 'title';

interface PostsPageClientProps {
  posts: PostMeta[];
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 获取年份分组的文章
 */
function groupPostsByYear(posts: PostMeta[]): Map<string, PostMeta[]> {
  const grouped = new Map<string, PostMeta[]>();

  posts.forEach((post) => {
    const year = new Date(post.date).getFullYear().toString();
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year)!.push(post);
  });

  return grouped;
}

// ============================================================
// 子组件
// ============================================================

/**
 * 列表视图文章项
 */
function PostListItem({ post }: { post: PostMeta }) {
  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="group p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-transparent hover:border-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* 日期 */}
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(post.date)}
          </span>

          {/* 分类 */}
          <Badge variant="secondary" className="w-fit">
            {post.category}
          </Badge>

          {/* 标题 */}
          <h3 className="font-medium text-foreground group-hover:text-accent-red transition-colors flex-1">
            {post.title}
          </h3>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* 摘要 */}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {post.excerpt}
        </p>
      </article>
    </Link>
  );
}

/**
 * 统计信息组件
 */
function StatsSection({
  totalPosts,
  categories,
  tags,
}: {
  totalPosts: number;
  categories: string[];
  tags: string[];
}) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="text-center p-4 rounded-lg bg-card/50">
        <div className="text-2xl font-bold text-accent-red">{totalPosts}</div>
        <div className="text-sm text-muted-foreground">文章</div>
      </div>
      <div className="text-center p-4 rounded-lg bg-card/50">
        <div className="text-2xl font-bold text-accent-green">
          {categories.length}
        </div>
        <div className="text-sm text-muted-foreground">分类</div>
      </div>
      <div className="text-center p-4 rounded-lg bg-card/50">
        <div className="text-2xl font-bold text-accent-purple">{tags.length}</div>
        <div className="text-sm text-muted-foreground">标签</div>
      </div>
    </div>
  );
}

// ============================================================
// 主客户端组件
// ============================================================

export function PostsPageClient({ posts }: PostsPageClientProps) {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('date');

  // 使用传入的文章数据
  const allPosts = posts;

  // 提取所有分类和标签
  const { categories, tags } = useMemo(() => {
    const categorySet = new Set<string>();
    const tagSet = new Set<string>();

    allPosts.forEach((post) => {
      categorySet.add(post.category);
      post.tags.forEach((tag) => tagSet.add(tag));
    });

    return {
      categories: Array.from(categorySet).sort(),
      tags: Array.from(tagSet).sort(),
    };
  }, [allPosts]);

  // 筛选和排序文章
  const filteredPosts = useMemo(() => {
    let filtered = [...allPosts];

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 分类筛选
    if (selectedCategory) {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // 标签筛选
    if (selectedTag) {
      filtered = filtered.filter((post) => post.tags.includes(selectedTag));
    }

    // 排序
    if (sortMode === 'date') {
      filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
    }

    return filtered;
  }, [allPosts, searchQuery, selectedCategory, selectedTag, sortMode]);

  // 清除所有筛选
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  // 按年份分组（仅列表视图）
  const groupedPosts = useMemo(() => {
    return groupPostsByYear(filteredPosts);
  }, [filteredPosts]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 简化的雾气层 */}
      <div className="mist-layer" />
      <div className="mist-layer" style={{ animationDelay: '3s' }} />

      {/* 主内容区域 */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* 页面标题 */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            文章列表
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            探索思想的边界，记录时光的印记
          </p>
        </header>

        {/* 统计信息 */}
        <StatsSection
          totalPosts={allPosts.length}
          categories={categories}
          tags={tags}
        />

        {/* 搜索和视图控制 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索文章标题、内容或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 视图切换 */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              title="网格视图"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="mb-8">
          {/* 分类筛选 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              分类
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category ? null : category
                    )
                  }
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* 标签筛选 */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 清除筛选 */}
          {(selectedCategory || selectedTag || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="mt-4"
            >
              <X className="w-4 h-4 mr-1" />
              清除筛选
            </Button>
          )}
        </div>

        {/* 结果统计 */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            共 {filteredPosts.length} 篇文章
            {(selectedCategory || selectedTag || searchQuery) && '（筛选结果）'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">排序：</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSortMode(sortMode === 'date' ? 'title' : 'date')
              }
            >
              {sortMode === 'date' ? '最新发布' : '标题排序'}
            </Button>
          </div>
        </div>

        {/* 文章列表 - 网格视图 */}
        {viewMode === 'grid' && (
          <StaggerList>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <StaggerItem key={post.slug}>
                  <PostCard post={post} />
                </StaggerItem>
              ))}
            </div>
          </StaggerList>
        )}

        {/* 文章列表 - 列表视图 */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {Array.from(groupedPosts.entries()).map(([year, posts]) => (
              <div key={year}>
                <h2 className="text-lg font-bold text-muted-foreground mb-3 sticky top-16 bg-background/95 backdrop-blur-sm py-2">
                  {year} 年
                </h2>
                <div className="space-y-2">
                  {posts.map((post) => (
                    <PostListItem key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium mb-2">
              {allPosts.length === 0 ? '暂无文章' : '未找到匹配的文章'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {allPosts.length === 0
                ? '敬请期待更多精彩内容...'
                : '尝试调整搜索条件或筛选器'}
            </p>
            {(selectedCategory || selectedTag || searchQuery) && (
              <Button variant="outline" onClick={clearFilters}>
                清除筛选条件
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 背景元素 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-red/3 rounded-full blur-xl animate-pulse-slow" />
        <div
          className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent-green/3 rounded-full blur-xl animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>
    </div>
  );
}
