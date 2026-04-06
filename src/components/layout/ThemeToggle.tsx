'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('santachains-theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }

    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolvedTheme = savedTheme === 'system' || !savedTheme ? systemTheme : savedTheme;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, []);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    localStorage.setItem('santachains-theme', newTheme);
    setThemeState(newTheme);

    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolvedTheme = newTheme === 'system' ? systemTheme : newTheme;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  };

  const getResolvedTheme = (): 'light' | 'dark' => {
    if (!mounted) return 'light';
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-muted text-muted-foreground"
        aria-label="切换主题"
      >
        <Sun className="w-5 h-5" />
      </button>
    );
  }

  const resolvedTheme = getResolvedTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
        aria-label="切换主题"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>

      {isMenuOpen && (
        <>
          {/* 点击外部关闭 */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* 主题菜单 */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-lg p-1 min-w-[140px]">
            <button
              onClick={() => {
                setTheme('light');
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                theme === 'light' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>亮色模式</span>
            </button>
            <button
              onClick={() => {
                setTheme('dark');
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                theme === 'dark' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>暗色模式</span>
            </button>
            <button
              onClick={() => {
                setTheme('system');
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                theme === 'system' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>跟随系统</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
