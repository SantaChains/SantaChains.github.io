/**
 * 文章列表页客户端组件
 *
 * 优化版本：
 * - 防抖搜索，减少频繁计算
 * - 搜索历史记录
 * - 关键词高亮
 * - 高级匹配算法（标题 > 标签 > 摘要 > 分类）
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Clock,
  Sparkles,
} from 'lucide-react';
import type { PostMeta } from '@/lib/data/types';
import {
  useDebounce,
  useSearchHistory,
  searchPosts,
  type SearchablePost,
} from '@/lib/search-utils';
import { highlightMatch } from '@/lib/search-highlight';

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

function postsToSearchable(posts: PostMeta[]): SearchablePost[] {
  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    category: post.category,
    date: post.date,
  }));
}

// ============================================================
// 子组件
// ============================================================

interface PostListItemProps {
  post: PostMeta;
  searchQuery?: string;
}

function PostListItem({ post, searchQuery }: PostListItemProps) {
  const postUrl = `/posts/${encodeURIComponent(post.fileName || post.slug)}`;
  return (
    <Link href={postUrl}>
      <article className="group p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-transparent hover:border-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(post.date)}
          </span>
          <Badge variant="secondary" className="w-fit">
            {post.category}
          </Badge>
          <h3 className="font-medium text-foreground group-hover:text-accent-red transition-colors flex-1">
            {searchQuery ? highlightMatch(post.title, searchQuery) : post.title}
          </h3>
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {searchQuery ? highlightMatch(tag, searchQuery) : tag}
              </Badge>
            ))}
            {post.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 2}
              </Badge>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {searchQuery ? highlightMatch(post.excerpt, searchQuery) : post.excerpt}
        </p>
      </article>
    </Link>
  );
}

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

function SearchHistoryDropdown({
  history,
  onSelect,
  onClear,
  onRemove,
}: {
  history: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
  onRemove: (query: string) => void;
}) {
  if (history.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          搜索历史
        </span>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          清除全部
        </button>
      </div>
      {history.map((query) => (
        <div
          key={query}
          className="flex items-center justify-between px-3 py-2 hover:bg-accent/50 cursor-pointer group"
          onClick={() => onSelect(query)}
        >
          <span className="text-sm">{query}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(query);
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 主客户端组件
// ============================================================

export function PostsPageClient({ posts }: PostsPageClientProps) {
  // 状态管理
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [showHistory, setShowHistory] = useState(false);

  // 防抖搜索词（300ms 延迟）
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  // 搜索历史
  const { history, addToHistory, clearHistory, removeFromHistory } =
    useSearchHistory();

  const allPosts = posts;

  // 提取分类和标签
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

  // 高级搜索结果
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return [];
    }
    const searchablePosts = postsToSearchable(allPosts);
    return searchPosts(searchablePosts, debouncedSearchQuery, {
      boostTitle: 10,
      boostExcerpt: 5,
      boostTags: 3,
      boostCategory: 1,
    });
  }, [allPosts, debouncedSearchQuery]);

  // 搜索结果 ID 集合（用于快速查找）
  const searchResultIds = useMemo(() => {
    return new Set(searchResults.map((r) => r.post.slug));
  }, [searchResults]);

  // 筛选和排序文章
  const filteredPosts = useMemo(() => {
    let filtered = [...allPosts];

    // 搜索筛选（优先使用高级搜索结果）
    if (debouncedSearchQuery.trim()) {
      if (searchResults.length > 0) {
        // 使用高级搜索结果，按相关性排序
        filtered = allPosts.filter((p) => searchResultIds.has(p.slug));
        // 保持搜索结果顺序
        filtered.sort((a, b) => {
          const aIndex = searchResults.findIndex((r) => r.post.slug === a.slug);
          const bIndex = searchResults.findIndex((r) => r.post.slug === b.slug);
          return aIndex - bIndex;
        });
      } else {
        // 无结果时显示空
        filtered = [];
      }
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
  }, [allPosts, debouncedSearchQuery, searchResults, searchResultIds, selectedCategory, selectedTag, sortMode]);

  // 添加到搜索历史
  useEffect(() => {
    if (debouncedSearchQuery.trim() && searchResults.length > 0) {
      addToHistory(debouncedSearchQuery.trim());
    }
  }, [debouncedSearchQuery, searchResults.length, addToHistory]);

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  const handleHistorySelect = (query: string) => {
    setSearchInput(query);
    setShowHistory(false);
  };

  const groupedPosts = useMemo(() => {
    return groupPostsByYear(filteredPosts);
  }, [filteredPosts]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="mist-layer" />
      <div className="mist-layer" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            文章列表
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            探索思想的边界，记录时光的印记
          </p>
        </header>

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
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowHistory(true);
              }}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              className="pl-10"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchInput('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {showHistory && history.length > 0 && (
              <SearchHistoryDropdown
                history={history}
                onSelect={handleHistorySelect}
                onClear={clearHistory}
                onRemove={removeFromHistory}
              />
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

          {(selectedCategory || selectedTag || searchInput) && (
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
            {debouncedSearchQuery && (
              <span className="ml-2 flex items-center gap-1 inline-flex">
                <Sparkles className="w-3 h-3 text-accent-red" />
                搜索 &quot;{debouncedSearchQuery}&quot; 找到 {searchResults.length} 条结果
              </span>
            )}
            {(selectedCategory || selectedTag) && '（筛选结果）'}
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
                  <PostCard post={post} searchQuery={debouncedSearchQuery} />
                </StaggerItem>
              ))}
            </div>
          </StaggerList>
        )}

        {/* 文章列表 - 列表视图 */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {Array.from(groupedPosts.entries()).map(([year, yearPosts]) => (
              <div key={year}>
                <h2 className="text-lg font-bold text-muted-foreground mb-3 sticky top-16 bg-background/95 backdrop-blur-sm py-2">
                  {year} 年
                </h2>
                <div className="space-y-2">
                  {yearPosts.map((post) => (
                    <PostListItem
                      key={post.slug}
                      post={post}
                      searchQuery={debouncedSearchQuery}
                    />
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
            {(selectedCategory || selectedTag || searchInput) && (
              <Button variant="outline" onClick={clearFilters}>
                清除筛选条件
              </Button>
            )}
          </div>
        )}
      </div>

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
