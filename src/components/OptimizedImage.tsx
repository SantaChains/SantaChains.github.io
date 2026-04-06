'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  /** 图片源地址 */
  src: string;
  /** 图片替代文本 */
  alt: string;
  /** 图片宽度 */
  width?: number;
  /** 图片高度 */
  height?: number;
  /** 填充模式 */
  fill?: boolean;
  /** 样式类名 */
  className?: string;
  /** 容器样式类名 */
  containerClassName?: string;
  /** 是否为优先加载图片（首屏重要图片） */
  priority?: boolean;
  /** 图片加载完成回调 */
  onLoad?: () => void;
  /** 图片加载错误回调 */
  onError?: () => void;
  /** 图片对象适配方式 */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** 图片对象位置 */
  objectPosition?: string;
  /** 自定义 sizes 属性 */
  sizes?: string;
  /** 是否禁用淡入动画 */
  disableAnimation?: boolean;
}

/**
 * 优化的图片组件
 * 封装 Next.js Image 组件，提供默认优化配置
 *
 * 功能特性：
 * - 默认启用懒加载 (loading="lazy")
 * - 默认使用模糊占位符 (placeholder="blur")
 * - 响应式 sizes 配置
 * - 淡入动画效果
 * - 首屏图片优先加载支持
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  containerClassName,
  priority = false,
  onLoad,
  onError,
  objectFit = 'cover',
  objectPosition = 'center',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  disableAnimation = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  // 本地图片使用 empty placeholder（静态导出不支持 blurDataURL 生成）
  // 外部图片也使用 empty placeholder（避免跨域问题）
  const placeholder = 'empty';

  // 对于填充模式，需要包装容器
  if (fill) {
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          containerClassName
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          placeholder={placeholder}
          sizes={sizes}
          className={cn(
            'transition-opacity duration-500',
            !disableAnimation && !isLoaded && 'opacity-0',
            !disableAnimation && isLoaded && 'opacity-100',
            className
          )}
          style={{
            objectFit,
            objectPosition,
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  // 固定尺寸模式
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
      style={{ width, height }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        placeholder={placeholder}
        sizes={sizes}
        className={cn(
          'transition-opacity duration-500',
          !disableAnimation && !isLoaded && 'opacity-0',
          !disableAnimation && isLoaded && 'opacity-100',
          className
        )}
        style={{
          objectFit,
          objectPosition,
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

export default OptimizedImage;
