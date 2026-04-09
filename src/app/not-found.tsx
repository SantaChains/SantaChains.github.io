import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div className="mist-layer" />
      <div className="mist-layer" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 text-center px-4">
        <div className="mb-8">
          <span className="text-[150px] md:text-[200px] font-bold text-gradient opacity-50">
            404
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          页面未找到
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
          抱歉，您访问的页面似乎在昭和年代的雪国里融化了。
          <br />
          让我们带您回到安全的地方。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              返回首页
            </Button>
          </Link>
          <Link href="/posts">
            <Button
              size="lg"
              variant="outline"
            >
              浏览文章
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>或者您可以：</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link
              href="/categories"
              className="text-primary hover:underline"
            >
              浏览分类
            </Link>
            <Link
              href="/tags"
              className="text-primary hover:underline"
            >
              浏览标签
            </Link>
            <Link
              href="/friends"
              className="text-primary hover:underline"
            >
              友链
            </Link>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-xl animate-pulse-slow" />
        <div
          className="absolute top-3/4 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-xl animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>
    </div>
  );
}
