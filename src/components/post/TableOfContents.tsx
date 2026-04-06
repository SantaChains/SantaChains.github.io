'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TOCItem {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

/**
 * 生成标题 ID (与 markdownService.slugify 逻辑一致)
 */
function slugify(text: string): string {
  return text
    .replace(/[^\w\s\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * 目录导航组件
 * 
 * 功能:
 * 1. 自动从 Markdown 内容提取标题
 * 2. 点击平滑滚动到对应位置
 * 3. 高亮当前阅读位置
 * 4. 响应式设计
 */
export function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // 提取标题
  useEffect(() => {
    const headings: TOCItem[] = [];
    const lines = content.split('\n');
    const idCount = new Map<string, number>();
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        
        // 生成 id (与 markdownService.slugify 一致)
        let baseId = slugify(text);
        
        // 如果 id 为空，使用默认 id
        if (!baseId) {
          baseId = `heading-${headings.length}`;
        }
        
        // 处理重复的 id
        const count = idCount.get(baseId) || 0;
        const id = count > 0 ? `${baseId}-${count}` : baseId;
        idCount.set(baseId, count + 1);
        
        headings.push({ level, text, id });
      }
    });

    setItems(headings);
  }, [content]);

  // 监听滚动位置
  useEffect(() => {
    if (items.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      // 找到当前可见的标题
      for (let i = items.length - 1; i >= 0; i--) {
        const element = document.getElementById(items[i].id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(items[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初始检查

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  // 点击跳转
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`toc-nav ${className}`}
    >
      <div className="bg-card/80 backdrop-blur-md rounded-xl p-6 border border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
          目录
        </h3>
        
        <ul className="space-y-2">
          {items.map((item, index) => (
            <motion.li
              key={`${item.id}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
            >
              <button
                onClick={() => handleClick(item.id)}
                className={`
                  text-left text-sm transition-all duration-200 hover:text-primary
                  ${activeId === item.id 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {activeId === item.id && (
                    <motion.span
                      layoutId="toc-indicator"
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  )}
                  <span className={activeId === item.id ? 'ml-0' : 'ml-3.5'}>
                    {item.text}
                  </span>
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.nav>
  );
}
