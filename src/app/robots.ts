import { MetadataRoute } from 'next';

/**
 * 生成 robots.txt
 * 指导搜索引擎爬虫正确访问网站
 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/_next/', '/api/'],
      },
    ],
    sitemap: 'https://santachains.github.io/sitemap.xml',
  };
}
