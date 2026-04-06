#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const srcImagesDir = path.join(projectRoot, 'src/posts/images');
const publicImagesDir = path.join(projectRoot, 'public/posts/images');

console.log('=== 复制图片 ===\n');

// 确保源目录存在
if (!fs.existsSync(srcImagesDir)) {
  console.log(`源目录不存在: ${srcImagesDir}`);
  process.exit(0);
}

// 确保目标目录存在
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
  console.log(`创建目标目录: ${publicImagesDir}`);
}

// 递归复制目录
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  let copiedCount = 0;
  let skippedCount = 0;

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      const result = copyDirectory(srcPath, destPath);
      copiedCount += result.copied;
      skippedCount += result.skipped;
    } else {
      // 检查是否需要复制（比较修改时间）
      let needsCopy = true;
      if (fs.existsSync(destPath)) {
        const srcStat = fs.statSync(srcPath);
        const destStat = fs.statSync(destPath);
        if (srcStat.mtimeMs <= destStat.mtimeMs && srcStat.size === destStat.size) {
          needsCopy = false;
          skippedCount++;
        }
      }

      if (needsCopy) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✅ 复制: ${entry.name}`);
        copiedCount++;
      } else {
        console.log(`  ⏭️  跳过: ${entry.name} (未变化)`);
      }
    }
  }

  return { copied: copiedCount, skipped: skippedCount };
}

const result = copyDirectory(srcImagesDir, publicImagesDir);

console.log();
console.log(`=== 完成 ===`);
console.log(`复制: ${result.copied} 个文件`);
console.log(`跳过: ${result.skipped} 个文件（未变化）`);
console.log(`总计: ${result.copied + result.skipped} 个文件`);
