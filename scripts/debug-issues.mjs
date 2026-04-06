#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const postsDir = path.join(projectRoot, 'src/posts/content');
const publicImagesDir = path.join(projectRoot, 'public/posts/images');
const srcImagesDir = path.join(projectRoot, 'src/posts/images');

console.log('=== 调试检查 ===\n');

// 1. 检查所有文章
console.log('1. 文章列表:');
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
const posts = [];

files.forEach(file => {
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const { data, content: body } = matter(content);
  
  const fileSlug = file.replace(/\.md$/, '');
  const frontmatterSlug = data.slug;
  const actualSlug = frontmatterSlug || fileSlug;
  
  console.log(`  - ${file}`);
  console.log(`    文件名 slug: ${fileSlug}`);
  console.log(`    frontmatter slug: ${frontmatterSlug || '(无)'}`);
  console.log(`    实际使用 slug: ${actualSlug}`);
  console.log(`    banner: ${data.banner || '(无)'}`);
  console.log();
  
  posts.push({
    file,
    fileSlug,
    frontmatterSlug,
    actualSlug,
    banner: data.banner
  });
});

// 2. 检查图片
console.log('2. 图片文件检查:');
console.log('  public/posts/images/:');
if (fs.existsSync(publicImagesDir)) {
  const publicImages = fs.readdirSync(publicImagesDir);
  publicImages.forEach(img => console.log(`    - ${img}`));
} else {
  console.log('    (目录不存在)');
}

console.log('\n  src/posts/images/:');
if (fs.existsSync(srcImagesDir)) {
  const srcImages = fs.readdirSync(srcImagesDir);
  srcImages.forEach(img => console.log(`    - ${img}`));
} else {
  console.log('    (目录不存在)');
}

// 3. 检查问题
console.log('\n3. 问题诊断:');

// Rust 文章问题
const rustPost = posts.find(p => p.file === 'RUST核心特色.md');
if (rustPost) {
  console.log('\n  [Rust文章问题]');
  console.log(`    文件名: ${rustPost.file}`);
  console.log(`    frontmatter slug: ${rustPost.frontmatterSlug}`);
  console.log(`    问题: 当访问 /posts/rust 时，系统会尝试读取 rust.md，但实际文件名是 RUST核心特色.md`);
}

// 图片问题
console.log('\n  [图片加载问题]');
console.log(`    问题: 图片在 src/posts/images/ 中，但浏览器只能访问 public/ 目录下的文件`);
console.log(`    需要将图片从 src/posts/images/ 复制到 public/posts/images/`);

console.log('\n=== 检查完成 ===');
