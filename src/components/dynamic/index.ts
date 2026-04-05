// 动态加载组件统一导出
// 这些组件包装了 next/dynamic 导入，允许在 Server Components 中使用 ssr: false

export { DynamicHomeEffects } from './DynamicHomeEffects';
export { 
  DynamicHoverCard, 
  DynamicHoverCardTrigger, 
  DynamicHoverCardContent 
} from './DynamicHoverCard';
export { 
  DynamicMagneticCard, 
  DynamicTypewriterText, 
  DynamicAnimatedBackground 
} from './DynamicAnimations';
