import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PostCard } from '@/components/post/PostCard';
import { Badge } from '@/components/ui/badge';
import { getAllPostMetas, getAllTags } from '@/lib/services';
import type { Post } from '@/lib/data/types';

interface TagPageProps {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();

  return tags.map((tag) => ({
    name: encodeURIComponent(tag),
  }));
}

export async function generateMetadata({ params }: TagPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return {
    title: `${decodedName} | 标签 | Santachains Blog`,
    description: `浏览标签 "${decodedName}" 下的所有文章`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const posts = getAllPostMetas();
  const tagPosts = posts.filter((post) => post.tags.includes(decodedName));

  if (tagPosts.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="mist-layer" />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-lg px-4 py-1">
            标签
          </Badge>
          <h1 className="text-5xl font-bold mb-4 text-gradient">
            {decodedName}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            该标签下共有 {tagPosts.length} 篇文章
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tagPosts.map((post) => (
            <PostCard key={post.slug} post={post as Post} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/tags"
            className="inline-flex items-center text-muted-foreground hover:text-accent-red transition-colors"
          >
            ← 返回标签列表
          </Link>
        </div>
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
