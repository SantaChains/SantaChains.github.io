/**
 * 文章卡片组件
 *
 * 注意：此组件在客户端运行，不直接访问数据层
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/OptimizedImage';
import type { PostMeta } from '@/lib/data/types';

interface PostCardProps {
  post: PostMeta;
}

function formatCardDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getCardBannerPath(bannerPath: string | undefined): string | undefined {
  if (!bannerPath) return undefined;
  if (bannerPath.startsWith('/')) return bannerPath;
  return `/posts/${bannerPath}`;
}

export function PostCard({ post }: PostCardProps) {
  const webBannerPath = getCardBannerPath(post.banner);

  return (
    <Link href={`/posts/${post.slug}`}>
      <Card className="group cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border-0 bg-card/80 backdrop-blur-sm h-full">
        {webBannerPath && (
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <OptimizedImage
              src={webBannerPath}
              alt={post.title}
              fill
              className="transition-transform duration-500 group-hover:scale-110"
              containerClassName="absolute inset-0"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {post.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatCardDate(post.date)}
            </span>
          </div>
          <CardTitle className="text-lg text-gradient group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default PostCard;
