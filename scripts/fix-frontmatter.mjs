#!/usr/bin/env node

/**
 * 修复文章 frontmatter 格式错误
 * 问题：重复的 --- 分隔符，只有 banner 字段在第一段
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const postsDir = path.join(projectRoot, 'src/posts/content');

console.log('=== 修复 Frontmatter 格式 ===\n');

const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
let fixedCount = 0;

for (const file of postFiles) {
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // 检查是否有重复的 frontmatter（--- 开头，只有 banner，然后又是 ---）
  const duplicateFrontmatterRegex = /^---\s*\nbanner:\s*"[^"]+"\s*\n---\s*\n---/m;

  if (duplicateFrontmatterRegex.test(content)) {
    console.log(`🔧 修复: ${file}`);

    // 提取第一个 frontmatter 中的 banner
    const firstBannerMatch = content.match(/^---\s*\n(banner:\s*"[^"]+")\s*\n---/m);
    const bannerLine = firstBannerMatch ? firstBannerMatch[1] : '';

    // 移除第一个错误的 frontmatter
    let fixedContent = content.replace(/^---\s*\nbanner:\s*"[^"]+"\s*\n---\s*\n/, '');

    // 在第二个 frontmatter 中插入 banner（如果不存在）
    if (bannerLine && !fixedContent.match(/^---\s*\n[\s\S]*?banner:/m)) {
      fixedContent = fixedContent.replace(
        /^(---\s*\n)/,
        `---\n${bannerLine}\n`
      );
    }

    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`   ✅ 已修复\n`);
    fixedCount++;
  }
}

if (fixedCount === 0) {
  console.log('✅ 没有发现需要修复的文件');
} else {
  console.log(`=== 完成 ===`);
  console.log(`修复了 ${fixedCount} 个文件`);
}
