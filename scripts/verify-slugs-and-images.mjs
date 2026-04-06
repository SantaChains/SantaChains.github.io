#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('=== 全面验证 Slug 和图片逻辑 ===\n');

const postsDir = path.join(projectRoot, 'src/posts/content');
const srcImagesDir = path.join(projectRoot, 'src/posts/images');
const publicImagesDir = path.join(projectRoot, 'public/posts/images');

// 1. 检查文章文件
console.log('1. 文章文件检查:');
const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
const slugMap = new Map();
const slugs = [];
let hasDuplicateSlugs = false;

postFiles.forEach(file => {
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(content);
  
  const fileSlug = file.replace(/\.md$/, '');
  const frontmatterSlug = data.slug;
  const actualSlug = frontmatterSlug || fileSlug;
  
  console.log(`   📄 ${file}`);
  console.log(`      文件名: ${fileSlug}`);
  console.log(`      frontmatter slug: ${frontmatterSlug || '(无)'}`);
  console.log(`      实际使用 slug: ${actualSlug}`);
  
  // 检查重复
  if (slugMap.has(actualSlug)) {
    console.log(`      ⚠️  警告: slug "${actualSlug}" 与 "${slugMap.get(actualSlug)}" 重复!`);
    hasDuplicateSlugs = true;
  } else {
    slugMap.set(actualSlug, file);
  }
  
  slugs.push(actualSlug);
  console.log();
});

if (hasDuplicateSlugs) {
  console.log('❌ 发现重复的 slug!');
} else {
  console.log('✅ 所有 slug 唯一\n');
}

// 2. 检查图片文件
console.log('2. 图片文件检查:');
console.log(`   src/posts/images/:`);
if (fs.existsSync(srcImagesDir)) {
  const srcImages = fs.readdirSync(srcImagesDir).filter(f => !fs.statSync(path.join(srcImagesDir, f)).isDirectory());
  srcImages.forEach(img => console.log(`      - ${img}`));
  console.log(`      总计: ${srcImages.length} 张图片\n`);
} else {
  console.log('      (目录不存在)\n');
}

console.log(`   public/posts/images/:`);
if (fs.existsSync(publicImagesDir)) {
  const publicImages = fs.readdirSync(publicImagesDir).filter(f => !fs.statSync(path.join(publicImagesDir, f)).isDirectory());
  publicImages.forEach(img => console.log(`      - ${img}`));
  console.log(`      总计: ${publicImages.length} 张图片\n`);
} else {
  console.log('      (目录不存在)\n');
}

// 3. 检查文章中引用的图片
console.log('3. 文章图片引用检查:');
const referencedImages = new Set();

postFiles.forEach(file => {
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(content);
  
  console.log(`   📄 ${file}:`);
  
  // 检查 banner
  if (data.banner) {
    console.log(`      banner: ${data.banner}`);
    const bannerImg = path.basename(data.banner.replace(/\[\[|\]\]/g, ''));
    referencedImages.add(bannerImg);
  }
  
  // 检查内容中的图片
  const contentImages = content.match(/!\[.*?\]\((.*?)\)|!\[\[(.*?)\]\]/g) || [];
  contentImages.forEach(img => {
    let imgFile;
    if (img.includes('[[')) {
      imgFile = img.match(/!\[\[(.*?)\]\]/)?.[1];
    } else {
      imgFile = img.match(/!\[.*?\]\((.*?)\)/)?.[1];
    }
    if (imgFile) {
      const basename = path.basename(imgFile);
      referencedImages.add(basename);
      console.log(`      内容图片: ${basename}`);
    }
  });
  console.log();
});

console.log(`   引用的图片总数: ${referencedImages.size}\n`);

// 4. 验证图片是否存在
console.log('4. 图片存在性验证:');
const srcImageFiles = fs.existsSync(srcImagesDir) 
  ? new Set(fs.readdirSync(srcImagesDir).filter(f => !fs.statSync(path.join(srcImagesDir, f)).isDirectory()))
  : new Set();

let missingImages = false;
referencedImages.forEach(img => {
  if (srcImageFiles.has(img)) {
    console.log(`   ✅ ${img}`);
  } else {
    console.log(`   ❌ ${img} (缺失!)`);
    missingImages = true;
  }
});

console.log();
if (missingImages) {
  console.log('❌ 发现缺失的图片!');
} else {
  console.log('✅ 所有引用的图片都存在\n');
}

console.log('=== 验证完成 ===');

// 返回状态码用于 CI
process.exit(missingImages || hasDuplicateSlugs ? 1 : 0);
