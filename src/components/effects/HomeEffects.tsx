'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * 主页专属视觉效果组件 - 高性能优化版
 * 
 * 包含:
 * 1. 水波纹效果 - 点击时产生涟漪
 * 2. 樱花飘落 - 使用 Canvas 实现高性能粒子系统
 * 
 * 性能优化:
 * - 使用单个 Canvas 渲染所有效果
 * - requestAnimationFrame 节流
 * - 对象池复用粒子
 * - 减少粒子数量
 * - 使用 transform 代替位置属性
 */

// ============================================
// 樱花粒子系统
// ============================================

interface SakuraPetal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  swayOffset: number;
  swaySpeed: number;
  color: string;
  active: boolean;
}

// ============================================
// 水波纹效果
// ============================================

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  lineWidth: number;
  active: boolean;
}

class EffectsSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private petals: SakuraPetal[] = [];
  private ripples: Ripple[] = [];
  private animationId: number | null = null;
  private lastTime = 0;
  private spawnTimer = 0;
  private isActive = true;
  private dpr = 1;
  private frameCount = 0;
  
  // 配置 - 优化性能
  private config = {
    maxPetals: 25,        // 减少花瓣数量
    spawnRate: 400,       // 降低生成频率
    maxRipples: 8,        // 最大波纹数量
    frameSkip: 1,         // 每帧都渲染
    colors: [
      'rgba(255, 192, 203, 0.7)',
      'rgba(255, 182, 193, 0.6)',
      'rgba(255, 240, 245, 0.5)',
      'rgba(255, 228, 225, 0.6)',
    ],
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    
    // 初始化对象池
    this.initPools();
    
    this.resize();
    this.start();
    this.bindEvents();
  }

  private initPools() {
    // 初始化花瓣池
    for (let i = 0; i < this.config.maxPetals; i++) {
      this.petals.push({
        x: 0, y: 0, size: 0, speedY: 0, speedX: 0,
        rotation: 0, rotationSpeed: 0, opacity: 0,
        swayOffset: 0, swaySpeed: 0, color: '', active: false,
      });
    }

    // 初始化波纹池
    for (let i = 0; i < this.config.maxRipples; i++) {
      this.ripples.push({
        x: 0, y: 0, radius: 0, maxRadius: 0,
        opacity: 0, lineWidth: 0, active: false,
      });
    }
  }

  resize() {
    // 限制 DPR 以减少渲染负担
    this.dpr = Math.min(window.devicePixelRatio, 1.5);
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  private spawnPetal(): void {
    // 寻找非活跃花瓣
    const petal = this.petals.find(p => !p.active);
    if (!petal) return;

    petal.x = Math.random() * window.innerWidth;
    petal.y = -20;
    petal.size = Math.random() * 6 + 4; // 4-10px
    petal.speedY = Math.random() * 1 + 0.5; // 0.5-1.5
    petal.speedX = (Math.random() - 0.5) * 0.5;
    petal.rotation = Math.random() * Math.PI * 2;
    petal.rotationSpeed = (Math.random() - 0.5) * 0.02;
    petal.opacity = Math.random() * 0.3 + 0.3;
    petal.swayOffset = Math.random() * Math.PI * 2;
    petal.swaySpeed = Math.random() * 0.015 + 0.008;
    petal.color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
    petal.active = true;
  }

  private spawnRipple(x: number, y: number): void {
    // 寻找非活跃波纹
    const ripple = this.ripples.find(r => !r.active);
    if (!ripple) return;

    ripple.x = x;
    ripple.y = y;
    ripple.radius = 0;
    ripple.maxRadius = Math.random() * 60 + 80;
    ripple.opacity = 0.5;
    ripple.lineWidth = Math.random() * 1.5 + 1.5;
    ripple.active = true;
  }

  private boundHandleClick!: (e: MouseEvent) => void;
  private boundHandleTouch!: (e: TouchEvent) => void;
  private boundHandleMove!: (e: MouseEvent) => void;
  private lastMoveTime = 0;

  private bindEvents() {
    // 点击产生波纹
    this.boundHandleClick = (e: MouseEvent) => {
      this.spawnRipple(e.clientX, e.clientY);
      // 延迟产生第二个波纹
      setTimeout(() => this.spawnRipple(e.clientX, e.clientY), 150);
    };

    // 触摸产生波纹
    this.boundHandleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        this.spawnRipple(touch.clientX, touch.clientY);
      }
    };

    // 鼠标移动产生微弱波纹（节流）
    this.boundHandleMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - this.lastMoveTime > 500) { // 500ms 节流
        if (Math.random() > 0.8) { // 20% 概率
          this.spawnRipple(e.clientX, e.clientY);
        }
        this.lastMoveTime = now;
      }
    };

    window.addEventListener('click', this.boundHandleClick, { passive: true });
    window.addEventListener('touchstart', this.boundHandleTouch, { passive: true });
    window.addEventListener('mousemove', this.boundHandleMove, { passive: true });
  }

  unbindEvents() {
    window.removeEventListener('click', this.boundHandleClick);
    window.removeEventListener('touchstart', this.boundHandleTouch);
    window.removeEventListener('mousemove', this.boundHandleMove);
  }

  private update(deltaTime: number) {
    // 生成新花瓣
    this.spawnTimer += deltaTime;
    const activePetals = this.petals.filter(p => p.active).length;
    if (this.spawnTimer > this.config.spawnRate && activePetals < this.config.maxPetals) {
      this.spawnPetal();
      this.spawnTimer = 0;
    }

    // 更新花瓣位置
    for (const petal of this.petals) {
      if (!petal.active) continue;
      
      petal.y += petal.speedY * (deltaTime / 16);
      petal.swayOffset += petal.swaySpeed * (deltaTime / 16);
      petal.x += petal.speedX + Math.sin(petal.swayOffset) * 0.3;
      petal.rotation += petal.rotationSpeed * (deltaTime / 16);
      
      // 边界检查
      if (petal.y > window.innerHeight + 20) {
        petal.active = false;
      }
    }

    // 更新波纹
    for (const ripple of this.ripples) {
      if (!ripple.active) continue;
      
      ripple.radius += (deltaTime / 16) * 2.5;
      ripple.opacity -= (deltaTime / 16) * 0.006;
      
      if (ripple.opacity <= 0 || ripple.radius > ripple.maxRadius) {
        ripple.active = false;
      }
    }
  }

  private draw() {
    const { ctx } = this;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制波纹
    for (const ripple of this.ripples) {
      if (!ripple.active) continue;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 182, 193, ${ripple.opacity})`;
      ctx.lineWidth = ripple.lineWidth;
      ctx.stroke();
      ctx.restore();
    }

    // 绘制花瓣
    for (const petal of this.petals) {
      if (!petal.active) continue;
      
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.globalAlpha = petal.opacity;
      
      // 简化花瓣形状 - 使用椭圆代替贝塞尔曲线
      ctx.fillStyle = petal.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size * 0.5, petal.size, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  private loop = (currentTime: number) => {
    if (!this.isActive) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.frameCount++;
    
    // 更新逻辑
    this.update(deltaTime);
    
    // 渲染（根据 frameSkip 决定是否跳过）
    if (this.frameCount % this.config.frameSkip === 0) {
      this.draw();
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  start() {
    this.isActive = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();
    this.unbindEvents();
    this.petals = [];
    this.ripples = [];
  }
}

// ============================================
// React 组件
// ============================================

export function HomeEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<EffectsSystem | null>(null);

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    systemRef.current?.resize();
  }, []);

  useEffect(() => {
    // 检查用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 检查是否为触摸设备（减少效果）
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 初始化系统
    if (canvasRef.current && !systemRef.current) {
      systemRef.current = new EffectsSystem(canvasRef.current);
      
      // 触摸设备减少粒子数量
      if (isTouchDevice) {
        // 可以通过修改 config 来减少效果
      }
    }

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      systemRef.current?.destroy();
      systemRef.current = null;
    };
  }, [handleResize]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ 
        opacity: 0.8,
      }}
    />
  );
}

export default HomeEffects;
