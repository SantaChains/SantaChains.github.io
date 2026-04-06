// Pretext 组件统一导出

export { PretextContent } from './PretextContent';
export { VirtualizedContent, SmartContent } from './VirtualizedContent';
export { PretextMixedLayout } from './PretextMixedLayout';
export { PretextArticle } from './PretextArticle';
export { MarkdownContent } from './MarkdownContent';
export { PretextPerformanceMonitor } from './PretextPerformanceMonitor';
export { TableOfContents } from './TableOfContents';
export { CodeBlock } from './CodeBlock';
export { PostCard } from './PostCard';
export { ReadingProgress, CircularReadingProgress } from './ReadingProgress';

// 类型统一从 types/pretext 导出
export type {
  // 基础类型
  LayoutInfo,
  PerformanceMetrics,
  LineRenderInfo,
  VisibleRange,
  LineData,
  // Props 类型
  PretextContentProps,
  VirtualizedContentProps,
  SmartContentProps,
  PretextArticleProps,
  PretextMixedLayoutProps,
  PretextPerformanceMonitorProps,
  // 其他类型
  MixedContentItem,
  LayoutBlock,
  ArticleMetrics,
  PerformanceData,
} from '@/types/pretext';
