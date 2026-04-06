/**
 * Pretext 组件统一类型定义
 * 
 * 所有 Pretext 相关组件共享的类型定义
 */

import type { LayoutLine } from '@chenglou/pretext';

// ============================================
// 基础类型
// ============================================

/**
 * 布局信息
 */
export interface LayoutInfo {
  lineCount: number;
  totalHeight: number;
  lines: LayoutLine[];
  renderTime: number;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  prepareTime: number;
  layoutTime: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
}

/**
 * 行渲染信息
 */
export interface LineRenderInfo {
  text: string;
  width: number;
  isFirstLine: boolean;
}

/**
 * 可见范围
 */
export interface VisibleRange {
  start: number;
  end: number;
}

/**
 * 行数据
 */
export interface LineData {
  text: string;
  width: number;
  index: number;
}

// ============================================
// 组件 Props
// ============================================

/**
 * PretextContent 组件 Props
 */
export interface PretextContentProps {
  content: string;
  className?: string;
  fontSize?: number;
  lineHeight?: number;
  enableOptimization?: boolean;
  onLayoutComplete?: (info: LayoutInfo) => void;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

/**
 * VirtualizedContent 组件 Props
 */
export interface VirtualizedContentProps {
  content: string;
  className?: string;
  fontSize?: number;
  lineHeight?: number;
  overscan?: number;
  containerHeight?: number;
  onVisibleRangeChange?: (range: VisibleRange) => void;
  enableSmoothScroll?: boolean;
}

/**
 * SmartContent 组件 Props
 */
export interface SmartContentProps extends Omit<VirtualizedContentProps, 'containerHeight'> {
  virtualizationThreshold?: number;
  onLayoutComplete?: (info: LayoutInfo) => void;
}

/**
 * PretextArticle 组件 Props
 */
export interface PretextArticleProps {
  content: string;
  className?: string;
  enableMixedLayout?: boolean;
  enablePerformanceMonitor?: boolean;
  virtualizationThreshold?: number;
}

/**
 * PretextMixedLayout 组件 Props
 */
export interface PretextMixedLayoutProps {
  items: MixedContentItem[];
  className?: string;
  fontSize?: number;
  lineHeight?: number;
  containerMaxWidth?: number;
}

/**
 * PretextPerformanceMonitor 组件 Props
 */
export interface PretextPerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// ============================================
// 其他类型
// ============================================

/**
 * 混合内容项（图文混排）
 */
export interface MixedContentItem {
  type: 'text' | 'image';
  content?: string;
  src?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  float?: 'left' | 'right' | 'none';
}

/**
 * 布局块
 */
export interface LayoutBlock {
  type: 'text' | 'image';
  lines?: LayoutLine[];
  image?: MixedContentItem;
  y: number;
  height: number;
  width: number;
  x: number;
}

/**
 * 文章指标
 */
export interface ArticleMetrics {
  layoutTime: number;
  lineCount: number;
  renderMode: 'plain' | 'virtualized' | 'mixed';
}

/**
 * 性能数据
 */
export interface PerformanceData {
  prepareTime: number;
  layoutTime: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  contentCount: number;
  totalLayouts: number;
}

// ============================================
// 常量
// ============================================

/**
 * 默认字体配置
 * 字体顺序：Arima-Regular > LXGWWenKaiMono > WenQuanWeiMiHei > CangErJinKai03
 */
export const DEFAULT_FONT_CONFIG = {
  family: '"Arima-Regular", "LXGWWenKaiMono", "WenQuanWeiMiHei", "CangErJinKai03", system-ui, sans-serif',
  weight: 400,
  style: 'normal',
  size: 17,
  lineHeight: 28,
} as const;

/**
 * 虚拟滚动默认配置
 */
export const DEFAULT_VIRTUALIZATION_CONFIG = {
  overscan: 3,
  containerHeight: 600,
  threshold: 50,
} as const;
