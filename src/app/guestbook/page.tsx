import { Metadata } from 'next';
import { MessageSquare, Heart, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: '留言板 | Santachains Blog',
  description: '留下你的想法和建议，期待与你的交流',
};

// 示例留言数据（实际项目中可以从数据库或文件读取）
const guestbookEntries = [
  {
    id: 1,
    name: 'SantaChains',
    content: '欢迎来到我的留言板！期待听到你的想法和建议。',
    date: '2024-12-01',
    isAuthor: true,
  },
];

export default function GuestbookPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 简化的雾气层 */}
      <div className="mist-layer" />

      {/* 主内容区域 */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-green)]/10 mb-6">
            <MessageSquare className="w-8 h-8 text-[var(--accent-green)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            留言板
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            留下你的想法和建议，期待与你的交流
          </p>
        </div>

        {/* 留言列表 */}
        <div className="max-w-3xl mx-auto space-y-6">
          {guestbookEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent-green)]/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* 头像占位 */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-green)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-[var(--accent-green)]">
                    {entry.name.charAt(0)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* 头部信息 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {entry.name}
                    </span>
                    {entry.isAuthor && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--accent-red)]/10 text-[var(--accent-red)]">
                        博主
                      </span>
                    )}
                    <span className="text-sm text-[var(--ink-wash)] ml-auto">
                      {entry.date}
                    </span>
                  </div>

                  {/* 留言内容 */}
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {entry.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 留言提示 */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center">
            <Sparkles className="w-6 h-6 text-[var(--accent-purple)] mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              想要留言？
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              目前留言板处于静态展示模式。如需留言交流，欢迎通过以下方式联系：
            </p>
            <div className="flex items-center justify-center gap-2 text-[var(--accent-red)]">
              <Heart className="w-4 h-4" />
              <span>chains0521@163.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[var(--accent-green)]/3 rounded-full blur-xl animate-pulse-slow" />
        <div
          className="absolute top-3/4 right-1/4 w-64 h-64 bg-[var(--accent-purple)]/3 rounded-full blur-xl animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>
    </div>
  );
}
