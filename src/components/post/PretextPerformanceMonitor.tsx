'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPretextOptimizer } from '@/lib/pretext-optimizer';

interface PerformanceData {
  prepareTime: number;
  layoutTime: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  contentCount: number;
  totalLayouts: number;
}

interface PretextPerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Pretext 性能监控面板
 * 
 * 功能:
 * 1. 实时显示缓存命中率
 * 2. 监控渲染时间
 * 3. 显示缓存统计
 * 4. 一键清空缓存
 */
export function PretextPerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right',
}: PretextPerformanceMonitorProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const updateData = useCallback(() => {
    const optimizer = getPretextOptimizer();
    const metrics = optimizer.getMetrics();
    const stats = optimizer.getCacheStats();

    setData({
      ...metrics,
      hitRate: stats.hitRate,
      contentCount: stats.contentCount,
      totalLayouts: stats.totalLayouts,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 初始更新
    updateData();

    // 定时更新
    const interval = setInterval(updateData, 1000);

    return () => clearInterval(interval);
  }, [enabled, updateData]);

  const handleClearCache = useCallback(() => {
    const optimizer = getPretextOptimizer();
    optimizer.clear();
    updateData();
  }, [updateData]);

  const handleResetMetrics = useCallback(() => {
    const optimizer = getPretextOptimizer();
    optimizer.resetMetrics();
    updateData();
  }, [updateData]);

  if (!enabled || !isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 font-mono text-xs`}
      style={{ maxWidth: '280px' }}
    >
      <div
        className="bg-card/95 backdrop-blur-md rounded-lg border border-border shadow-lg overflow-hidden"
        style={{
          transition: 'all 0.3s ease',
        }}
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold">Pretext 性能监控</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="p-1 hover:bg-muted rounded"
            >
              ×
            </button>
            <span className="transform transition-transform" style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              ▼
            </span>
          </div>
        </div>

        {/* 内容 */}
        {isExpanded && data && (
          <div className="p-3 space-y-2">
            {/* 缓存命中率 */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">缓存命中率</span>
              <span
                className={`font-bold ${
                  data.hitRate > 0.8 ? 'text-green-500' : data.hitRate > 0.5 ? 'text-yellow-500' : 'text-red-500'
                }`}
              >
                {(data.hitRate * 100).toFixed(1)}%
              </span>
            </div>

            {/* 进度条 */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${data.hitRate * 100}%` }}
              />
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <div className="text-muted-foreground">缓存内容</div>
                <div className="font-semibold">{data.contentCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">布局缓存</div>
                <div className="font-semibold">{data.totalLayouts}</div>
              </div>
              <div>
                <div className="text-muted-foreground">准备时间</div>
                <div className="font-semibold">{data.prepareTime.toFixed(1)}ms</div>
              </div>
              <div>
                <div className="text-muted-foreground">布局时间</div>
                <div className="font-semibold">{data.layoutTime.toFixed(1)}ms</div>
              </div>
              <div>
                <div className="text-muted-foreground">缓存命中</div>
                <div className="font-semibold text-green-500">{data.cacheHits}</div>
              </div>
              <div>
                <div className="text-muted-foreground">缓存未命中</div>
                <div className="font-semibold text-red-500">{data.cacheMisses}</div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={handleClearCache}
                className="flex-1 px-2 py-1 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors"
              >
                清空缓存
              </button>
              <button
                onClick={handleResetMetrics}
                className="flex-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                重置统计
              </button>
            </div>
          </div>
        )}

        {/* 折叠状态显示关键信息 */}
        {!isExpanded && data && (
          <div className="px-3 py-2 flex justify-between items-center">
            <span className="text-muted-foreground">命中率</span>
            <span className="font-bold text-primary">
              {(data.hitRate * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export type { PerformanceData };
