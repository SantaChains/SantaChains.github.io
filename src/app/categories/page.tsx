import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buildPostIndex } from '@/lib/markdown';

export async function generateMetadata() {
  return {
    title: '文章分类 | Santachains Blog',
    description: '按主题浏览文章，探索不同领域的内容',
  };
}

export default async function CategoriesPage() {
  const posts = buildPostIndex();

  // 统计每个分类的文章数量
  const categoryCount = posts.reduce(
    (acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const categories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="mist-layer" />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-gradient">文章分类</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            按主题浏览文章，探索不同领域的内容
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {categories.map(([category, count]) => (
            <Link key={category} href={`/categories/${encodeURIComponent(category)}`} className="group block">
              <div className="p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-border hover:border-accent-red/50 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold group-hover:text-accent-red transition-colors">
                    {category}
                  </h2>
                  <Badge variant="secondary">{count} 篇</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">暂无分类，请先创建文章</p>
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
