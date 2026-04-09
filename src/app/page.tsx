import { Suspense } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DynamicHomeEffects,
  DynamicHoverCard,
  DynamicHoverCardTrigger,
  DynamicHoverCardContent,
  DynamicMagneticCard,
  DynamicTypewriterText,
  DynamicAnimatedBackground,
} from '@/components/dynamic';

// ============================================
// Loading 占位符组件
// ============================================

function QuoteCardSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-[var(--card)]/60 backdrop-blur-sm border border-[var(--border)]/50 h-full">
      <div className="h-4 bg-[var(--border)]/50 rounded animate-pulse mb-3 w-3/4" />
      <div className="h-4 bg-[var(--border)]/30 rounded animate-pulse mb-2 w-full" />
      <div className="h-4 bg-[var(--border)]/30 rounded animate-pulse w-2/3" />
      <div className="mt-4 flex justify-end">
        <div className="h-3 bg-[var(--border)]/40 rounded animate-pulse w-24" />
      </div>
    </div>
  );
}

// ============================================
// 数据
// ============================================

const quotes = [
  {
    text: "在川端康成的雪国里，每一粒雪晶都是未完成的诗篇",
    source: "作者：SantaChains",
    detail: "灵感来源于川端康成《雪国》的虚无之美，以及三岛由纪夫《金阁寺》中对极致美的毁灭性追求。"
  },
  {
    text: "代码是理性的诗，诗是感性的代码",
    source: "编程哲学",
    detail: "技术与艺术的边界，在川端康成的'物哀'美学中找到共鸣。"
  },
  {
    text: "未完成的完美，比完成更接近永恒",
    source: "美学笔记",
    detail: "如同金阁寺在火焰中达到的永恒之美，未完成的状态保留了无限的可能性。"
  },
  {
    text: "在0与1之间，存在着无限的灰度",
    source: "数字禅意",
    detail: "数字世界的二元对立中，蕴含着东方哲学的中庸之道。"
  },
  {
    text: "每一行代码都是通往虚无的桥",
    source: "开发者日记",
    detail: "编程的过程本身就是一种修行，在创造与毁灭的循环中寻找意义。"
  },
  {
    text: "雪落在键盘上，敲出春天的密码",
    source: "季节随笔",
    detail: "自然与技术的交融，在冬日的静谧中孕育着创新的萌芽。"
  }
];

// ============================================
// 主页面组件 (Server Component)
// ============================================

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--bg-primary)]">
      {/* 主页专属视觉效果 - 懒加载 */}
      <DynamicHomeEffects />

      {/* 背景光晕效果 - 懒加载 */}
      <DynamicAnimatedBackground />

      {/* 主内容区域 */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* 头部区域 */}
        <section className="text-center mb-16">
          {/* 头像 - 静态内容，立即渲染 */}
          <div className="inline-block transition-transform duration-300 hover:scale-108 active:scale-95">
            <Avatar className="w-32 h-32 mx-auto mb-6 ring-4 ring-[var(--accent-red)]/20 ring-offset-4 ring-offset-[var(--bg-primary)] shadow-2xl">
              <AvatarImage src="/avatar.png" alt="SantaChains" />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-[var(--accent-red)]/20 to-[var(--paper-warm)] font-bold text-[var(--text-primary)]">
                聖
              </AvatarFallback>
            </Avatar>
          </div>

          {/* 标题 - 静态内容 */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gradient relative"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            <span className="relative">
              SantaChains
              <span className="absolute -inset-2 bg-[var(--accent-red)]/10 blur-xl rounded-full -z-10" />
            </span>
          </h1>

          {/* 副标题 - 打字机效果（懒加载） */}
          <div className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            <DynamicTypewriterText text="在代码与文学的交界处，寻找技术与美学的共鸣。" delay={800} />
            <p className="mt-4 text-base text-[var(--ink-wash)]">
              这里记录着对川端康成式虚无美学的思考，以及对编程艺术的探索。
            </p>
          </div>
        </section>

        {/* 装饰分隔线 - 静态 */}
        <div className="my-12 flex items-center justify-center gap-4">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent flex-1 max-w-[200px]" />
          <div className="w-2 h-2 rounded-full bg-[var(--accent-red)]/30" />
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent flex-1 max-w-[200px]" />
        </div>

        {/* 语录卡片区域 - 3D 磁吸效果 */}
        <section className="max-w-4xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-semibold text-center mb-8 text-gradient"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            灵感碎片
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
            {quotes.map((quote, index) => (
              <Suspense key={index} fallback={<QuoteCardSkeleton />}>
                <DynamicHoverCard openDelay={200} closeDelay={100}>
                  <DynamicHoverCardTrigger asChild>
                    <DynamicMagneticCard>
                      <div className="p-6 rounded-xl bg-[var(--card)]/60 backdrop-blur-sm border border-[var(--border)]/50 cursor-pointer h-full relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]">
                        {/* 悬停时的背景光效 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-red)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* 引号装饰 */}
                        <span className="absolute top-2 left-4 text-6xl text-[var(--accent-red)]/10 font-serif select-none">
                          &ldquo;
                        </span>

                        <p className="text-[var(--text-primary)]/90 leading-relaxed mb-3 font-medium relative z-10">
                          {quote.text}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] text-right relative z-10">
                          —— {quote.source}
                        </p>

                        {/* 底部装饰线 */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-red)]/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      </div>
                    </DynamicMagneticCard>
                  </DynamicHoverCardTrigger>
                  <DynamicHoverCardContent
                    className="w-80 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)]/50 shadow-2xl"
                    side="top"
                    align="center"
                  >
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {quote.detail}
                    </p>
                  </DynamicHoverCardContent>
                </DynamicHoverCard>
              </Suspense>
            ))}
          </div>
        </section>

        {/* 底部装饰 - 静态 */}
        <div className="mt-20 text-center">
          <p className="text-sm text-[var(--ink-wash)] flex items-center justify-center gap-2">
            <span>✦</span>
            点击页面任意位置，感受水波的涟漪
            <span>✦</span>
          </p>
        </div>
      </div>
    </div>
  );
}
