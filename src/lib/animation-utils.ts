/**
 * 高性能动画工具库
 * 
 * 提供流畅、无卡顿的动画效果
 * 
 * 性能优化策略:
 * 1. 使用 transform 和 opacity 进行动画（GPU 加速）
 * 2. 使用 will-change 提示浏览器优化
 * 3. 使用 requestAnimationFrame 进行精确时序控制
 * 4. 使用 IntersectionObserver 实现视口内动画
 * 5. 支持 prefers-reduced-motion 无障碍访问
 */

// ============================================
// 缓动函数
// ============================================

export const easing = {
  // 线性
  linear: (t: number) => t,
  
  // 缓入
  easeIn: (t: number) => t * t,
  easeInQuad: (t: number) => t * t,
  easeInCubic: (t: number) => t * t * t,
  
  // 缓出
  easeOut: (t: number) => 1 - Math.pow(1 - t, 2),
  easeOutQuad: (t: number) => 1 - Math.pow(1 - t, 2),
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  
  // 缓入缓出
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  
  // 弹性
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  
  // 弹簧
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ============================================
// 动画类
// ============================================

interface AnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

export class Animation {
  private startTime: number | null = null;
  private rafId: number | null = null;
  private options: Required<AnimationOptions>;

  constructor(options: AnimationOptions = {}) {
    this.options = {
      duration: 300,
      easing: easing.easeOutQuad,
      onUpdate: () => {},
      onComplete: () => {},
      ...options,
    };
  }

  start() {
    this.startTime = performance.now();
    this.loop();
  }

  private loop = () => {
    if (!this.startTime) return;
    
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(elapsed / this.options.duration, 1);
    const easedProgress = this.options.easing(progress);
    
    this.options.onUpdate(easedProgress);
    
    if (progress < 1) {
      this.rafId = requestAnimationFrame(this.loop);
    } else {
      this.options.onComplete();
    }
  };

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// ============================================
// 滚动触发动画
// ============================================

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation(
  element: Element,
  callback: (isIntersecting: boolean) => void,
  options: ScrollAnimationOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = false } = options;
  
  const observer = new IntersectionObserver(
    ([entry]) => {
      callback(entry.isIntersecting);
      if (triggerOnce && entry.isIntersecting) {
        observer.unobserve(element);
      }
    },
    { threshold, rootMargin }
  );
  
  observer.observe(element);
  
  return () => observer.disconnect();
}

// ============================================
// 视差效果
// ============================================

export function createParallax(
  element: HTMLElement,
  speed: number = 0.5
) {
  let rafId: number | null = null;
  let lastScrollY = window.scrollY;
  
  const update = () => {
    const scrollY = window.scrollY;
    if (scrollY !== lastScrollY) {
      const rect = element.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const windowCenterY = window.innerHeight / 2;
      const distance = centerY - windowCenterY;
      
      element.style.transform = `translateY(${distance * speed}px)`;
      lastScrollY = scrollY;
    }
    rafId = requestAnimationFrame(update);
  };
  
  rafId = requestAnimationFrame(update);
  
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
}

// ============================================
// 鼠标跟随效果
// ============================================

export function createMouseFollow(
  element: HTMLElement,
  options: {
    smoothing?: number;
    maxDistance?: number;
  } = {}
) {
  const { smoothing = 0.1, maxDistance = 100 } = options;
  
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId: number | null = null;
  
  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < maxDistance) {
      targetX = deltaX * smoothing;
      targetY = deltaY * smoothing;
    } else {
      targetX = 0;
      targetY = 0;
    }
  };
  
  const animate = () => {
    currentX += (targetX - currentX) * smoothing;
    currentY += (targetY - currentY) * smoothing;
    
    element.style.transform = `translate(${currentX}px, ${currentY}px)`;
    
    rafId = requestAnimationFrame(animate);
  };
  
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  rafId = requestAnimationFrame(animate);
  
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (rafId) cancelAnimationFrame(rafId);
  };
}

// ============================================
// 呼吸效果
// ============================================

export function createBreathingAnimation(
  element: HTMLElement,
  options: {
    minScale?: number;
    maxScale?: number;
    duration?: number;
  } = {}
) {
  const { minScale = 0.98, maxScale = 1.02, duration = 4000 } = options;
  
  let startTime: number | null = null;
  let rafId: number | null = null;
  
  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = (elapsed % duration) / duration;
    
    // 正弦波呼吸
    const scale = minScale + (maxScale - minScale) * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2));
    element.style.transform = `scale(${scale})`;
    
    rafId = requestAnimationFrame(animate);
  };
  
  rafId = requestAnimationFrame(animate);
  
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
}

// ============================================
// 性能检测
// ============================================

export function measureFPS(callback: (fps: number) => void, duration: number = 1000) {
  let frameCount = 0;
  const startTime = performance.now();
  let rafId: number;
  
  const count = () => {
    frameCount++;
    const elapsed = performance.now() - startTime;
    
    if (elapsed >= duration) {
      const fps = Math.round((frameCount / elapsed) * 1000);
      callback(fps);
    } else {
      rafId = requestAnimationFrame(count);
    }
  };
  
  rafId = requestAnimationFrame(count);
  
  return () => cancelAnimationFrame(rafId);
}

// ============================================
// 检查是否支持减少动画
// ============================================

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================
// CSS 动画类生成器
// ============================================

export function generateGPUAcceleratedStyles(): string {
  return `
    .gpu-accelerated {
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000px;
      will-change: transform, opacity;
    }
    
    .gpu-accelerated-content {
      contain: layout style paint;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .gpu-accelerated,
      .gpu-accelerated-content {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
    }
  `;
}
