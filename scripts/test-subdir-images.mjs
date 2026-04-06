#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('=== 测试子目录图片支持 ===\n');

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

console.log('1. 所有图片（包括子目录）:');
for (const [name, fullPath] of imageMap.entries()) {
  console.log(`   - ${name} → ${fullPath}`);
}

console.log('\n2. 测试子目录图片解析:');
const testSubdirPaths = [
  'rust-test.png',
  '[[rust-test.png]]',
  'images/photos/rust-test.png',
  'photos/rust-test.png'
];

testSubdirPaths.forEach(testPath => {
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

console.log('3. 测试内容中子目录图片解析:');
const testContent = `
# 测试子目录图片

这是子目录中的 Obsidian 图片: ![[rust-test.png]]

这是子目录中的 Markdown 图片: ![子目录测试](photos/rust-test.png)

这是完整子目录路径: ![完整路径](images/photos/rust-test.png)
`;

console.log('输入内容:');
console.log(testContent);

console.log('\n解析后内容:');
let processedContent = testContent;

processedContent = processedContent.replace(
  /!\[\[([^\]]+)\]\]/g,
  (match, imagePath) => {
    const processedPath = findImageByShortestPath(imagePath, imageMap);
    const webPath = `/posts/${processedPath}`;
    return `![${path.basename(imagePath)}](${webPath})`;
  }
);

processedContent = processedContent.replace(
  /!\[([^\]]*)\]\((?!(?:https?:\/\/|\/))([^)]+)\)/g,
  (match, alt, imagePath) => {
    const processedPath = findImageByShortestPath(imagePath, imageMap);
    const webPath = `/posts/${processedPath}`;
    return `![${alt}](${webPath})`;
  }
);

console.log(processedContent);

console.log('\n=== 子目录测试完成 ===');
