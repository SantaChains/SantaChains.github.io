# @chenglou/pretext API 文档与最佳实践

## 简介

Pretext 是一个纯 JavaScript/TypeScript 库，用于多行文本测量和布局。它通过 Canvas API 缓存字符宽度，实现纯算术计算，完全避免 DOM 回流（reflow），性能比传统 DOM 测量快约 500 倍。

**核心优势**:
- 无 DOM 操作，零布局回流
- 支持所有语言（包括 emoji、混合双向文本）
- 适用于虚拟列表、聊天 UI、数据网格等性能敏感场景
- 可渲染到 DOM、Canvas、SVG

---

## 安装

```bash
npm install @chenglou/pretext
```

---

## 类型定义

```typescript
// 从包中导出的类型
import type {
  PreparedText,              // prepare() 返回的不透明句柄
  PreparedTextWithSegments,  // prepareWithSegments() 返回的句柄
  LayoutLine,                // 单行布局信息
  LineInfo,                  // walkLineRanges / layoutNextLine 返回的行信息
} from '@chenglou/pretext';

// LayoutLine 结构（本地代码中使用）
interface LayoutLine {
  text: string;   // 该行文本内容
  width: number;  // 该行宽度（像素）
}

// LineInfo 结构（包含游标信息）
interface LineInfo {
  text: string;
  width: number;
  start: Cursor;
  end: Cursor;
}

// Cursor 游标结构
interface Cursor {
  segmentIndex: number;  // 段落中的片段索引
  graphemeIndex: number; // 片段中的字素索引
}
```

---

## 核心 API

### 1. 基础测量 API

#### `prepare(text, font, options?)`

**功能**: 一次性分析文本，返回不透明句柄供后续 layout 使用

**入参**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `text` | `string` | 待测量文本 |
| `font` | `string` | 字体声明，格式同 Canvas font（如 `'16px Inter'`） |
| `options` | `object` | 可选配置 |
| `options.whiteSpace` | `'normal' \| 'pre-wrap'` | 空白处理方式 |

**出参**: `PreparedText` - 不透明句柄

```typescript
import { prepare } from '@chenglou/pretext';

// 基础用法
const prepared = prepare('Hello World', '16px Inter');

// 保留换行和空格（textarea 模式）
const codePrepared = prepare('line1\nline2', '14px Mono', { whiteSpace: 'pre-wrap' });
```

#### `layout(prepared, maxWidth, lineHeight)`

**功能**: 纯算术计算文本高度和行数

**入参**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `prepared` | `PreparedText` | prepare 返回的句柄 |
| `maxWidth` | `number` | 容器最大宽度（像素） |
| `lineHeight` | `number` | 行高（像素） |

**出参**:
```typescript
{
  height: number;      // 总高度（像素）
  lineCount: number;   // 总行数
}
```

```typescript
import { prepare, layout } from '@chenglou/pretext';

const prepared = prepare('长文本内容...', '16px Inter');
const { height, lineCount } = layout(prepared, 300, 24);
console.log(`高度: ${height}px, 行数: ${lineCount}`);
```

---

### 2. 行详情 API

#### `prepareWithSegments(text, font, options?)`

**功能**: 同 prepare，但返回更丰富的结构，用于手动布局

**出参**: `PreparedTextWithSegments` - 包含分段信息的句柄

#### `layoutWithLines(prepared, maxWidth, lineHeight)`

**功能**: 返回每行的详细布局信息

**出参**:
```typescript
{
  height: number;
  lineCount: number;
  lines: LayoutLine[];
}

// LayoutLine 结构
interface LayoutLine {
  text: string;   // 该行文本内容
  width: number;  // 该行宽度（像素）
}
```

```typescript
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

const prepared = prepareWithSegments('多行文本内容...', '16px Inter');
const { lines } = layoutWithLines(prepared, 200, 24);

lines.forEach((line, i) => {
  console.log(`第${i+1}行: "${line.text}" (${line.width}px)`);
});
```

---

### 3. 高级布局 API

#### `walkLineRanges(prepared, maxWidth, lineHeight, callback)`

**功能**: 逐行回调遍历，不构建字符串，用于查找最宽行

**入参**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `prepared` | `PreparedTextWithSegments` | prepareWithSegments 返回的句柄 |
| `maxWidth` | `number` | 容器最大宽度 |
| `lineHeight` | `number` | 行高（像素） |
| `callback` | `(line: LineInfo) => void` | 每行的回调函数 |

**LineInfo**:
```typescript
{
  text: string;
  width: number;
  start: Cursor;
  end: Cursor;
}

// Cursor 结构
interface Cursor {
  segmentIndex: number;
  graphemeIndex: number;
}
```

```typescript
import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext';

const prepared = prepareWithSegments('文本内容...', '16px Inter');
let maxLineWidth = 0;

walkLineRanges(prepared, 600, 24, (line) => {
  if (line.width > maxLineWidth) {
    maxLineWidth = line.width;
  }
});

// maxLineWidth 即为最紧凑的容器宽度（shrink-wrap）
console.log(`最紧宽度: ${maxLineWidth}px`);
```

#### `layoutNextLine(prepared, cursor, maxWidth)`

**功能**: 迭代器模式，逐行获取，适合宽度变化的流式布局

**入参**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `prepared` | `PreparedTextWithSegments` | prepareWithSegments 返回的句柄 |
| `cursor` | `Cursor` | 当前位置游标 `{ segmentIndex, graphemeIndex }` |
| `maxWidth` | `number` | 当前行可用宽度 |

**出参**: `LineInfo | null` - 行信息，无更多内容时返回 null

**Cursor 结构**:
```typescript
interface Cursor {
  segmentIndex: number;  // 段落中的片段索引
  graphemeIndex: number; // 片段中的字素索引
}
```

```typescript
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';

const prepared = prepareWithSegments('长文本内容...', '16px Inter');
let cursor: Cursor = { segmentIndex: 0, graphemeIndex: 0 };
let y = 0;

while (true) {
  // 宽度可动态变化（如图文混排）
  const width = y < 100 ? 200 : 400;
  const line = layoutNextLine(prepared, cursor, width);
  
  if (line === null) break;
  
  console.log(`"${line.text}" (${line.width}px)`);
  cursor = line.end;  // 关键：更新游标到下一行起点
  y += 24;
}
```

---

### 4. 缓存管理

#### `clearCache()`

**功能**: 清空 Pretext 内部缓存

```typescript
import { clearCache } from '@chenglou/pretext';

// 清理不再需要的缓存，释放内存
clearCache();
```

---

## 最佳实践

### 1. 性能优化核心原则

```typescript
// ✅ 正确：prepare 一次，layout 多次
const prepared = prepare(text, font);

// 窗口变化时只调用 layout，不重新 prepare
window.addEventListener('resize', () => {
  const { height } = layout(prepared, newWidth, lineHeight);
});

// ❌ 错误：每次 resize 都重新 prepare
window.addEventListener('resize', () => {
  const prepared = prepare(text, font);  // 重复工作，性能差！
  const { height } = layout(prepared, newWidth, lineHeight);
});
```

### 2. 字体同步

`font` 参数必须与 CSS 完全一致：

```css
/* CSS */
.text {
  font: italic 700 16px/1.5 "Inter", sans-serif;
}
```

```typescript
// Pretext - 必须完全匹配
const font = 'italic 700 16px Inter';
const prepared = prepare(text, font);
```

### 3. 缓存策略

```typescript
class PretextCache {
  private cache = new Map<string, PreparedTextWithSegments>();
  
  getOrPrepare(content: string, font: string) {
    const key = `${content}::${font}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    const prepared = prepareWithSegments(content, font);
    this.cache.set(key, prepared);
    return prepared;
  }
  
  clear() {
    this.cache.clear();
    clearCache(); // 同时清理 Pretext 内部缓存
  }
}
```

### 4. React 集成模式

```typescript
'use client';

import { useMemo, useEffect, useState } from 'react';
import { prepareWithSegments, layoutWithLines, type LayoutLine } from '@chenglou/pretext';

interface Props {
  content: string;
  width: number;
  lineHeight: number;
}

function TextMeasure({ content, width, lineHeight }: Props) {
  // useMemo 缓存 prepared，避免重复计算
  const prepared = useMemo(() => 
    prepareWithSegments(content, '16px Inter'), 
    [content]
  );
  
  const [lines, setLines] = useState<LayoutLine[]>([]);
  
  useEffect(() => {
    // width/lineHeight 变化时只执行 layout
    const result = layoutWithLines(prepared, width, lineHeight);
    setLines(result.lines);
  }, [prepared, width, lineHeight]);
  
  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} style={{ height: lineHeight }}>{line.text}</div>
      ))}
    </div>
  );
}
```

### 5. 虚拟列表集成

```typescript
// 计算每项高度
function getItemHeight(content: string, width: number): number {
  const prepared = prepare(content, '16px Inter');
  const { height } = layout(prepared, width, 24);
  return height;
}

// 批量预计算（初始化时）
function batchMeasure(items: string[], width: number): number[] {
  return items.map(content => {
    const prepared = prepare(content, '16px Inter');
    return layout(prepared, width, 24).height;
  });
}
```

### 6. Canvas 渲染

```typescript
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

function renderToCanvas(text: string, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const font = '18px Arial';
  
  const prepared = prepareWithSegments(text, font);
  const { lines } = layoutWithLines(prepared, 320, 26);
  
  ctx.font = font;
  lines.forEach((line, i) => {
    ctx.fillText(line.text, 10, (i + 1) * 26);
  });
}
```

### 7. Shrink-wrap 布局（聊天气泡）

```typescript
import { prepareWithSegments, walkLineRanges, layoutWithLines } from '@chenglou/pretext';

function getShrinkWrapWidth(text: string, font: string): number {
  const prepared = prepareWithSegments(text, font);
  let maxWidth = 0;
  
  // 先用大宽度试探
  walkLineRanges(prepared, 1000, (line) => {
    if (line.width > maxWidth) maxWidth = line.width;
  });
  
  return maxWidth;
}
```

---

## 性能对比

| 方案 | 1000次测量耗时 | 是否触发布局回流 |
|------|---------------|-----------------|
| DOM (getBoundingClientRect) | ~800ms | 是 |
| Pretext (首次 prepare) | ~50ms | 一次性 |
| Pretext (后续 layout) | ~1ms | 否 |

---

## 限制与注意事项

### 不支持的 CSS 特性
- `letter-spacing` - 字间距
- `word-spacing` - 词间距
- `text-transform` - 文本转换（uppercase/lowercase）
- 复杂 `line-height`（如百分比、无单位值）

### 使用建议
1. **字体必须精确匹配** - prepare 的 font 参数与实际渲染字体必须一致
2. **lineHeight 必须一致** - layout 的 lineHeight 与 CSS line-height 必须相同
3. **缓存 prepared 结果** - 相同文本不要重复 prepare
4. **resize 只调 layout** - 窗口变化时复用 prepared 句柄

---

## 本地仓库封装参考

本项目中的高级封装：

- [pretext-optimizer.ts](src/lib/pretext-optimizer.ts) - LRU 缓存 + 批量布局 + 性能监控
- [PretextContent.tsx](src/components/post/PretextContent.tsx) - React 组件封装，支持分片渲染
- [PretextArticle.tsx](src/components/post/PretextArticle.tsx) - 智能渲染模式选择
