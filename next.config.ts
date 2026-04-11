import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出配置 - 用于 GitHub Pages 托管
  output: 'export',

  // 输出目录（与 deploy.yml 一致）
  distDir: 'dist',

  // 图片优化配置
  // 注意：静态导出时必须设置 unoptimized: true
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.shields.io',
        pathname: '/**',
      },
    ],
  },

  // 启用 React 严格模式
  reactStrictMode: true,

  // 实验性优化配置
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  // 构建性能配置
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
