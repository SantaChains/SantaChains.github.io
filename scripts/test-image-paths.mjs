#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('=== 图片路径解析功能测试 ===\n');

// 模拟构建图片路径映射
function buildImagePathMap() {
  const map = new Map();
  const imagesDir = path.join(projectRoot, 'public', 'posts', 'images');
  
  if (!fs.existsSync(imagesDir)) {
    return map;
  }

  function scanDirectory(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        scanDirectory(path.join(dir, entry.name), entryRelativePath);
      } else if (entry.isFile()) {
        map.set(entry.name.toLowerCase(), entryRelativePath);
      }
    }
  }

  scanDirectory(imagesDir);
  return map;
}

function findImageByShortestPath(filename, map) {
  const basename = path.basename(filename).toLowerCase();
  
  if (map.has(basename)) {
    return `images/${map.get(basename)}`;
  }
  
  if (filename.includes('/')) {
    const cleanPath = filename.replace(/^\.\//, '').replace(/^images\//, '');
    return `images/${cleanPath}`;
  }
  
  return `images/${filename}`;
}

const imageMap = buildImagePathMap();

console.log('1. 可用图片文件:');
for (const [name, fullPath] of imageMap.entries()) {
  console.log(`   - ${name} → ${fullPath}`);
}

console.log('\n2. 测试 banner 路径解析:');
const testBannerPaths = [
  'rustprograming.png',
  '[[rustprograming.png]]',
  'images/rustprograming.png',
  './images/rustprograming.png',
  'person1.jpg',
  '[[person1.jpg]]'
];

testBannerPaths.forEach(testPath => {
  let result;
  
  if (testPath.startsWith('[[') && testPath.endsWith(']]')) {
    const filename = testPath.slice(2, -2);
    result = findImageByShortestPath(filename, imageMap);
  } else if (testPath.startsWith('./images/')) {
    const filename = testPath.replace('./images/', '');
    result = findImageByShortestPath(filename, imageMap);
  } else if (testPath.startsWith('images/')) {
    const filename = testPath.replace('images/', '');
    result = findImageByShortestPath(filename, imageMap);
  } else {
    result = findImageByShortestPath(testPath, imageMap);
  }
  
  console.log(`   输入: ${testPath}`);
  console.log(`   输出: ${result}`);
  console.log();
});

console.log('3. 测试内容图片解析:');
const testContent = `
# 测试文章

这是一张 Obsidian 图片: ![[rustprograming.png]]

这是一张相对路径图片: ![示例](./images/person1.jpg)

这是一张完整路径图片: ![示例2](images/person2.jpg)

这是一张最短路径图片: ![示例3](289972.jpg)

这是一张外部图片: ![外部](https://example.com/image.jpg)
`;

console.log('输入内容:');
console.log(testContent);

console.log('\n解析后内容:');
let processedContent = testContent;

// 模拟 processContentImages 逻辑
processedContent = processedContent.replace(
  /!\[\[([^\]]+)\]\]/g,
  (match, imagePath) => {
    const processedPath = findImageByShortestPath(imagePath, imageMap);
    const webPath = `/posts/${processedPath}`;
    return `![${path.basename(imagePath)}](${webPath})`;
  }
);

processedContent = processedContent.replace(
  /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g,
  (match, alt, imagePath) => {
    const processedPath = findImageByShortestPath(imagePath, imageMap);
    const webPath = `/posts/${processedPath}`;
    return `![${alt}](${webPath})`;
  }
);

processedContent = processedContent.replace(
  /!\[([^\]]*)\]\(images\/([^)]+)\)/g,
  (match, alt, imagePath) => {
    const processedPath = findImageByShortestPath(imagePath, imageMap);
    const webPath = `/posts/${processedPath}`;
    return `![${alt}](${webPath})`;
  }
);

processedContent = processedContent.replace(
  /!\[([^\]]*)\]\((?!(?:https?:\/\/|\/))([^\/)]+\.[^\/)]+)\)/g,
  (match, alt, imagePath) => {
    const processedPath = findImageByShortestPath(imagePath, imageMap);
    const webPath = `/posts/${processedPath}`;
    return `![${alt}](${webPath})`;
  }
);

console.log(processedContent);

console.log('\n=== 测试完成 ===');
