'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// HomeEffects - 水波纹和樱花效果（完全客户端组件）
const HomeEffectsClient = dynamic(
  () => import('@/components/effects/HomeEffects').then(mod => ({ default: mod.HomeEffects })),
  { ssr: false }
);

/**
 * 动态加载的 HomeEffects 组件
 * 在 Client Component 中使用 ssr: false 选项
 */
export function DynamicHomeEffects() {
  return (
    <Suspense fallback={null}>
      <HomeEffectsClient />
    </Suspense>
  );
}

export default DynamicHomeEffects;
