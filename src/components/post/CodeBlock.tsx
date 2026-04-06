/**
 * 代码块组件 - 带复制功能
 */

'use client';

import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

/**
 * 代码块复制按钮
 */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-2 rounded-lg 
                 bg-white/10 hover:bg-white/20 
                 dark:bg-black/20 dark:hover:bg-black/30
                 transition-all duration-200
                 text-foreground/70 hover:text-foreground
                 opacity-0 group-hover:opacity-100
                 focus:opacity-100"
      title={copied ? '已复制' : '复制代码'}
      aria-label={copied ? '已复制' : '复制代码'}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

/**
 * 代码块组件
 */
export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="group relative">
      {/* 语言标签 */}
      {language && (
        <div className="absolute top-0 left-4 px-2 py-1 text-xs 
                        bg-muted text-muted-foreground 
                        rounded-b-md font-mono">
          {language}
        </div>
      )}
      
      {/* 复制按钮 */}
      <CopyButton code={code} />
      
      {/* 代码内容 */}
      <pre className="code-block pt-8">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
