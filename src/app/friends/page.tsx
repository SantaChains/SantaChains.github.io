import { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: '友链 | Santachains Blog',
  description: '志同道合的朋友们',
};

// 友链数据
const friends = [
  {
    name: '示例站点',
    url: 'https://example.com',
    description: '一个示例站点',
    avatar: '/avatar.png',
  },
];

export default function FriendsPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 简化的雾气层 */}
      <div className="mist-layer" />

      {/* 主内容区域 */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-purple)]/10 mb-6">
            <Users className="w-8 h-8 text-[var(--accent-purple)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            友链
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            志同道合的朋友们，欢迎交换链接
          </p>
        </div>

        {/* 友链列表 */}
        {friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {friends.map((friend) => (
              <a
                key={friend.url}
                href={friend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]
                  hover:border-[var(--accent-purple)]/50 hover:shadow-lg hover:shadow-[var(--accent-purple)]/5
                  transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent-purple)]/10 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-5 h-5 text-[var(--accent-purple)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-purple)] transition-colors truncate">
                      {friend.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {friend.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)]">
              暂无友链，欢迎联系交换
            </p>
          </div>
        )}

        {/* 交换链接说明 */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              交换链接
            </h2>
            <div className="space-y-3 text-[var(--text-secondary)]">
              <p>如果您想交换友情链接，请通过以下方式联系：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>站点名称：SantaChains Blog</li>
                <li>站点地址：https://santachains.github.io</li>
                <li>站点描述：在川端康成的雪国里，每一粒雪晶都是未完成的诗篇</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
