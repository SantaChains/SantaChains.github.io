/**
 * 验证所有文章 slug 生成脚本
 * 用于排查静态生成问题
 */

import { getAllPostMetas, getPostBySlug } from '../src/lib/services/index.js';

console.log('🔍 验证文章 slug 生成...\n');

const posts = getAllPostMetas();

console.log(`📄 共找到 ${posts.length} 篇文章:\n`);

posts.forEach((post, index) => {
  console.log(`${index + 1}. ${post.title}`);
  console.log(`   slug: ${post.slug}`);
  console.log(`   分类: ${post.category}`);
  console.log(`   标签: ${post.tags.join(', ')}`);
  console.log('');
});

console.log('\n🔍 验证 slug 可访问性...\n');

let allValid = true;
posts.forEach((post) => {
  const foundPost = getPostBySlug(post.slug);
  if (foundPost) {
    console.log(`✅ ${post.slug} - 可访问`);
  } else {
    console.log(`❌ ${post.slug} - 无法访问`);
    allValid = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ 所有文章 slug 验证通过！');
} else {
  console.log('❌ 部分文章 slug 存在问题');
  process.exit(1);
}
