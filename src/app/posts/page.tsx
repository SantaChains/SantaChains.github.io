/**
 * 文章列表页
 *
 * 使用新的分层架构：
 * - 数据层：@/lib/data
 * - 业务逻辑层：@/lib/services
 */

import { PostsPageClient } from './PostsPageClient';
import { getAllPostMetas } from '@/lib/services';
import type { PostMeta } from '@/lib/data/types';

export const metadata = {
  title: '文章列表 | Santachains Blog',
  description: '探索思想的边界，记录时光的印记',
};

export default async function PostsPage() {
  // 服务端获取所有文章
  const posts = getAllPostMetas();

  return <PostsPageClient posts={posts as PostMeta[]} />;
}
