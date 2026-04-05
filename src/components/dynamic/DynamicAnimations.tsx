'use client';

import dynamic from 'next/dynamic';
import { Suspense, type ReactNode } from 'react';

// 动画组件（Framer Motion）
const MagneticCardClient = dynamic(
  () => import('@/components/animations/MagneticCard').then(mod => ({ default: mod.MagneticCard })),
  { ssr: false }
);

const TypewriterTextClient = dynamic(
  () => import('@/components/animations/TypewriterText').then(mod => ({ default: mod.TypewriterText })),
  { ssr: false }
);

const AnimatedBackgroundClient = dynamic(
  () => import('@/components/animations/AnimatedBackground').then(mod => ({ default: mod.AnimatedBackground })),
  { ssr: false }
);

// ============================================
// Loading 占位符
// ============================================

function TypewriterSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-5 bg-[var(--border)]/50 rounded animate-pulse w-full max-w-xl" />
      <div className="h-4 bg-[var(--border)]/30 rounded animate-pulse w-3/4 max-w-lg" />
    </div>
  );
}

// ============================================
// 动态组件导出
// ============================================

interface MagneticCardProps {
  children: ReactNode;
  className?: string;
}

interface TypewriterTextProps {
  text: string;
  delay?: number;
}

/**
 * 动态加载的 MagneticCard 组件
 */
export function DynamicMagneticCard({ children, className }: MagneticCardProps) {
  return (
    <Suspense fallback={<div className={className}>{children}</div>}>
      <MagneticCardClient className={className}>
        {children}
      </MagneticCardClient>
    </Suspense>
  );
}

/**
 * 动态加载的 TypewriterText 组件
 */
export function DynamicTypewriterText({ text, delay = 0 }: TypewriterTextProps) {
  return (
    <Suspense fallback={<TypewriterSkeleton />}>
      <TypewriterTextClient text={text} delay={delay} />
    </Suspense>
  );
}

/**
 * 动态加载的 AnimatedBackground 组件
 */
export function DynamicAnimatedBackground() {
  return (
    <Suspense fallback={null}>
      <AnimatedBackgroundClient />
    </Suspense>
  );
}
