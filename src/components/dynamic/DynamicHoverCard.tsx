'use client';

import dynamic from 'next/dynamic';
import { Suspense, type ReactNode } from 'react';

// HoverCard 组件（Radix UI 客户端组件）
const HoverCardClient = dynamic(
  () => import('@/components/ui/hover-card').then(mod => ({ default: mod.HoverCard })),
  { ssr: false }
);
const HoverCardTriggerClient = dynamic(
  () => import('@/components/ui/hover-card').then(mod => ({ default: mod.HoverCardTrigger })),
  { ssr: false }
);
const HoverCardContentClient = dynamic(
  () => import('@/components/ui/hover-card').then(mod => ({ default: mod.HoverCardContent })),
  { ssr: false }
);

interface DynamicHoverCardProps {
  children: ReactNode;
  openDelay?: number;
  closeDelay?: number;
}

interface DynamicHoverCardTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface DynamicHoverCardContentProps {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

function HoverCardSkeleton() {
  return <div className="animate-pulse" />;
}

/**
 * 动态加载的 HoverCard 组件
 */
export function DynamicHoverCard({ children, openDelay = 200, closeDelay = 100 }: DynamicHoverCardProps) {
  return (
    <Suspense fallback={<HoverCardSkeleton />}>
      <HoverCardClient openDelay={openDelay} closeDelay={closeDelay}>
        {children}
      </HoverCardClient>
    </Suspense>
  );
}

/**
 * 动态加载的 HoverCardTrigger 组件
 */
export function DynamicHoverCardTrigger({ children, asChild }: DynamicHoverCardTriggerProps) {
  return (
    <Suspense fallback={null}>
      <HoverCardTriggerClient asChild={asChild}>
        {children}
      </HoverCardTriggerClient>
    </Suspense>
  );
}

/**
 * 动态加载的 HoverCardContent 组件
 */
export function DynamicHoverCardContent({ 
  children, 
  className, 
  side = 'top', 
  align = 'center' 
}: DynamicHoverCardContentProps) {
  return (
    <Suspense fallback={null}>
      <HoverCardContentClient className={className} side={side} align={align}>
        {children}
      </HoverCardContentClient>
    </Suspense>
  );
}
