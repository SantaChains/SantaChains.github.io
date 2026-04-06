#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('=== 全面项目检查 ===\n');

const postsDir = path.join(projectRoot, 'src/posts/content');
const srcImagesDir = path.join(projectRoot, 'src/posts/images');
const publicImagesDir = path.join(projectRoot, 'public/posts/images');
const distDir = path.join(projectRoot, 'dist');

let issuesFound = 0;

function check(label, condition, message) {
  if (!condition) {
    console.log(`❌ ${label}: ${message}`);
    issuesFound++;
  } else {
    console.log(`✅ ${label}`);
  }
}

// 1. 基础配置检查
console.log('1. 基础配置检查:');
check('next.config.ts 存在', fs.existsSync(path.join(projectRoot, 'next.config.ts')), '文件缺失');
check('package.json 存在', fs.existsSync(path.join(projectRoot, 'package.json')), '文件缺失');
check('.github/workflows/deploy.yml 存在', fs.existsSync(path.join(projectRoot, '.github/workflows/deploy.yml')), '工作流文件缺失');
console.log();

// 2. 文章目录检查
console.log('2. 文章目录检查:');
check('文章目录存在', fs.existsSync(postsDir), '目录不存在');

if (fs.existsSync(postsDir)) {
  const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  check('有文章文件', postFiles.length > 0, '没有找到文章');
  console.log(`   文章数量: ${postFiles.length}`);
}
console.log();

// 3. 图片检查
console.log('3. 图片检查:');
check('源图片目录存在', fs.existsSync(srcImagesDir), 'src/posts/images/ 不存在');

if (fs.existsSync(srcImagesDir)) {
  const srcImages = fs.readdirSync(srcImagesDir).filter(f => !fs.statSync(path.join(srcImagesDir, f)).isDirectory());
  console.log(`   源图片数量: ${srcImages.length}`);
}

check('public 图片目录存在', fs.existsSync(publicImagesDir), 'public/posts/images/ 不存在 (构建前正常)');
console.log();

// 4. 构建输出检查
console.log('4. 构建输出检查:');
check('dist 目录存在', fs.existsSync(distDir), '请先运行 npm run build');

if (fs.existsSync(distDir)) {
  check('.nojekyll 存在', fs.existsSync(path.join(distDir, '.nojekyll')), '.nojekyll 文件缺失');
  check('index.html 存在', fs.existsSync(path.join(distDir, 'index.html')), '首页缺失');
  
  const distPostsDir = path.join(distDir, 'posts');
  check('dist/posts 存在', fs.existsSync(distPostsDir), '文章目录缺失');
  
  if (fs.existsSync(distPostsDir)) {
    const distImagesDir = path.join(distPostsDir, 'images');
    check('dist/posts/images 存在', fs.existsSync(distImagesDir), '图片目录缺失');
  }
}
console.log();

// 5. 文章内容检查
console.log('5. 文章内容检查:');
if (fs.existsSync(postsDir)) {
  const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  const slugMap = new Map();
  let slugDuplicates = 0;
  
  postFiles.forEach(file => {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(content);
    
    const fileSlug = file.replace(/\.md$/, '');
    const actualSlug = data.slug || fileSlug;
    
    if (slugMap.has(actualSlug)) {
      console.log(`   ⚠️  重复 slug: ${actualSlug} (${file} 和 ${slugMap.get(actualSlug)})`);
      slugDuplicates++;
    } else {
      slugMap.set(actualSlug, file);
    }
    
    if (!data.title) {
      console.log(`   ⚠️  缺少 title: ${file}`);
      issuesFound++;
    }
  });
  
  check('无重复 slug', slugDuplicates === 0, `发现 ${slugDuplicates} 个重复 slug`);
}
console.log();

// 6. Git 相关检查
console.log('6. Git 配置检查:');
check('.gitignore 存在', fs.existsSync(path.join(projectRoot, '.gitignore')), '文件缺失');

if (fs.existsSync(path.join(projectRoot, '.gitignore'))) {
  const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
  check('.gitignore 包含 dist/', gitignore.includes('/dist/'), '缺少 dist/ 忽略规则');
  check('.gitignore 包含 node_modules/', gitignore.includes('/node_modules'), '缺少 node_modules/ 忽略规则');
}
console.log();

// 总结
console.log('=== 检查完成 ===');
if (issuesFound === 0) {
  console.log('🎉 所有检查通过！项目准备就绪！');
} else {
  console.log(`⚠️  发现 ${issuesFound} 个问题需要修复`);
}

process.exit(issuesFound > 0 ? 1 : 0);
