import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buildPostIndex } from '@/lib/markdown';

export async function generateMetadata() {
  return {
    title: '文章标签 | Santachains Blog',
    description: '通过标签快速找到感兴趣的内容',
  };
}

export default async function TagsPage() {
  const posts = buildPostIndex();

  // 统计每个标签的文章数量
  const tagCount = posts.reduce(
    (acc, post) => {
      post.tags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="mist-layer" />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-gradient">文章标签</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            通过标签快速找到感兴趣的内容
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {tags.map(([tag, count]) => (
            <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="group">
              <Badge
                variant="outline"
                className="px-4 py-2 text-base hover:bg-accent-red/10 hover:border-accent-red/50 transition-all duration-300"
              >
                {tag}
                <span className="ml-2 text-muted-foreground">({count})</span>
              </Badge>
            </Link>
          ))}
        </div>

        {tags.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">暂无标签，请先创建文章</p>
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
